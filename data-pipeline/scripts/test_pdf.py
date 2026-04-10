import fitz  # Thư viện PyMuPDF
import os
import glob
import json
import time
import argparse
from typing import Dict, List, Any

script_dir = os.path.dirname(os.path.abspath(__file__))
raw_data_dir = os.path.join(script_dir, "../data/raw")

def check_all_pdfs(directory: str, test_page_index: int = 10) -> Dict[str, Any]:
    print(f"🔍 Đang quét thư mục: {directory}\n")
    pdf_files = sorted(glob.glob(os.path.join(directory, "*.pdf")))
    
    if not pdf_files:
        print("❌ Không tìm thấy file PDF nào! Hãy copy sách vào thư mục data/raw nhé.")
        return {
            "scan_dir": os.path.abspath(directory),
            "scanned_at": int(time.time()),
            "total_files": 0,
            "success_count": 0,
            "warning_count": 0,
            "error_count": 0,
            "readable_files": [],
            "warning_files": [],
            "error_files": [],
            "test_page_index": test_page_index,
        }

    print(f"📂 Tìm thấy {len(pdf_files)} file PDF. Bắt đầu kiểm tra...\n")
    
    success_count = 0
    warning_count = 0
    error_count = 0
    readable_files: List[str] = []
    warning_files: List[str] = []
    error_files: List[Dict[str, str]] = []

    for file_path in pdf_files:
        file_name = os.path.basename(file_path)
        try:
            doc = fitz.open(file_path)
            page_count = doc.page_count
            
            # Đọc thử trang chỉ định (hoặc trang gần cuối nếu sách mỏng)
            test_page_num = min(test_page_index, page_count - 1)
            page = doc.load_page(test_page_num)
            
            text = page.get_text("text").strip()
            
            if len(text) == 0:
                print(f"⚠️ [CẢNH BÁO] {file_name}: Không đọc được chữ (Có thể là PDF Scan/Ảnh). Số trang: {page_count}")
                warning_count += 1
                warning_files.append(file_name)
            else:
                print(f"✅ [TỐT] {file_name}: Đọc văn bản bình thường. Số trang: {page_count}")
                success_count += 1
                readable_files.append(file_name)
                
            doc.close()
        except Exception as e:
            print(f"❌ [LỖI] {file_name}: Không thể mở file. Chi tiết: {e}")
            error_count += 1
            error_files.append({"file_name": file_name, "error": str(e)})

    print("\n" + "="*45)
    print("📊 TỔNG KẾT KIỂM TRA DỮ LIỆU:")
    print(f" - Tổng số file đã quét: {len(pdf_files)}")
    print(f" - ✅ Đạt yêu cầu (Trích xuất được Text/Tọa độ): {success_count}")
    print(f" - ⚠️ Cảnh báo (File ảnh, cần loại bỏ hoặc OCR): {warning_count}")
    print(f" - ❌ Lỗi hỏng file: {error_count}")
    print("="*45)

    return {
        "scan_dir": os.path.abspath(directory),
        "scanned_at": int(time.time()),
        "total_files": len(pdf_files),
        "success_count": success_count,
        "warning_count": warning_count,
        "error_count": error_count,
        "readable_files": readable_files,
        "warning_files": warning_files,
        "error_files": error_files,
        "test_page_index": test_page_index,
    }


def save_scan_report(scan_result: Dict[str, Any], output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(scan_result, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Đã lưu báo cáo scan vào: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan PDF files in data/raw and detect readable text-based PDFs.")
    parser.add_argument("--dir", default=raw_data_dir, help="Directory containing PDF files")
    parser.add_argument("--test-page-index", type=int, default=10, help="Zero-based page index to test")
    parser.add_argument("--output-json", default=None, help="Optional path to save scan report JSON")
    args = parser.parse_args()

    result = check_all_pdfs(args.dir, test_page_index=args.test_page_index)
    if args.output_json:
        output_path = args.output_json
        if not os.path.isabs(output_path):
            output_path = os.path.abspath(os.path.join(script_dir, output_path))
        save_scan_report(result, output_path)
