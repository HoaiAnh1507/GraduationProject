import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, Maximize2 } from "lucide-react";
import { Citation } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { backendApi } from "../api/backendApi";

interface PDFViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

const PDF_POINTS_PER_INCH = 72;
const PAGE_IMAGE_DPI = 150;
const POINT_TO_IMAGE_PX = PAGE_IMAGE_DPI / PDF_POINTS_PER_INCH;

export function PDFViewerModal({ citation, onClose }: PDFViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(citation?.page ?? 1);
  const [zoom, setZoom] = useState(100);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageImageSize, setPageImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (citation?.page) setCurrentPage(citation.page);
    setPageImageSize(null);
  }, [citation]);

  useEffect(() => {
    setPageImageSize(null);
  }, [currentPage, citation?.documentId]);

  useEffect(() => {
    let cancelled = false;
    if (!citation?.documentId) {
      setTotalPages(null);
      return;
    }
    backendApi
      .getDocument(citation.documentId)
      .then((doc) => {
        if (cancelled) return;
        setTotalPages(doc.totalPages ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setTotalPages(null);
      });
    return () => {
      cancelled = true;
    };
  }, [citation?.documentId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!citation) return null;

  const fallbackTotalPages = Math.max(citation.page ? citation.page + 20 : 50, 50);
  const effectiveTotalPages = totalPages ?? fallbackTotalPages;
  const pdfUrl = citation.documentId ? backendApi.pdfUrl(citation.documentId) : null;
  const pageImageSrc = citation.documentId ? backendApi.pageImageUrl(citation.documentId, currentPage) : null;
  const highlightScale = POINT_TO_IMAGE_PX * (zoom / 100);
  const pageSpans = (citation.pageSpans ?? []).filter((span) => {
    const bbox = span?.bbox_span;
    return (
      span?.page_number === currentPage &&
      bbox &&
      Number.isFinite(bbox.x0) &&
      Number.isFinite(bbox.top) &&
      Number.isFinite(bbox.x1) &&
      Number.isFinite(bbox.bottom)
    );
  });
  const renderedImageWidth = pageImageSize ? pageImageSize.width * (zoom / 100) : undefined;
  const renderedImageHeight = pageImageSize ? pageImageSize.height * (zoom / 100) : undefined;

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
          {/* Header */}
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

            {/* Controls */}
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

          {/* Body: sidebar + viewer */}
          <div className="flex flex-1 min-h-0">
            {/* Left: thumbnail sidebar */}
            <div
              className="w-20 flex-shrink-0 flex flex-col gap-2 p-2 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,12,24,0.8)" }}
            >
              {Array.from({ length: Math.min(8, effectiveTotalPages) }, (_, i) => {
                const pg = Math.max(1, (citation.page ?? 1) - 3 + i);
                const isActive = pg === currentPage;
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className="w-full flex flex-col items-center gap-1 p-1 rounded-lg transition-all"
                    style={{
                      background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                    }}
                  >
                    {/* Tiny page thumbnail */}
                    <div
                      className="w-12 rounded"
                      style={{
                        height: "60px",
                        background: isActive ? "rgba(240,230,200,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isActive ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {isActive && (
                        <div className="w-full h-full flex flex-col gap-1 p-1">
                          {Array.from({ length: 6 }).map((_, li) => (
                            <div
                              key={li}
                              className="h-1 rounded-full"
                              style={{ background: "rgba(201,168,76,0.3)", width: `${60 + Math.random() * 30}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
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

            {/* Right: PDF page content */}
            <div
              className="flex-1 overflow-auto flex justify-center p-6"
              style={{
                background: "rgba(8,14,28,0.6)",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(201,168,76,0.2) transparent",
              }}
            >
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: "100%",
                  maxWidth: "none",
                  minWidth: "300px",
                  minHeight: "500px",
                }}
              >
                <div
                  className="w-full rounded"
                  style={{
                    background: "rgba(240, 235, 220, 0.96)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    overflow: "hidden",
                  }}
                >
                  {pageImageSrc ? (
                    <div
                      style={{
                        position: "relative",
                        width: renderedImageWidth ? `${renderedImageWidth}px` : "100%",
                        height: renderedImageHeight ? `${renderedImageHeight}px` : "auto",
                        lineHeight: 0,
                      }}
                    >
                      <img
                        title={citation.fileName}
                        src={pageImageSrc}
                        alt={`${citation.fileName} - trang ${currentPage}`}
                        onLoad={(e) => {
                          setPageImageSize({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight,
                          });
                        }}
                        style={{
                          display: "block",
                          width: renderedImageWidth ? `${renderedImageWidth}px` : "100%",
                          height: renderedImageHeight ? `${renderedImageHeight}px` : "auto",
                          userSelect: "none",
                        }}
                      />
                      {pageSpans.map((span, index) => {
                        const bbox = span.bbox_span;
                        return (
                          <div
                            key={`${span.page_number}-${index}`}
                            style={{
                              position: "absolute",
                              left: `${bbox.x0 * highlightScale}px`,
                              top: `${bbox.top * highlightScale}px`,
                              width: `${Math.max(1, (bbox.x1 - bbox.x0) * highlightScale)}px`,
                              height: `${Math.max(1, (bbox.bottom - bbox.top) * highlightScale)}px`,
                              background: "rgba(255, 221, 64, 0.38)",
                              border: "1px solid rgba(255, 193, 7, 0.65)",
                              boxShadow: "0 0 0 1px rgba(120, 80, 0, 0.12)",
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6" style={{ color: "rgba(60,40,20,0.7)" }}>
                      Không thể hiển thị PDF vì thiếu `documentId`.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer: page navigation + citation info */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,18,35,0.95)" }}
          >
            {/* Citation metadata */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                📍 Trang {citation.page}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
              >
                {citation.chunkId}
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {currentPage} / {effectiveTotalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(effectiveTotalPages, p + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => setCurrentPage(citation.page ?? 1)}
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
