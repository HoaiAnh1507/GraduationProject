# Data Pipeline Scripts (Extract -> Chunk -> Embedding -> PGVector)

Tài liệu này mô tả luồng hiện tại của thư mục `data-pipeline/scripts` theo hướng **PGVector**.

## 1) Tổng quan luồng

### Luồng A - Local full (không dùng Kaggle)
1. Extract PDF -> `*_extracted.json`
2. Chunk -> `*_chunks.json`
3. Embed + ingest trực tiếp vào PGVector

### Luồng B - Tách rời Kaggle (khuyến nghị khi local yếu)
1. Local: extract + chunk
2. Kaggle/GPU: tạo embedding từ chunks
3. Local: ingest precomputed embeddings vào PGVector

---

## 2) Các script chính và chức năng

### Extract / Chunk
- `pdf_extractor.py`  
  Trích xuất text + bounding box từ PDF text-based.

- `test_pdf.py`  
  Quét thư mục PDF và phân loại file đọc được text.

- `run_extractor.bat`  
  Batch: lọc file đọc được và extract hàng loạt.

- `chunk_extracted_json.py`  
  Chunk từ file extracted JSON (window theo từ + overlap).

- `run_chunk_extracted_bulk.bat`  
  Chunk hàng loạt các file trong `data/processed/extracted`.

### Luồng Kaggle split
- Tạo `embeddings.npy` + `records.jsonl` từ chunks (chạy trên Kaggle).

- `convert_chunk_metadata_to_records_jsonl.py`  
  Trường hợp bạn chỉ có `chunk_metadata.parquet`, script này convert sang `records.jsonl`.

- `ingest_precomputed_embeddings_to_pgvector.py`  
  Ingest từ `embeddings.npy` + `records.jsonl` vào PGVector.

- `run_ingest_precomputed_pgvector.bat`  
  Batch ingest precomputed embeddings (nếu đã có jsonl).

- `run_prepare_and_ingest_precomputed_pgvector.bat`  
  1 lệnh: convert parquet -> jsonl -> ingest PGVector.

## 3) Cấu trúc dữ liệu khuyến nghị

```text
data-pipeline/
  data/
    raw/                             # PDF gốc
    processed/
      extracted/                     # *_extracted.json
      extracted_chunking/            # *_chunks.json
      embedding_exports/             # embeddings.npy, records.jsonl, run_info.json
      fail/                          # file lỗi / loại bỏ
```

---

## 4) Cài thư viện

Từ thư mục `data-pipeline`:

```bash
pip install -r requirements.txt
```
---

## 5) Lệnh chạy mẫu

## 5.1. Extract hàng loạt
```bat
cd scripts
run_extractor.bat
```

## 5.2. Chunk hàng loạt
```bat
cd scripts
run_chunk_extracted_bulk.bat 220 40 50
```

## 5.3. Ingest PGVector từ kết quả Kaggle

Nếu đã có `embeddings.npy` + `records.jsonl`:
```bat
cd scripts
run_ingest_precomputed_pgvector.bat localhost 5432 history_rag admin admin rag_chunks cosine 256
```

Nếu chỉ có `chunk_metadata.parquet` + `embeddings.npy`:
```bat
cd scripts
run_prepare_and_ingest_precomputed_pgvector.bat localhost 5432 history_rag admin admin rag_chunks cosine 256
```

---

## 6) Kiểm tra sau ingest

Trong PostgreSQL/pgAdmin:

```sql
SELECT COUNT(*) FROM rag_chunks;
SELECT vector_dims(embedding) FROM rag_chunks LIMIT 1;
SELECT id, source_file_name, chunk_id FROM rag_chunks LIMIT 5;
```

Kỳ vọng:
- Có dữ liệu (count > 0)
- `vector_dims` đúng với model đã dùng (ví dụ `BAAI/bge-m3` là 1024)

---

## 7) Lưu ý quan trọng

- Dùng **cùng 1 embedding model** cho ingest và query.
- Khi đổi model, nên tạo bảng/collection mới hoặc re-index toàn bộ.

