"""
Ingest precomputed embeddings + records into PostgreSQL + pgvector.

Input files:
- embeddings.npy  (N, D) float32
- records.jsonl   (N lines, metadata + content)
"""

import argparse
import json
import os
import re
from typing import Any, Dict, List

import numpy as np
import psycopg
from psycopg import sql


def validate_table_name(table_name: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
        raise ValueError(f"Invalid table name: {table_name}")
    return table_name


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


def create_table_and_index(conn: psycopg.Connection, table_name: str, embedding_dim: int, distance: str) -> None:
    distance_ops_map = {
        "cosine": "vector_cosine_ops",
        "l2": "vector_l2_ops",
        "ip": "vector_ip_ops",
    }
    if distance not in distance_ops_map:
        raise ValueError("distance must be one of: cosine, l2, ip")
    distance_ops = distance_ops_map[distance]

    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute(
            sql.SQL(
                """
                CREATE TABLE IF NOT EXISTS {table} (
                    id TEXT PRIMARY KEY,
                    source_file_name TEXT NOT NULL,
                    chunk_id INT NOT NULL,
                    page_start INT NOT NULL,
                    page_end INT NOT NULL,
                    word_count INT NOT NULL,
                    content TEXT NOT NULL,
                    page_spans_json JSONB NOT NULL,
                    embedding vector({dim}) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            ).format(table=sql.Identifier(table_name), dim=sql.SQL(str(embedding_dim)))
        )

        index_name = f"{table_name}_embedding_hnsw"
        cur.execute(
            sql.SQL(
                """
                CREATE INDEX IF NOT EXISTS {index_name}
                ON {table}
                USING hnsw (embedding {distance_ops});
                """
            ).format(
                index_name=sql.Identifier(index_name),
                table=sql.Identifier(table_name),
                distance_ops=sql.SQL(distance_ops),
            )
        )
    conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest precomputed embeddings to PostgreSQL + pgvector")
    parser.add_argument("--embeddings", required=True, help="Path to embeddings.npy")
    parser.add_argument("--records", required=True, help="Path to records.jsonl")

    parser.add_argument("--db-host", default="localhost", help="PostgreSQL host")
    parser.add_argument("--db-port", type=int, default=5432, help="PostgreSQL port")
    parser.add_argument("--db-name", default="history_rag", help="PostgreSQL database name")
    parser.add_argument("--db-user", default="admin", help="PostgreSQL username")
    parser.add_argument("--db-password", default="admin", help="PostgreSQL password")

    parser.add_argument("--table", default="rag_chunks", help="Target table")
    parser.add_argument("--distance", default="cosine", choices=["cosine", "l2", "ip"], help="Distance metric")
    parser.add_argument("--batch-size", type=int, default=256, help="DB upsert batch size")
    args = parser.parse_args()

    table_name = validate_table_name(args.table)

    embeddings = np.load(args.embeddings)
    records = load_jsonl(args.records)

    if embeddings.ndim != 2:
        raise ValueError("embeddings.npy must be a 2D array [N, D]")
    if len(records) != embeddings.shape[0]:
        raise ValueError(f"records count ({len(records)}) != embeddings rows ({embeddings.shape[0]})")

    dim = int(embeddings.shape[1])

    conn = psycopg.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    )
    try:
        create_table_and_index(conn, table_name, dim, args.distance)

        query = sql.SQL(
            """
            INSERT INTO {table}
                (id, source_file_name, chunk_id, page_start, page_end, word_count, content, page_spans_json, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::vector)
            ON CONFLICT (id) DO UPDATE SET
                source_file_name = EXCLUDED.source_file_name,
                chunk_id = EXCLUDED.chunk_id,
                page_start = EXCLUDED.page_start,
                page_end = EXCLUDED.page_end,
                word_count = EXCLUDED.word_count,
                content = EXCLUDED.content,
                page_spans_json = EXCLUDED.page_spans_json,
                embedding = EXCLUDED.embedding,
                updated_at = NOW();
            """
        ).format(table=sql.Identifier(table_name))

        total = len(records)
        inserted = 0
        with conn.cursor() as cur:
            for i in range(0, total, args.batch_size):
                j = min(i + args.batch_size, total)
                rows = []
                for k in range(i, j):
                    r = records[k]
                    rows.append(
                        (
                            r["id"],
                            r["source_file_name"],
                            int(r["chunk_id"]),
                            int(r["page_start"]),
                            int(r["page_end"]),
                            int(r["word_count"]),
                            r["content"],
                            r["page_spans_json"],
                            vector_to_literal(embeddings[k]),
                        )
                    )
                cur.executemany(query, rows)
                inserted += len(rows)
        conn.commit()
    finally:
        conn.close()

    print(f"Embeddings file: {args.embeddings}")
    print(f"Records file: {args.records}")
    print(f"DB: {args.db_host}:{args.db_port}/{args.db_name}")
    print(f"Table: {table_name}")
    print(f"Distance: {args.distance}")
    print(f"Embedding dim: {dim}")
    print(f"Upserted records: {inserted}")


if __name__ == "__main__":
    main()

