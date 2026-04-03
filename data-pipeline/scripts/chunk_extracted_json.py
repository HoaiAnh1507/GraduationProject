"""
Chunk extracted PDF JSON (text-based) into semantic chunks with coordinate spans.

Input format:
- Produced by pdf_extractor.py
- metadata + pages[].words[] where each word has text + bbox

Output format:
- metadata + chunks[]
- each chunk contains text, page range, source file, and per-page bbox span
"""

import argparse
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Tuple


def load_extracted_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_token(word_obj: Dict[str, Any]) -> Dict[str, Any]:
    text = str(word_obj.get("text", "")).strip()
    bbox = word_obj.get("bbox", {})
    return {
        "text": text,
        "bbox": {
            "x0": float(bbox.get("x0", 0.0)),
            "top": float(bbox.get("top", 0.0)),
            "x1": float(bbox.get("x1", 0.0)),
            "bottom": float(bbox.get("bottom", 0.0)),
        },
    }


def collect_tokens_by_page(extracted: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    pages = extracted.get("pages", [])
    for page in pages:
        page_number = int(page.get("page_number", 0))
        words = page.get("words", [])
        for w in words:
            token = normalize_token(w)
            if token["text"]:
                rows.append(
                    {
                        "page_number": page_number,
                        "text": token["text"],
                        "bbox": token["bbox"],
                    }
                )
    return rows


def merge_page_bbox(page_items: List[Dict[str, Any]]) -> Dict[str, float]:
    x0 = min(item["bbox"]["x0"] for item in page_items)
    top = min(item["bbox"]["top"] for item in page_items)
    x1 = max(item["bbox"]["x1"] for item in page_items)
    bottom = max(item["bbox"]["bottom"] for item in page_items)
    return {"x0": round(x0, 2), "top": round(top, 2), "x1": round(x1, 2), "bottom": round(bottom, 2)}


def build_chunks(
    tokens: List[Dict[str, Any]],
    chunk_size_words: int,
    overlap_words: int,
    min_chunk_words: int,
) -> List[Dict[str, Any]]:
    if chunk_size_words <= 0:
        raise ValueError("chunk_size_words must be > 0")
    if overlap_words < 0:
        raise ValueError("overlap_words must be >= 0")
    if overlap_words >= chunk_size_words:
        raise ValueError("overlap_words must be smaller than chunk_size_words")

    chunks: List[Dict[str, Any]] = []
    start = 0
    chunk_id = 0
    n = len(tokens)

    while start < n:
        end = min(start + chunk_size_words, n)
        window = tokens[start:end]
        if len(window) < min_chunk_words and chunk_id > 0:
            break

        text = " ".join(item["text"] for item in window).strip()
        pages = sorted({item["page_number"] for item in window})

        page_spans = []
        for p in pages:
            p_items = [item for item in window if item["page_number"] == p]
            page_spans.append(
                {
                    "page_number": p,
                    "bbox_span": merge_page_bbox(p_items),
                    "token_count": len(p_items),
                }
            )

        chunks.append(
            {
                "chunk_id": chunk_id,
                "text": text,
                "word_count": len(window),
                "page_start": pages[0],
                "page_end": pages[-1],
                "page_spans": page_spans,
            }
        )
        chunk_id += 1

        if end == n:
            break
        start = end - overlap_words

    return chunks


def create_output(extracted: Dict[str, Any], chunks: List[Dict[str, Any]], params: Dict[str, Any]) -> Dict[str, Any]:
    metadata = extracted.get("metadata", {})
    return {
        "metadata": {
            "source_file_name": metadata.get("file_name"),
            "source_total_pages": metadata.get("total_pages"),
            "source_pages_processed": metadata.get("pages_processed"),
            "source_extraction_date": metadata.get("extraction_date"),
            "chunking_date": datetime.now().isoformat(),
            "chunking_config": params,
            "total_chunks": len(chunks),
        },
        "chunks": chunks,
    }


def default_output_path(input_path: str) -> str:
    base, _ = os.path.splitext(input_path)
    return f"{base}_chunks.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk extracted PDF JSON into chunk JSON for embedding.")
    parser.add_argument("--input", required=True, help="Path to extracted JSON from pdf_extractor.py")
    parser.add_argument("--output", default=None, help="Path to output chunks JSON")
    parser.add_argument("--chunk-size", type=int, default=220, help="Chunk size in words")
    parser.add_argument("--overlap", type=int, default=40, help="Overlap in words")
    parser.add_argument("--min-chunk-words", type=int, default=50, help="Minimum words for tail chunk")
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output or default_output_path(input_path)

    extracted = load_extracted_json(input_path)
    tokens = collect_tokens_by_page(extracted)
    if not tokens:
        raise RuntimeError("No tokens found in input. This file may be scanned/OCR-empty.")

    params = {
        "chunk_size_words": args.chunk_size,
        "overlap_words": args.overlap,
        "min_chunk_words": args.min_chunk_words,
    }
    chunks = build_chunks(tokens, args.chunk_size, args.overlap, args.min_chunk_words)
    out = create_output(extracted, chunks, params)

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Tokens: {len(tokens)}")
    print(f"Chunks: {len(chunks)}")


if __name__ == "__main__":
    main()
