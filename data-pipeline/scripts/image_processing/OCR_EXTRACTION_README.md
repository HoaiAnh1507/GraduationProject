# PDF OCR Extractor - Trích xuất văn bản và tọa độ từ PDF dạng ảnh

Script này sử dụng PaddleOCR để trích xuất text và bounding box coordinates từ các file PDF dạng ảnh (scanned PDFs).

## 🎯 Tính năng

- ✅ OCR tiếng Việt với độ chính xác cao (PaddleOCR)
- ✅ Trích xuất text cùng tọa độ bounding box (x0, top, x1, bottom)
- ✅ Hỗ trợ xử lý từng phần hoặc toàn bộ PDF
- ✅ Xuất kết quả ra JSON với cấu trúc chuẩn
- ✅ Hiển thị độ tin cậy (confidence) của mỗi đoạn text
- ✅ Thống kê chi tiết sau khi xử lý

## 📋 Yêu cầu hệ thống

### 1. Python Dependencies (đã có trong requirements.txt)
```
paddleocr>=2.7.0
paddlepaddle>=2.5.0
pdf2image>=1.16.3
Pillow>=10.0.0
```

### 2. Poppler (Bắt buộc cho pdf2image)

**Windows:**
- Download từ: https://github.com/oschwartz10612/poppler-windows/releases/
- Giải nén và thêm thư mục `bin` vào PATH
- Hoặc cài qua conda: `conda install -c conda-forge poppler`

**Linux:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

## 🚀 Cài đặt

### Bước 1: Cài đặt dependencies
```bash
# Chạy batch file (Windows)
install_ocr_dependencies.bat

# Hoặc cài thủ công
pip install paddleocr paddlepaddle pdf2image Pillow
```

### Bước 2: Cài đặt Poppler
Xem hướng dẫn ở phần "Yêu cầu hệ thống" bên trên.

## 💻 Cách sử dụng

### 1. Test nhanh với 2 trang đầu
```bash
python test_ocr_quick.py
```

### 2. Xử lý Tập 3 và Tập 7 (10 trang đầu - Test)
```bash
# Windows
run_ocr_tap3_tap7.bat

# Linux/Mac
python pdf_ocr_extractor.py "../data/raw/Lch s Vit Nam tp 03 T th k XV n th k XVI-T Ngc Lin-2017.pdf" --max-pages 10
```

### 3. Xử lý TOÀN BỘ Tập 3 và Tập 7 (Tốn thời gian!)
```bash
# Windows
run_ocr_tap3_tap7_full.bat

# Hoặc chạy thủ công
python pdf_ocr_extractor.py "<path_to_pdf>" --lang vi --dpi 200
```

### 4. Sử dụng command line với tùy chọn

```bash
# Cú pháp cơ bản
python pdf_ocr_extractor.py <pdf_path> [options]

# Ví dụ:
python pdf_ocr_extractor.py "input.pdf" --max-pages 20 --dpi 300 --lang vi

# Xử lý trang cụ thể
python pdf_ocr_extractor.py "input.pdf" --first-page 10 --last-page 20

# Chỉ định output
python pdf_ocr_extractor.py "input.pdf" -o "output.json"
```

#### Các tùy chọn có sẵn:
- `pdf_path`: Đường dẫn đến file PDF (bắt buộc)
- `-o, --output`: Đường dẫn file JSON output (mặc định: `<tên_pdf>_ocr_extracted.json`)
- `-m, --max-pages`: Số trang tối đa cần xử lý (mặc định: tất cả)
- `-l, --lang`: Mã ngôn ngữ OCR (mặc định: `vi` - tiếng Việt)
- `--dpi`: DPI cho chuyển đổi ảnh (mặc định: 200)
  - 150: Nhanh, chất lượng trung bình
  - 200: Cân bằng (khuyến nghị)
  - 300: Chất lượng cao, chậm hơn
- `--first-page`: Trang bắt đầu (1-indexed)
- `--last-page`: Trang kết thúc (1-indexed)

## 📊 Cấu trúc Output JSON

```json
{
  "metadata": {
    "file_name": "example.pdf",
    "total_pages": 10,
    "pages_processed": 10,
    "extraction_date": "2026-03-27T...",
    "extraction_method": "PaddleOCR",
    "language": "vi"
  },
  "pages": [
    {
      "page_number": 1,
      "width": 1500,
      "height": 2433,
      "words": [
        {
          "text": "Lịch sử Việt Nam",
          "bbox": {
            "x0": 100.5,
            "top": 200.3,
            "x1": 350.8,
            "bottom": 230.1
          },
          "confidence": 0.9876
        }
      ],
      "full_text": "Lịch sử Việt Nam ...",
      "word_count": 150
    }
  ]
}
```

### Giải thích các trường:
- `text`: Văn bản được nhận diện
- `bbox`: Tọa độ bounding box
  - `x0`: Tọa độ X bên trái
  - `top`: Tọa độ Y phía trên
  - `x1`: Tọa độ X bên phải
  - `bottom`: Tọa độ Y phía dưới
- `confidence`: Độ tin cậy của OCR (0-1)
- `full_text`: Toàn bộ text của trang (ghép tất cả words)
- `word_count`: Số lượng text regions được phát hiện

## ⚙️ Các file chính

```
scripts/
├── pdf_ocr_extractor.py          # Script chính
├── test_ocr_quick.py              # Test nhanh 2 trang
├── install_ocr_dependencies.bat   # Cài đặt thư viện
├── run_ocr_tap3_tap7.bat         # Chạy test 10 trang
├── run_ocr_tap3_tap7_full.bat    # Chạy toàn bộ (lâu!)
└── OCR_EXTRACTION_README.md       # File này
```

## ⏱️ Thời gian xử lý ước tính

**Cấu hình: CPU thường, DPI=200**

- 1 trang: ~3-5 giây
- 10 trang: ~30-50 giây
- 100 trang: ~5-8 phút
- 500 trang: ~25-40 phút
- Tập 3 (~500 trang): ~30-50 phút
- Tập 7 (~664 trang): ~40-60 phút

**Lưu ý:**
- Thời gian có thể nhanh hơn nếu sử dụng GPU
- DPI cao hơn = chất lượng tốt hơn nhưng chậm hơn
- Trang có nhiều chữ xử lý lâu hơn trang ít chữ

## 🎛️ Tối ưu hóa

### 1. Sử dụng GPU (Nếu có)
Mở file `pdf_ocr_extractor.py`, tìm dòng:
```python
self.ocr = PaddleOCR(
    use_angle_cls=True,
    lang=lang,
    use_gpu=False  # ← Đổi thành True
)
```

### 2. Giảm DPI cho test nhanh
```bash
python pdf_ocr_extractor.py "input.pdf" --dpi 150  # Nhanh hơn
```

### 3. Xử lý song song nhiều file
Tạo nhiều terminal và chạy các file khác nhau cùng lúc.

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "pdf2image.exceptions.PDFPageCountError"
**Nguyên nhân:** Chưa cài Poppler hoặc Poppler chưa có trong PATH

**Giải pháp:**
1. Cài đặt Poppler (xem phần "Yêu cầu hệ thống")
2. Thêm thư mục `bin` của Poppler vào PATH
3. Khởi động lại terminal/command prompt

### Lỗi: "ModuleNotFoundError: No module named 'paddleocr'"
**Giải pháp:**
```bash
pip install paddleocr paddlepaddle
```

### Lỗi: Memory Error khi xử lý PDF lớn
**Giải pháp:**
- Giảm DPI: `--dpi 150`
- Xử lý từng phần: `--first-page 1 --last-page 50`
- Xử lý từng batch nhỏ

## 📝 So sánh với pdf_extractor.py cũ

| Feature | pdf_extractor.py | pdf_ocr_extractor.py |
|---------|------------------|---------------------|
| PDF dạng text | ✅ Hoàn hảo | ❌ Không cần |
| PDF dạng ảnh | ❌ Không extract được | ✅ Hoàn hảo |
| Tốc độ | ⚡ Rất nhanh | 🐢 Chậm (OCR) |
| Độ chính xác | 100% (text layer) | ~95-98% (OCR) |
| Bounding box | ✅ Chính xác | ✅ Chính xác |
| GPU support | ❌ | ✅ |

**Khuyến nghị:**
- Dùng `pdf_extractor.py` cho PDF text-based
- Dùng `pdf_ocr_extractor.py` cho PDF scanned/image-based

## 🔄 Quy trình làm việc đề xuất

1. **Test nhanh:** Chạy `test_ocr_quick.py` để kiểm tra
2. **Test 10 trang:** Chạy `run_ocr_tap3_tap7.bat`
3. **Kiểm tra kết quả:** Xem file JSON trong `data/processed/`
4. **Xử lý full:** Chạy `run_ocr_tap3_tap7_full.bat` (nếu kết quả OK)

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra Poppler đã cài đúng chưa
2. Kiểm tra virtual environment đã activate chưa
3. Thử test với `test_ocr_quick.py` trước
4. Xem log lỗi để debug

---

**Lưu ý quan trọng:** OCR không bao giờ đạt 100% chính xác như text-based PDF. Kết quả phụ thuộc vào:
- Chất lượng scan
- Font chữ và kích thước
- Độ nét của ảnh
- Góc nghiêng của text

Đối với sách lịch sử tiếng Việt, độ chính xác ước tính: **95-98%**.
