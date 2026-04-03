"""
PDF OCR Extractor - Extract text with bounding boxes from scanned PDFs using PaddleOCR
Supports Vietnamese language OCR for scanned/image-based PDF files

Usage:
    python pdf_ocr_extractor.py <pdf_path> [--output <output_path>] [--max-pages <n>] [--lang vi]
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import argparse

from pdf2image import convert_from_path
from paddleocr import PaddleOCR
from PIL import Image


class PDFOCRExtractor:
    """Extract text and bounding boxes from scanned PDFs using OCR"""

    def __init__(self, pdf_path: str, lang: str = 'vi'):
        """
        Initialize OCR extractor

        Args:
            pdf_path: Path to PDF file
            lang: Language code for OCR (default: 'vi' for Vietnamese)
        """
        self.pdf_path = pdf_path
        self.lang = lang

        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        # Initialize PaddleOCR
        # use_angle_cls=True helps detect rotated text
        # lang='vi' for Vietnamese, 'en' for English
        print(f"Initializing PaddleOCR with language: {lang}")
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang=lang,
            use_gpu=False  # Set to True if GPU is available
        )

    def convert_bbox_format(self, paddle_bbox: List[List[float]]) -> Dict[str, float]:
        """
        Convert PaddleOCR bounding box format to standard format

        PaddleOCR returns: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] (4 corners)
        Convert to: {x0: left, top: top, x1: right, bottom: bottom}

        Args:
            paddle_bbox: Bounding box from PaddleOCR (4 corner points)

        Returns:
            Dictionary with x0, top, x1, bottom coordinates
        """
        # Extract all x and y coordinates
        x_coords = [point[0] for point in paddle_bbox]
        y_coords = [point[1] for point in paddle_bbox]

        # Get min/max to form rectangle
        return {
            "x0": round(min(x_coords), 2),
            "top": round(min(y_coords), 2),
            "x1": round(max(x_coords), 2),
            "bottom": round(max(y_coords), 2)
        }

    def extract_page_with_ocr(self, image: Image.Image, page_num: int) -> Dict[str, Any]:
        """
        Extract text and bounding boxes from a single page image using OCR

        Args:
            image: PIL Image object of the page
            page_num: Page number (1-indexed)

        Returns:
            Dictionary containing page data with words and bounding boxes
        """
        print(f"  Processing page {page_num} with OCR...")

        # Convert PIL Image to numpy array for PaddleOCR
        import numpy as np
        image_np = np.array(image)

        # Run OCR
        result = self.ocr.ocr(image_np, cls=True)

        # Extract words and bounding boxes
        words_data = []
        full_text_parts = []

        if result and result[0]:
            for line in result[0]:
                bbox_points = line[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                text_info = line[1]    # (text, confidence)

                text = text_info[0]
                confidence = text_info[1]

                # Convert bbox format
                bbox = self.convert_bbox_format(bbox_points)

                # Store word data
                words_data.append({
                    "text": text,
                    "bbox": bbox,
                    "confidence": round(confidence, 4)
                })

                full_text_parts.append(text)

        # Combine all text
        full_text = " ".join(full_text_parts)

        page_data = {
            "page_number": page_num,
            "width": image.width,
            "height": image.height,
            "words": words_data,
            "full_text": full_text,
            "word_count": len(words_data)
        }

        print(f"    ✓ Extracted {len(words_data)} text regions")
        return page_data

    def extract_all_pages(self, max_pages: Optional[int] = None,
                         dpi: int = 200,
                         first_page: Optional[int] = None,
                         last_page: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Extract all pages from PDF with OCR

        Args:
            max_pages: Maximum number of pages to process (None = all pages)
            dpi: DPI for image conversion (higher = better quality but slower)
            first_page: First page to process (1-indexed)
            last_page: Last page to process (1-indexed)

        Returns:
            List of page data dictionaries
        """
        print(f"Converting PDF to images (DPI={dpi})...")

        # Convert PDF to images
        images = convert_from_path(
            self.pdf_path,
            dpi=dpi,
            first_page=first_page,
            last_page=last_page
        )

        total_images = len(images)
        if max_pages:
            total_images = min(total_images, max_pages)
            images = images[:max_pages]

        print(f"Processing {total_images} pages...")

        pages_data = []
        for idx, image in enumerate(images, start=1):
            page_data = self.extract_page_with_ocr(image, idx)
            pages_data.append(page_data)

        return pages_data

    def save_to_json(self, pages_data: List[Dict[str, Any]], output_path: str):
        """
        Save extracted data to JSON file

        Args:
            pages_data: List of page data
            output_path: Output file path
        """
        # Prepare metadata
        metadata = {
            "file_name": os.path.basename(self.pdf_path),
            "total_pages": len(pages_data),
            "pages_processed": len(pages_data),
            "extraction_date": datetime.now().isoformat(),
            "extraction_method": "PaddleOCR",
            "language": self.lang
        }

        # Combine metadata and pages
        output_data = {
            "metadata": metadata,
            "pages": pages_data
        }

        # Save to JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Saved to: {output_path}")

    def get_statistics(self, pages_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate statistics from extracted data

        Args:
            pages_data: List of page data

        Returns:
            Dictionary with statistics
        """
        total_words = sum(page["word_count"] for page in pages_data)
        pages_with_text = sum(1 for page in pages_data if page["word_count"] > 0)

        # Calculate average confidence
        all_confidences = []
        for page in pages_data:
            for word in page["words"]:
                if "confidence" in word:
                    all_confidences.append(word["confidence"])

        avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0

        stats = {
            "total_pages": len(pages_data),
            "pages_with_text": pages_with_text,
            "total_words": total_words,
            "average_words_per_page": round(total_words / len(pages_data), 2) if pages_data else 0,
            "average_confidence": round(avg_confidence, 4)
        }

        return stats


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description="Extract text with bounding boxes from scanned PDFs using OCR"
    )
    parser.add_argument(
        "pdf_path",
        type=str,
        help="Path to PDF file"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Output JSON file path (default: <pdf_name>_ocr_extracted.json)"
    )
    parser.add_argument(
        "-m", "--max-pages",
        type=int,
        default=None,
        help="Maximum number of pages to process (default: all)"
    )
    parser.add_argument(
        "-l", "--lang",
        type=str,
        default="vi",
        help="Language code for OCR (default: vi for Vietnamese)"
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="DPI for image conversion (default: 200, higher = better quality but slower)"
    )
    parser.add_argument(
        "--first-page",
        type=int,
        default=None,
        help="First page to process (1-indexed)"
    )
    parser.add_argument(
        "--last-page",
        type=int,
        default=None,
        help="Last page to process (1-indexed)"
    )

    args = parser.parse_args()

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        pdf_name = Path(args.pdf_path).stem
        output_dir = Path(args.pdf_path).parent.parent / "processed"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{pdf_name}_ocr_extracted.json"

    try:
        # Initialize extractor
        print(f"PDF OCR Extractor")
        print(f"=" * 60)
        print(f"Input PDF: {args.pdf_path}")
        print(f"Output: {output_path}")
        print(f"Language: {args.lang}")
        print(f"DPI: {args.dpi}")
        if args.max_pages:
            print(f"Max pages: {args.max_pages}")
        if args.first_page:
            print(f"First page: {args.first_page}")
        if args.last_page:
            print(f"Last page: {args.last_page}")
        print(f"=" * 60)

        extractor = PDFOCRExtractor(args.pdf_path, lang=args.lang)

        # Extract pages
        pages_data = extractor.extract_all_pages(
            max_pages=args.max_pages,
            dpi=args.dpi,
            first_page=args.first_page,
            last_page=args.last_page
        )

        # Save results
        extractor.save_to_json(pages_data, str(output_path))

        # Print statistics
        stats = extractor.get_statistics(pages_data)
        print(f"\nStatistics:")
        print(f"  Total pages: {stats['total_pages']}")
        print(f"  Pages with text: {stats['pages_with_text']}")
        print(f"  Total words/regions: {stats['total_words']}")
        print(f"  Average words per page: {stats['average_words_per_page']}")
        print(f"  Average confidence: {stats['average_confidence']:.2%}")

        print(f"\n✓ Extraction completed successfully!")

    except Exception as e:
        print(f"\n✗ Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
