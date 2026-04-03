# 📚 PDF Extractor - Trích xuất văn bản và tọa độ từ PDF

## 🎯 Mục đích
Đọc file PDF lịch sử Việt Nam và trích xuất:
- ✅ Văn bản đầy đủ
- ✅ **Bounding Box (tọa độ)** của từng từ
- ✅ Metadata của document và từng trang
- ✅ Output định dạng JSON cho bước Chunking tiếp theo

## 📦 Cài đặt

### Bước 1: Cài đặt thư viện
```bash
cd data-pipeline
pip install -r requirements.txt
```

Hoặc cài trực tiếp:
```bash
pip install pdfplumber==0.10.3
```

### Bước 2: Chuẩn bị dữ liệu
Đặt các file PDF vào thư mục:
```
data-pipeline/data/raw/
```

## 🚀 Cách sử dụng

### Option 1: Chạy Demo nhanh (khuyến nghị để test)
```bash
cd scripts
python demo_quick_test.py
```
**Làm gì:**
- Test với 1 trang đầu tiên của PDF
- Hiển thị 5 từ đầu với bounding box
- Lưu JSON mẫu

### Option 2: Chạy script chính (production)
```bash
cd scripts
python pdf_extractor.py
```
**Làm gì:**
- Xử lý nhiều trang (mặc định: 20 trang để test)
- Lưu kết quả đầy đủ vào `data/processed/`
- Tính toán thống kê chi tiết

### Option 3: Chạy bằng Batch file (Windows)
```bash
cd scripts
run_extractor.bat
```

### Option 4: Chạy đầy đủ pipeline text-only (không OCR)
```bash
cd scripts
run_pipeline_text_only.bat "Lch s Vit Nam tp 01 T khi thy n th k X-Cao Duy Mn-2013.pdf"
```
**Làm gì:**
- Bước 1: Trích xuất text + bbox sang JSON (`*_extracted.json`)
- Bước 2: Chunking có overlap, giữ page range + bbox span (`*_extracted_chunks.json`)
- Bước 3: Tạo embedding và nạp vào ChromaDB local (`../chroma_db`)

## 🔗 CLI mới cho pipeline

### 1) Extract PDF text-based + bbox
```bash
python pdf_extractor.py --input "..\data\raw\Lch s Vit Nam tp 01 T khi thy n th k X-Cao Duy Mn-2013.pdf" --output "..\data\processed\tap01_extracted.json" --max-pages 50
```

### 2) Chunk từ extracted JSON
```bash
python chunk_extracted_json.py --input "..\data\processed\tap01_extracted.json" --output "..\data\processed\tap01_extracted_chunks.json" --chunk-size 220 --overlap 40 --min-chunk-words 50
```

### 3) Ingest chunks vào ChromaDB
```bash
python ingest_chunks_to_chromadb.py --input "..\data\processed\tap01_extracted_chunks.json" --db-path "..\chroma_db" --collection "vietnam_history_chunks"
```

### Ghi chú
- Pipeline này dành cho PDF text-based (không OCR).
- Với file scan/image PDF (ví dụ tập 03, tập 07 bản ảnh), tạm thời bỏ qua theo quyết định hiện tại.

## 📊 Output Format

### Cấu trúc JSON Output:
```json
{
  "metadata": {
    "file_name": "Lịch sử Việt Nam tập 07.pdf",
    "total_pages": 200,
    "pages_processed": 20,
    "extraction_date": "2026-03-26T15:30:00"
  },
  "pages": [
    {
      "page_number": 1,
      "width": 595.0,
      "height": 842.0,
      "word_count": 324,
      "full_text": "Nội dung đầy đủ của trang...",
      "words": [
        {
          "text": "Lịch",
          "bbox": {
            "x0": 100.5,
            "top": 50.2,
            "x1": 125.3,
            "bottom": 65.8
          }
        }
      ]
    }
  ]
}
```

### Giải thích Bounding Box:
- `x0`: Tọa độ X góc trái
- `top`: Tọa độ Y phía trên
- `x1`: Tọa độ X góc phải
- `bottom`: Tọa độ Y phía dưới

## 🔧 Tùy chỉnh

### Thay đổi file PDF cần xử lý:
Mở `pdf_extractor.py`, dòng 189:
```python
test_pdf = "Tên_file_PDF_của_bạn.pdf"
```

### Thay đổi số trang xử lý:
Dòng 202:
```python
pages_data = extractor.extract_all_pages(max_pages=20)  # Thay 20 = số trang bạn muốn
```

### Xử lý toàn bộ PDF:
```python
pages_data = extractor.extract_all_pages(max_pages=None)  # None = xử lý hết
```

## 📁 Cấu trúc thư mục

```
data-pipeline/
├── data/
│   ├── raw/              ← Đặt file PDF ở đây
│   └── processed/        ← Kết quả JSON sẽ lưu ở đây
├── scripts/
│   ├── pdf_extractor.py       ← Script chính (production)
│   ├── demo_quick_test.py     ← Demo nhanh (test)
│   ├── run_extractor.bat      ← Batch file Windows
│   ├── test_pdf.py            ← Kiểm tra tất cả PDF
│   ├── deep_scan.py           ← Quét sâu PDF
│   └── test_plumber.py        ← Test pdfplumber
├── requirements.txt
└── README.md             ← File này
```

## ⚠️ Xử lý lỗi

### Lỗi: "ModuleNotFoundError: No module named 'pdfplumber'"
```bash
pip install pdfplumber
```

### Lỗi: "FileNotFoundError"
- Kiểm tra file PDF có trong `data/raw/` không
- Kiểm tra tên file trong code có đúng không

### PDF không đọc được tọa độ (word_count = 0)
- PDF có thể là dạng scan/ảnh
- Cần dùng OCR (xử lý sau)

## 🔄 Các bước tiếp theo

1. ✅ **Đọc PDF và lấy tọa độ** ← Bạn đang ở đây
2. ⏭️ **Chunking**: Chia văn bản thành các đoạn nhỏ
3. ⏭️ **Embedding**: Tạo vector embedding
4. ⏭️ **Vector Database**: Lưu vào Chroma/Qdrant

## 📞 Hỗ trợ
- Xem log trong console để debug
- Kiểm tra file JSON output để verify dữ liệu
- Test với `demo_quick_test.py` trước khi chạy production
