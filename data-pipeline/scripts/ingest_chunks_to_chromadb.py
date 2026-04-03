"""
Ingest chunk JSON into ChromaDB with sentence-transformers embeddings.

Input:
- JSON produced by chunk_extracted_json.py

Output:
- Persistent ChromaDB collection at ../chroma_db by default
"""

import argparse
import hashlib
import json
import os
from typing import Any, Dict, List, Tuple

import chromadb
from sentence_transformers import SentenceTransformer


def load_chunk_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def stable_doc_id(source_file: str, chunk_id: int) -> str:
    raw = f"{source_file}::{chunk_id}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def build_records(payload: Dict[str, Any]) -> Tuple[List[str], List[str], List[Dict[str, Any]]]:
    meta = payload.get("metadata", {})
    source_file = str(meta.get("source_file_name", "unknown.pdf"))
    chunks = payload.get("chunks", [])
    if not chunks:
        raise RuntimeError("No chunks found in chunk JSON.")

    ids: List[str] = []
    docs: List[str] = []
    metas: List[Dict[str, Any]] = []

    for ch in chunks:
        chunk_id = int(ch.get("chunk_id", 0))
        text = str(ch.get("text", "")).strip()
        if not text:
            continue
        ids.append(stable_doc_id(source_file, chunk_id))
        docs.append(text)
        metas.append(
            {
                "source_file_name": source_file,
                "chunk_id": chunk_id,
                "page_start": int(ch.get("page_start", 0)),
                "page_end": int(ch.get("page_end", 0)),
                "word_count": int(ch.get("word_count", 0)),
                "page_spans_json": json.dumps(ch.get("page_spans", []), ensure_ascii=False),
            }
        )

    return ids, docs, metas


def embed_texts(model: SentenceTransformer, texts: List[str], batch_size: int) -> List[List[float]]:
    vectors = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return [v.tolist() for v in vectors]


def upsert_in_batches(
    collection: chromadb.Collection,
    ids: List[str],
    docs: List[str],
    metas: List[Dict[str, Any]],
    embeddings: List[List[float]],
    batch_size: int,
) -> int:
    total = len(ids)
    inserted = 0
    for i in range(0, total, batch_size):
        j = min(i + batch_size, total)
        collection.upsert(
            ids=ids[i:j],
            documents=docs[i:j],
            metadatas=metas[i:j],
            embeddings=embeddings[i:j],
        )
        inserted += j - i
    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest chunk JSON to ChromaDB")
    parser.add_argument("--input", required=True, help="Path to chunk JSON")
    parser.add_argument("--db-path", default=None, help="Chroma persist directory")
    parser.add_argument("--collection", default="vietnam_history_chunks", help="Collection name")
    parser.add_argument("--model", default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", help="Embedding model")
    parser.add_argument("--batch-size", type=int, default=64, help="Embedding and upsert batch size")
    args = parser.parse_args()

    input_path = args.input
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input chunk JSON not found: {input_path}")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_db_path = os.path.abspath(os.path.join(script_dir, "..", "chroma_db"))
    db_path = args.db_path or default_db_path
    os.makedirs(db_path, exist_ok=True)

    payload = load_chunk_json(input_path)
    ids, docs, metas = build_records(payload)

    print(f"Loading embedding model: {args.model}")
    model = SentenceTransformer(args.model)
    embeddings = embed_texts(model, docs, args.batch_size)

    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_or_create_collection(name=args.collection, metadata={"hnsw:space": "cosine"})
    inserted = upsert_in_batches(collection, ids, docs, metas, embeddings, args.batch_size)

    print(f"Input: {input_path}")
    print(f"DB Path: {db_path}")
    print(f"Collection: {args.collection}")
    print(f"Upserted records: {inserted}")
    print(f"Collection size (count): {collection.count()}")


if __name__ == "__main__":
    main()
