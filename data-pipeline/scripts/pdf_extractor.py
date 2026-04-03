"""
PDF Extractor with Bounding Box Coordinates
============================================
Script để đọc PDF và trích xuất văn bản kèm tọa độ bounding box.
Dùng cho hệ thống RAG - Chatbot Lịch sử Việt Nam.

Chức năng:
- Đọc file PDF
- Trích xuất text với tọa độ (bounding box) của từng từ
- Lưu thông tin theo cấu trúc: document -> pages -> words -> coords
- Output: JSON format, sẵn sàng cho bước Chunking tiếp theo

Author: GraduationProject Team
Date: 2026-03-26
"""

import pdfplumber
import json
import os
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

DEFAULT_RELATIVE_RAW_DIR = "../data/raw"
DEFAULT_RELATIVE_PROCESSED_DIR = "../data/processed"
DEFAULT_DEFAULT_FILE_NAME = ""  # Để trống = tự lấy file PDF đầu tiên trong data/raw
DEFAULT_MAX_PAGES = None  # None = xử lý hết
DEFAULT_X_TOLERANCE = 3.0
DEFAULT_Y_TOLERANCE = 3.0
DEFAULT_KEEP_BLANK_CHARS = False
DEFAULT_USE_TEXT_FLOW = True
DEFAULT_PREVIEW_WORDS = 3


class PDFExtractor:
    """Class chính để xử lý PDF và trích xuất tọa độ."""

    def __init__(
        self,
        pdf_path: str,
        x_tolerance: float = DEFAULT_X_TOLERANCE,
        y_tolerance: float = DEFAULT_Y_TOLERANCE,
        keep_blank_chars: bool = DEFAULT_KEEP_BLANK_CHARS,
        use_text_flow: bool = DEFAULT_USE_TEXT_FLOW,
    ):
        """
        Khởi tạo PDF Extractor.

        Args:
            pdf_path: Đường dẫn tới file PDF cần xử lý
        """
        self.pdf_path = pdf_path
        self.file_name = os.path.basename(pdf_path)
        self.metadata = {}
        self.x_tolerance = x_tolerance
        self.y_tolerance = y_tolerance
        self.keep_blank_chars = keep_blank_chars
        self.use_text_flow = use_text_flow

        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"❌ Không tìm thấy file: {pdf_path}")

    def extract_page_with_bbox(self, page, page_num: int) -> Dict[str, Any]:
        """
        Trích xuất nội dung và bounding box của một trang PDF.

        Args:
            page: pdfplumber page object
            page_num: Số thứ tự trang (bắt đầu từ 1)

        Returns:
            Dictionary chứa thông tin trang và tọa độ các từ
        """
        page_data = {
            "page_number": page_num,
            "width": page.width,
            "height": page.height,
            "words": [],
            "full_text": "",
            "word_count": 0
        }

        try:
            # Trích xuất tất cả các từ với tọa độ
            words = page.extract_words(
                x_tolerance=self.x_tolerance,  # Khoảng cách tối đa giữa các ký tự trong cùng 1 từ
                y_tolerance=self.y_tolerance,
                keep_blank_chars=self.keep_blank_chars,
                use_text_flow=self.use_text_flow,  # Sắp xếp theo thứ tự đọc tự nhiên
            )

            if words:
                for word in words:
                    word_data = {
                        "text": word["text"],
                        "bbox": {
                            "x0": round(word["x0"], 2),  # Tọa độ góc trên bên trái
                            "top": round(word["top"], 2),
                            "x1": round(word["x1"], 2),  # Tọa độ góc dưới bên phải
                            "bottom": round(word["bottom"], 2)
                        }
                    }
                    page_data["words"].append(word_data)

                # Tạo full text từ các từ đã trích xuất
                page_data["full_text"] = " ".join([w["text"] for w in words])
                page_data["word_count"] = len(words)
            else:
                # Nếu không trích xuất được từ, thử lấy text thông thường
                text = page.extract_text()
                page_data["full_text"] = text if text else ""
                page_data["word_count"] = 0

        except Exception as e:
            print(f"⚠️ Lỗi khi xử lý trang {page_num}: {str(e)}")
            page_data["error"] = str(e)

        return page_data

    def extract_all_pages(self, max_pages: int = None) -> List[Dict[str, Any]]:
        """
        Trích xuất tất cả các trang trong PDF.

        Args:
            max_pages: Giới hạn số trang cần xử lý (None = xử lý hết)

        Returns:
            List các dictionary, mỗi dict chứa thông tin 1 trang
        """
        all_pages_data = []

        print(f"\n🔍 Bắt đầu xử lý file: {self.file_name}")

        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                total_pages = len(pdf.pages)
                pages_to_process = min(total_pages, max_pages) if max_pages else total_pages

                print(f"📄 Tổng số trang: {total_pages}")
                print(f"🎯 Xử lý: {pages_to_process} trang\n")

                # Lưu metadata
                self.metadata = {
                    "file_name": self.file_name,
                    "total_pages": total_pages,
                    "pages_processed": pages_to_process,
                    "extraction_date": datetime.now().isoformat(),
                    "extract_config": {
                        "x_tolerance": self.x_tolerance,
                        "y_tolerance": self.y_tolerance,
                        "keep_blank_chars": self.keep_blank_chars,
                        "use_text_flow": self.use_text_flow,
                    },
                }

                # Xử lý từng trang
                for i, page in enumerate(pdf.pages[:pages_to_process], 1):
                    print(f"⚙️ Đang xử lý trang {i}/{pages_to_process}...", end='\r')
                    page_data = self.extract_page_with_bbox(page, i)
                    all_pages_data.append(page_data)

                print(f"\n✅ Hoàn thành! Đã xử lý {pages_to_process} trang.")

        except Exception as e:
            print(f"\n❌ Lỗi khi mở file PDF: {str(e)}")
            raise

        return all_pages_data

    def save_to_json(self, pages_data: List[Dict[str, Any]], output_path: str):
        """
        Lưu dữ liệu đã trích xuất vào file JSON.

        Args:
            pages_data: List các trang đã xử lý
            output_path: Đường dẫn file JSON output
        """
        output_data = {
            "metadata": self.metadata,
            "pages": pages_data
        }

        try:
            # Tạo thư mục nếu chưa tồn tại
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)

            print(f"\n💾 Đã lưu kết quả vào: {output_path}")
            print(f"📊 Kích thước file: {os.path.getsize(output_path) / 1024:.2f} KB")

        except Exception as e:
            print(f"\n❌ Lỗi khi lưu file JSON: {str(e)}")
            raise

    def get_statistics(self, pages_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Tính toán thống kê về dữ liệu đã trích xuất.

        Args:
            pages_data: List các trang đã xử lý

        Returns:
            Dictionary chứa các thống kê
        """
        total_words = sum(page["word_count"] for page in pages_data)
        total_chars = sum(len(page["full_text"]) for page in pages_data)
        pages_with_bbox = sum(1 for page in pages_data if page["word_count"] > 0)
        empty_pages = sum(1 for page in pages_data if page["word_count"] == 0)

        stats = {
            "total_pages": len(pages_data),
            "pages_with_bbox": pages_with_bbox,
            "empty_pages": empty_pages,
            "total_words": total_words,
            "total_characters": total_chars,
            "avg_words_per_page": round(total_words / len(pages_data), 2) if pages_data else 0
        }

        return stats


def parse_bool(value: str) -> bool:
    truthy = {"1", "true", "yes", "y", "on"}
    falsy = {"0", "false", "no", "n", "off"}
    lowered = str(value).strip().lower()
    if lowered in truthy:
        return True
    if lowered in falsy:
        return False
    raise argparse.ArgumentTypeError(f"❌ Giá trị boolean không hợp lệ: {value}")


def find_first_pdf(raw_data_dir: str) -> Optional[str]:
    pdf_files = sorted(Path(raw_data_dir).glob("*.pdf"))
    if not pdf_files:
        return None
    return str(pdf_files[0].resolve())


def resolve_paths(
    input_arg: str = None,
    output_arg: str = None,
    raw_dir_arg: str = DEFAULT_RELATIVE_RAW_DIR,
    processed_dir_arg: str = DEFAULT_RELATIVE_PROCESSED_DIR,
    default_file_arg: str = DEFAULT_DEFAULT_FILE_NAME,
) -> Dict[str, str]:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_dir = os.path.abspath(os.path.join(script_dir, raw_dir_arg))
    processed_dir = os.path.abspath(os.path.join(script_dir, processed_dir_arg))

    if input_arg:
        input_path = input_arg
    elif default_file_arg:
        input_path = os.path.join(raw_data_dir, default_file_arg)
    else:
        first_pdf = find_first_pdf(raw_data_dir)
        if not first_pdf:
            raise FileNotFoundError(f"❌ Không có file PDF nào trong thư mục raw: {raw_data_dir}")
        input_path = first_pdf

    if not os.path.isabs(input_path):
        input_path = os.path.abspath(os.path.join(script_dir, input_path))

    if output_arg:
        output_path = output_arg
        if not os.path.isabs(output_path):
            output_path = os.path.abspath(os.path.join(script_dir, output_path))
    else:
        output_filename = os.path.basename(input_path).replace(".pdf", "_extracted.json")
        output_path = os.path.join(processed_dir, output_filename)

    return {"input_path": input_path, "output_path": output_path, "raw_data_dir": raw_data_dir}


def main():
    """CLI: Trích xuất text + bbox từ PDF text-based."""
    parser = argparse.ArgumentParser(description="Trích xuất văn bản và bounding box từ PDF text-based.")
    parser.add_argument("--input", default=None, help="Đường dẫn file PDF đầu vào")
    parser.add_argument("--output", default=None, help="Đường dẫn file JSON đầu ra")
    parser.add_argument("--raw-dir", default=DEFAULT_RELATIVE_RAW_DIR, help="Thư mục PDF raw (mặc định: ../data/raw)")
    parser.add_argument(
        "--processed-dir",
        default=DEFAULT_RELATIVE_PROCESSED_DIR,
        help="Thư mục output processed (mặc định: ../data/processed)",
    )
    parser.add_argument(
        "--default-file",
        default=DEFAULT_DEFAULT_FILE_NAME,
        help="Tên file mặc định trong raw nếu không truyền --input (mặc định: tự chọn file PDF đầu tiên)",
    )
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES, help="Số trang tối đa cần xử lý (mặc định: tất cả)")
    parser.add_argument("--x-tolerance", type=float, default=DEFAULT_X_TOLERANCE, help="Giá trị x_tolerance cho pdfplumber")
    parser.add_argument("--y-tolerance", type=float, default=DEFAULT_Y_TOLERANCE, help="Giá trị y_tolerance cho pdfplumber")
    parser.add_argument(
        "--keep-blank-chars",
        type=parse_bool,
        default=DEFAULT_KEEP_BLANK_CHARS,
        help="Giữ ký tự trắng khi tách từ: true/false",
    )
    parser.add_argument(
        "--use-text-flow",
        type=parse_bool,
        default=DEFAULT_USE_TEXT_FLOW,
        help="Sắp xếp theo luồng đọc tự nhiên: true/false",
    )
    parser.add_argument(
        "--preview-words",
        type=int,
        default=DEFAULT_PREVIEW_WORDS,
        help="Số từ bbox mẫu in ra ở cuối (mặc định: 3)",
    )
    args = parser.parse_args()

    paths = resolve_paths(
        args.input,
        args.output,
        raw_dir_arg=args.raw_dir,
        processed_dir_arg=args.processed_dir,
        default_file_arg=args.default_file,
    )
    pdf_path = paths["input_path"]
    output_path = paths["output_path"]

    if not os.path.exists(pdf_path):
        print(f"❌ Không tìm thấy file: {pdf_path}")
        print(f"📂 Hãy đảm bảo file nằm trong: {paths['raw_data_dir']} hoặc truyền --input")
        return

    print("\nℹ️ CẤU HÌNH CHẠY:")
    print(f"  - input: {pdf_path}")
    print(f"  - output: {output_path}")
    print(f"  - max_pages: {'all' if args.max_pages is None else args.max_pages}")
    print(f"  - x_tolerance: {args.x_tolerance}")
    print(f"  - y_tolerance: {args.y_tolerance}")
    print(f"  - keep_blank_chars: {args.keep_blank_chars}")
    print(f"  - use_text_flow: {args.use_text_flow}")

    extractor = PDFExtractor(
        pdf_path=pdf_path,
        x_tolerance=args.x_tolerance,
        y_tolerance=args.y_tolerance,
        keep_blank_chars=args.keep_blank_chars,
        use_text_flow=args.use_text_flow,
    )
    pages_data = extractor.extract_all_pages(max_pages=args.max_pages)
    stats = extractor.get_statistics(pages_data)

    print("\n" + "=" * 50)
    print("📊 THỐNG KÊ TRÍCH XUẤT:")
    print("=" * 50)
    for key, value in stats.items():
        print(f"  {key}: {value}")
    print("=" * 50)

    extractor.save_to_json(pages_data, output_path)

    if pages_data and pages_data[0]["words"] and args.preview_words > 0:
        print(f"\n📌 MẪU BOUNDING BOX ({args.preview_words} từ đầu tiên - Trang 1):")
        for i, word in enumerate(pages_data[0]["words"][:args.preview_words], 1):
            bbox = word["bbox"]
            print(f"  {i}. '{word['text']}' -> x0={bbox['x0']}, top={bbox['top']}, x1={bbox['x1']}, bottom={bbox['bottom']}")


if __name__ == "__main__":
    main()
