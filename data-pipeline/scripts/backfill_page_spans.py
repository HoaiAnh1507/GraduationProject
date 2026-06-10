import json
import glob
import psycopg2
from pathlib import Path

CHUNK_DIR = Path(r"D:/DoAnTotNghiep/GraduationProject/data-pipeline/data/processed/extracted_chunking")

files = list(CHUNK_DIR.glob("*_extracted_chunks.json"))
print("CHUNK_DIR =", CHUNK_DIR)
print("files found =", len(files))

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="chatbot_history_rag",
    user="admin",
    password="admin",
)

updated = 0
not_found = 0

with conn:
    with conn.cursor() as cur:
        for fp in files:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)

            source_file = data["metadata"]["source_file_name"]

            for ch in data.get("chunks", []):
                chunk_index = int(ch["chunk_id"])
                page_spans = ch.get("page_spans", [])

                cur.execute(
                    """
                    UPDATE rag_chunks rc
                    SET page_spans_json = %s::jsonb,
                        updated_at = now()
                    FROM documents d
                    WHERE d.id = rc.document_id
                      AND d.source_file = %s
                      AND rc.chunk_index = %s
                    """,
                    (
                        json.dumps(page_spans, ensure_ascii=False),
                        source_file,
                        chunk_index,
                    ),
                )

                if cur.rowcount > 0:
                    updated += cur.rowcount
                else:
                    not_found += 1

conn.close()

print(f"updated={updated}")
print(f"not_found={not_found}")