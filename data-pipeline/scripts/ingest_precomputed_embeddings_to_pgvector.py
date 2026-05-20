"""Ingest precomputed embeddings + records into PostgreSQL + pgvector.

Input files:
- embeddings.npy  (N, D) float32
- records.jsonl   (N lines)

This script expects the NEW schema created by Flyway:
- documents(source_file ...)
- rag_chunks(document_id, chunk_index) unique key, plus content/page ranges/page_spans_json/metadata/embedding

It will:
1) Upsert into `documents` by `source_file`
2) Upsert into `rag_chunks` by (document_id, chunk_index)
"""

import argparse
import json
import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import psycopg


def vector_to_literal(vec: np.ndarray) -> str:
    return "[" + ",".join(f"{float(v):.8f}" for v in vec.tolist()) + "]"


def load_jsonl(path: str) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def ensure_json_str(value: Any) -> str:
    if value is None:
        return "[]"
    if isinstance(value, str):
        # Assume already JSON.
        return value
    return json.dumps(value, ensure_ascii=False)


def derive_title_from_source(source_file: str) -> str:
    base = os.path.basename(source_file)
    stem, _ = os.path.splitext(base)
    return stem


def ensure_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("SELECT to_regclass('public.documents'), to_regclass('public.rag_chunks');")
        docs, chunks = cur.fetchone()
        if docs is None or chunks is None:
            raise RuntimeError(
                "Missing tables `documents` and/or `rag_chunks`. Run Flyway migrations for the backend first."
            )
    conn.commit()


def normalize_record(r: Dict[str, Any]) -> Tuple[str, int, int, int, Optional[int], str, str, str]:
    source_file_name = r.get("source_file_name")
    if not source_file_name:
        raise ValueError("Record missing `source_file_name`")

    chunk_index_val = r.get("chunk_index")
    if chunk_index_val is None:
        # Backward compatibility: accept Kaggle export key `chunk_id`.
        chunk_index_val = r.get("chunk_id")
    if chunk_index_val is None:
        raise ValueError(f"Record for source_file_name={source_file_name} missing `chunk_index` (or legacy `chunk_id`)")
    chunk_index = int(chunk_index_val)

    page_start = int(r.get("page_start"))
    page_end = int(r.get("page_end"))

    content = r.get("content")
    if content is None:
        # Some legacy exports might use `text`.
        content = r.get("text")
    content = str(content) if content is not None else ""

    word_count_val = r.get("word_count")
    word_count = int(word_count_val) if word_count_val is not None else (len(content.split()) if content else 0)

    page_spans_json = ensure_json_str(r.get("page_spans_json", []))

    metadata_obj = r.get("metadata")
    if metadata_obj is None:
        metadata_obj = {}
    if not isinstance(metadata_obj, dict):
        metadata_obj = {"_raw": metadata_obj}

    # Preserve chunk_uid if present (not used as key anymore)
    if "chunk_uid" in r and "chunk_uid" not in metadata_obj:
        metadata_obj["chunk_uid"] = r.get("chunk_uid")

    metadata_json = ensure_json_str(metadata_obj)

    return (
        str(source_file_name),
        chunk_index,
        page_start,
        page_end,
        word_count,
        content,
        page_spans_json,
        metadata_json,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest precomputed embeddings to PostgreSQL + pgvector")
    parser.add_argument("--embeddings", required=True, help="Path to embeddings.npy")
    parser.add_argument("--records", required=True, help="Path to records.jsonl")

    parser.add_argument("--db-host", default="localhost", help="PostgreSQL host")
    parser.add_argument("--db-port", type=int, default=5432, help="PostgreSQL port")
    parser.add_argument("--db-name", default="chatbot_history_rag", help="PostgreSQL database name")
    parser.add_argument("--db-user", default="admin", help="PostgreSQL username")
    parser.add_argument("--db-password", default="admin", help="PostgreSQL password")

    parser.add_argument("--batch-size", type=int, default=256, help="DB upsert batch size")
    args = parser.parse_args()

    embeddings = np.load(args.embeddings)
    records = load_jsonl(args.records)

    if embeddings.ndim != 2:
        raise ValueError("embeddings.npy must be a 2D array [N, D]")
    if len(records) != embeddings.shape[0]:
        raise ValueError(f"records count ({len(records)}) != embeddings rows ({embeddings.shape[0]})")

    dim = int(embeddings.shape[1])
    if dim != 1024:
        raise ValueError(f"Expected embedding dim 1024 to match DB schema, got {dim}")

    conn = psycopg.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    )

    doc_cache: Dict[str, int] = {}

    try:
        ensure_schema(conn)

        doc_upsert_sql = (
            "INSERT INTO documents (source_file, title)\n"
            "VALUES (%s, %s)\n"
            "ON CONFLICT (source_file) DO UPDATE\n"
            "SET updated_at = NOW()\n"
            "RETURNING id;"
        )

        chunk_upsert_sql = (
            "INSERT INTO rag_chunks (\n"
            "  document_id, chunk_index, page_start, page_end, word_count, content, page_spans_json, metadata, embedding\n"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::vector)\n"
            "ON CONFLICT (document_id, chunk_index) DO UPDATE SET\n"
            "  page_start = EXCLUDED.page_start,\n"
            "  page_end = EXCLUDED.page_end,\n"
            "  word_count = EXCLUDED.word_count,\n"
            "  content = EXCLUDED.content,\n"
            "  page_spans_json = EXCLUDED.page_spans_json,\n"
            "  metadata = EXCLUDED.metadata,\n"
            "  embedding = EXCLUDED.embedding,\n"
            "  updated_at = NOW();"
        )

        total = len(records)
        upserted = 0
        with conn.cursor() as cur:
            for i in range(0, total, args.batch_size):
                j = min(i + args.batch_size, total)
                chunk_rows = []

                for k in range(i, j):
                    (
                        source_file_name,
                        chunk_index,
                        page_start,
                        page_end,
                        word_count,
                        content,
                        page_spans_json,
                        metadata_json,
                    ) = normalize_record(records[k])

                    doc_id = doc_cache.get(source_file_name)
                    if doc_id is None:
                        title = derive_title_from_source(source_file_name)
                        cur.execute(doc_upsert_sql, (source_file_name, title))
                        doc_id = int(cur.fetchone()[0])
                        doc_cache[source_file_name] = doc_id

                    chunk_rows.append(
                        (
                            doc_id,
                            chunk_index,
                            page_start,
                            page_end,
                            word_count,
                            content,
                            page_spans_json,
                            metadata_json,
                            vector_to_literal(embeddings[k]),
                        )
                    )

                cur.executemany(chunk_upsert_sql, chunk_rows)
                upserted += len(chunk_rows)

        conn.commit()
    finally:
        conn.close()

    print(f"Embeddings file: {args.embeddings}")
    print(f"Records file: {args.records}")
    print(f"DB: {args.db_host}:{args.db_port}/{args.db_name}")
    print(f"Embedding dim: {dim}")
    print(f"Upserted rag_chunks: {upserted}")


if __name__ == "__main__":
    main()

