import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, Maximize2 } from "lucide-react";
import { Citation, PageSpan } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { backendApi } from "../api/backendApi";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

interface PDFViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

interface PageRange {
  start: number;
  end: number;
}

interface PdfPageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  pageSpans: PageSpan[];
  isActive: boolean;
  setPageRef: (pageNumber: number, el: HTMLDivElement | null) => void;
}

const INITIAL_RADIUS = 2;
const PAGE_BATCH_SIZE = 5;
const SCROLL_LOAD_THRESHOLD = 900;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function pagesInRange(range: PageRange) {
  return Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i);
}

function initialRange(page: number, totalPages: number): PageRange {
  return {
    start: clamp(page - INITIAL_RADIUS, 1, totalPages),
    end: clamp(page + INITIAL_RADIUS, 1, totalPages),
  };
}

function PdfPageCanvas({ pdfDoc, pageNumber, zoom, pageSpans, isActive, setPageRef }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const scale = zoom / 100;
  const highlights = pageSpans.filter((span) => {
    const bbox = span?.bbox_span;
    return (
      span?.page_number === pageNumber &&
      bbox &&
      Number.isFinite(bbox.x0) &&
      Number.isFinite(bbox.top) &&
      Number.isFinite(bbox.x1) &&
      Number.isFinite(bbox.bottom)
    );
  });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputScale = window.devicePixelRatio || 1;
    renderTaskRef.current?.cancel();
    setRenderError(null);

    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        setPageSize({ width: viewport.width, height: viewport.height });

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        renderTaskRef.current = renderTask;
        return renderTask.promise;
      })
      .catch((err) => {
        if (cancelled || err?.name === "RenderingCancelledException") return;
        setRenderError("Không thể render trang PDF.");
      });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div
      ref={(el) => setPageRef(pageNumber, el)}
      data-page-number={pageNumber}
      className="flex flex-col items-center gap-2"
      style={{ scrollMarginTop: "24px" }}
    >
      <div
        className="text-xs px-2 py-1 rounded"
        style={{
          color: isActive ? "#c9a84c" : "rgba(255,255,255,0.45)",
          background: isActive ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isActive ? "rgba(201,168,76,0.22)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        Trang {pageNumber}
      </div>
      <div
        className="rounded"
        style={{
          position: "relative",
          width: pageSize ? `${pageSize.width}px` : "min(720px, 75vw)",
          height: pageSize ? `${pageSize.height}px` : "900px",
          lineHeight: 0,
          background: "rgba(240, 235, 220, 0.96)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "block", userSelect: "none" }} />
        {highlights.map((span, index) => {
          const bbox = span.bbox_span;
          return (
            <div
              key={`${span.page_number}-${index}`}
              style={{
                position: "absolute",
                left: `${bbox.x0 * scale}px`,
                top: `${bbox.top * scale}px`,
                width: `${Math.max(1, (bbox.x1 - bbox.x0) * scale)}px`,
                height: `${Math.max(1, (bbox.bottom - bbox.top) * scale)}px`,
                background: "rgba(255, 221, 64, 0.38)",
                border: "1px solid rgba(255, 193, 7, 0.65)",
                boxShadow: "0 0 0 1px rgba(120, 80, 0, 0.12)",
                pointerEvents: "none",
              }}
            />
          );
        })}
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-sm" style={{ color: "rgba(60,40,20,0.75)" }}>
            {renderError}
          </div>
        )}
      </div>
    </div>
  );
}

export function PDFViewerModal({ citation, onClose }: PDFViewerModalProps) {
  const initialPage = citation?.page ?? 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(100);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [loadedRange, setLoadedRange] = useState<PageRange>({ start: initialPage, end: initialPage });
  const [pendingScrollPage, setPendingScrollPage] = useState<number | null>(initialPage);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const effectiveTotalPages = totalPages ?? Math.max(initialPage + 20, 50);
  const pdfUrl = citation?.documentId ? backendApi.pdfUrl(citation.documentId) : null;

  const setPageRef = (pageNumber: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNumber, el);
    } else {
      pageRefs.current.delete(pageNumber);
    }
  };

  const ensureRangeContainsPage = (page: number, total = effectiveTotalPages) => {
    setLoadedRange((range) => ({
      start: clamp(Math.min(range.start, page - INITIAL_RADIUS), 1, total),
      end: clamp(Math.max(range.end, page + INITIAL_RADIUS), 1, total),
    }));
  };

  const scrollToPage = (page: number) => {
    const target = clamp(page, 1, effectiveTotalPages);
    ensureRangeContainsPage(target);
    setCurrentPage(target);
    setPendingScrollPage(target);
  };

  useEffect(() => {
    if (!citation) return;
    const page = citation.page ?? 1;
    setCurrentPage(page);
    setLoadedRange(initialRange(page, effectiveTotalPages));
    setPendingScrollPage(page);
    pageRefs.current.clear();
  }, [citation, effectiveTotalPages]);

  useEffect(() => {
    let cancelled = false;
    if (!citation?.documentId) {
      setPdfDoc(null);
      setTotalPages(null);
      setRenderError(null);
      return;
    }

    const loadingTask = pdfjsLib.getDocument({
      url: backendApi.pdfUrl(citation.documentId),
      withCredentials: true,
    });

    setPdfDoc(null);
    setTotalPages(null);
    setRenderError(null);

    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        const page = citation.page ?? 1;
        setLoadedRange(initialRange(page, doc.numPages));
        setPendingScrollPage(page);
      })
      .catch(() => {
        if (cancelled) return;
        setPdfDoc(null);
        setRenderError("Không thể tải PDF.");
      });

    return () => {
      cancelled = true;
      if (typeof loadingTask.destroy === "function") {
        loadingTask.destroy();
      }
    };
  }, [citation?.documentId, citation?.page]);

  useEffect(() => {
    const page = pendingScrollPage;
    if (!page) return;
    const el = pageRefs.current.get(page);
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start", behavior: "auto" });
      setPendingScrollPage(null);
    });
  }, [pendingScrollPage, loadedRange, pdfDoc]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleScroll = () => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const distanceToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceToBottom < SCROLL_LOAD_THRESHOLD) {
      setLoadedRange((range) => ({
        start: range.start,
        end: clamp(range.end + PAGE_BATCH_SIZE, 1, effectiveTotalPages),
      }));
    }

    if (scroller.scrollTop < SCROLL_LOAD_THRESHOLD) {
      setLoadedRange((range) => ({
        start: clamp(range.start - PAGE_BATCH_SIZE, 1, effectiveTotalPages),
        end: range.end,
      }));
    }

    const containerTop = scroller.getBoundingClientRect().top;
    let nearestPage = currentPage;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const [pageNumber, el] of pageRefs.current.entries()) {
      const distance = Math.abs(el.getBoundingClientRect().top - containerTop - 24);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageNumber;
      }
    }
    if (nearestPage !== currentPage) {
      setCurrentPage(nearestPage);
    }
  };

  if (!citation) return null;

  const sidebarPages = Array.from({ length: Math.min(8, effectiveTotalPages) }, (_, i) =>
    clamp(currentPage - 3 + i, 1, effectiveTotalPages)
  ).filter((page, index, arr) => arr.indexOf(page) === index);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(900px, 95vw)",
            height: "min(700px, 92vh)",
            background: "var(--t-card-bg2)",
            border: "1px solid var(--t-gold-border)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.15)", background: "rgba(10,18,35,0.95)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <FileText size={15} style={{ color: "#c9a84c" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                {citation.fileName}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Trang {currentPage} / {effectiveTotalPages} · {citation.chunkId}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(75, z - 25))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Thu nhỏ"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-xs px-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Phóng to"
              >
                <ZoomIn size={13} />
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Toàn màn hình"
              >
                <Maximize2 size={13} />
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Tải xuống"
                onClick={() => {
                  if (!pdfUrl) return;
                  window.open(pdfUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <Download size={13} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
                style={{ color: "rgba(255,100,100,0.6)", border: "1px solid rgba(255,100,100,0.15)" }}
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            <div
              className="w-20 flex-shrink-0 flex flex-col gap-2 p-2 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,12,24,0.8)" }}
            >
              {sidebarPages.map((pg) => {
                const isActive = pg === currentPage;
                return (
                  <button
                    key={pg}
                    onClick={() => scrollToPage(pg)}
                    className="w-full flex flex-col items-center gap-1 p-1 rounded-lg transition-all"
                    style={{
                      background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-12 rounded"
                      style={{
                        height: "60px",
                        background: isActive ? "rgba(240,230,200,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isActive ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: isActive ? "#c9a84c" : "rgba(255,255,255,0.25)" }}
                    >
                      {pg}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-auto p-6"
              style={{
                background: "rgba(8,14,28,0.6)",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(201,168,76,0.2) transparent",
              }}
            >
              {renderError && (
                <div className="p-6 rounded text-sm" style={{ color: "rgba(255,255,255,0.72)", background: "rgba(255,255,255,0.06)" }}>
                  {renderError}
                </div>
              )}

              {pdfDoc && (
                <div className="flex flex-col items-center gap-8">
                  {pagesInRange(loadedRange).map((pageNumber) => (
                    <PdfPageCanvas
                      key={pageNumber}
                      pdfDoc={pdfDoc}
                      pageNumber={pageNumber}
                      zoom={zoom}
                      pageSpans={citation.pageSpans ?? []}
                      isActive={pageNumber === currentPage}
                      setPageRef={setPageRef}
                    />
                  ))}
                </div>
              )}

              {!pdfUrl && (
                <div className="p-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Không thể hiển thị PDF vì thiếu `documentId`.
                </div>
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,18,35,0.95)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                Minh chứng trang {citation.page}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
              >
                {citation.chunkId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollToPage(currentPage - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {currentPage} / {effectiveTotalPages}
              </span>
              <button
                onClick={() => scrollToPage(currentPage + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => scrollToPage(citation.page ?? 1)}
                className="ml-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                Về trang trích dẫn
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
