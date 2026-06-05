"""
Convert chunk_metadata.parquet to records.jsonl for precomputed pgvector ingestion.

This outputs fields aligned with the new DB schema:
- documents.source_file   <- source_file_name
- rag_chunks.document_id  <- derived during ingestion via documents(source_file)
- rag_chunks.chunk_index  <- chunk_id
- rag_chunks.content      <- text

Expected input columns from Kaggle export:
- source_file_name
- chunk_id
- page_start
- page_end
- word_count
- text

Note: if `chunk_uid` exists in the parquet, it will be preserved inside `metadata`.
"""

import argparse
import json
import os

import pandas as pd

from document_file_metadata import normalize_page_spans


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert chunk_metadata.parquet -> records.jsonl")
    parser.add_argument(
        "--input",
        default=os.path.join("..", "data", "processed", "embedding_exports", "chunk_metadata.parquet"),
        help="Path to chunk_metadata.parquet",
    )
    parser.add_argument(
        "--output",
        default=os.path.join("..", "data", "processed", "embedding_exports", "records.jsonl"),
        help="Path to output records.jsonl",
    )
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = args.input if os.path.isabs(args.input) else os.path.abspath(os.path.join(script_dir, args.input))
    output_path = args.output if os.path.isabs(args.output) else os.path.abspath(os.path.join(script_dir, args.output))

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    df = pd.read_parquet(input_path)
    required_cols = {"source_file_name", "chunk_id", "page_start", "page_end", "word_count", "text"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in parquet: {sorted(missing)}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    def has_value(v: object) -> bool:
        if v is None:
            return False
        if isinstance(v, (list, dict)):
            return True
        if isinstance(v, str):
            return v.strip() != ""
        return not pd.isna(v)

    count = 0
    with open(output_path, "w", encoding="utf-8") as f:
        for _, row in df.iterrows():
            content = str(row["text"]) if row["text"] is not None else ""

            metadata = {"chunk_id": int(row["chunk_id"])}
            if "chunk_uid" in df.columns and has_value(row["chunk_uid"]):
                metadata["chunk_uid"] = str(row["chunk_uid"])

            page_spans_obj = []
            if "page_spans_json" in df.columns and has_value(row["page_spans_json"]):
                v = row["page_spans_json"]
                if isinstance(v, str):
                    try:
                        page_spans_obj = json.loads(v)
                    except json.JSONDecodeError:
                        page_spans_obj = []
                else:
                    # If parquet stores nested data, it may come back as list/dict already.
                    page_spans_obj = v
            elif "page_spans" in df.columns and has_value(row["page_spans"]):
                # Support alternative column name.
                v = row["page_spans"]
                if isinstance(v, str):
                    try:
                        page_spans_obj = json.loads(v)
                    except json.JSONDecodeError:
                        page_spans_obj = []
                else:
                    page_spans_obj = v
            page_spans_obj = normalize_page_spans(
                page_spans_obj,
                int(row["page_start"]),
                int(row["page_end"]),
            )

            rec = {
                "source_file_name": str(row["source_file_name"]),
                "chunk_index": int(row["chunk_id"]),
                "page_start": int(row["page_start"]),
                "page_end": int(row["page_end"]),
                "word_count": int(row["word_count"]),
                "content": content,

                # If you want bbox citations, ensure Kaggle exports `page_spans_json` (or `page_spans`).
                "page_spans_json": page_spans_obj,

                # Extra fields go here (rag_chunks.metadata)
                "metadata": metadata,
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            count += 1

    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Records: {count}")


if __name__ == "__main__":
    main()

