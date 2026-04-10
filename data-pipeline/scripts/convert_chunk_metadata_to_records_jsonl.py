"""
Convert chunk_metadata.parquet to records.jsonl for pgvector precomputed ingestion.

Expected input columns from Kaggle export:
- chunk_uid
- source_file_name
- chunk_id
- page_start
- page_end
- word_count
- text
"""

import argparse
import json
import os

import pandas as pd


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
    required_cols = {"chunk_uid", "source_file_name", "chunk_id", "page_start", "page_end", "word_count", "text"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in parquet: {sorted(missing)}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    count = 0
    with open(output_path, "w", encoding="utf-8") as f:
        for _, row in df.iterrows():
            rec = {
                "id": str(row["chunk_uid"]),
                "source_file_name": str(row["source_file_name"]),
                "chunk_id": int(row["chunk_id"]),
                "page_start": int(row["page_start"]),
                "page_end": int(row["page_end"]),
                "word_count": int(row["word_count"]),
                "page_spans_json": "[]",
                "content": str(row["text"]) if row["text"] is not None else "",
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            count += 1

    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Records: {count}")


if __name__ == "__main__":
    main()

