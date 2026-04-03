"""
Quick test script for OCR extraction - processes only first 2 pages
"""

import os
from pathlib import Path
from pdf_ocr_extractor import PDFOCRExtractor


def find_first_pdf(directory: str = "../data/raw") -> str:
    """Find first PDF file in directory"""
    pdf_files = list(Path(directory).glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in {directory}")
    return str(pdf_files[0])


def main():
    print("=" * 60)
    print("Quick OCR Test - Processing 2 pages only")
    print("=" * 60)

    # Find PDF file
    pdf_path = find_first_pdf()
    print(f"Testing with: {os.path.basename(pdf_path)}")

    # Output to scripts directory for quick testing
    output_path = "test_ocr_output.json"

    # Initialize extractor
    extractor = PDFOCRExtractor(pdf_path, lang='vi')

    # Extract only first 2 pages
    print("\nExtracting first 2 pages...")
    pages_data = extractor.extract_all_pages(max_pages=2, dpi=150)  # Lower DPI for speed

    # Save results
    extractor.save_to_json(pages_data, output_path)

    # Print statistics
    stats = extractor.get_statistics(pages_data)
    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)
    print(f"Pages processed: {stats['total_pages']}")
    print(f"Pages with text: {stats['pages_with_text']}")
    print(f"Total text regions: {stats['total_words']}")
    print(f"Average confidence: {stats['average_confidence']:.2%}")

    # Show sample text from first page
    if pages_data and pages_data[0]['words']:
        print("\nSample text from first page (first 3 lines):")
        for i, word_data in enumerate(pages_data[0]['words'][:3]):
            print(f"  {i+1}. '{word_data['text']}' (confidence: {word_data['confidence']:.2%})")

    print(f"\n✓ Output saved to: {output_path}")
    print("✓ Test completed!")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
