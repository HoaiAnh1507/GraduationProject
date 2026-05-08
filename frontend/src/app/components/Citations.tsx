import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, BookOpen, AlertTriangle, ExternalLink } from "lucide-react";
import { Citation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CitationItemProps {
  citation: Citation;
  index: number;
  onOpenPDF?: (citation: Citation) => void;
}

function CitationItem({ citation, index, onOpenPDF }: CitationItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--t-gold-border)", background: "var(--t-card-bg2)" }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Index badge */}
        <span
          className="flex-shrink-0 w-5 h-5 rounded text-xs flex items-center justify-center"
          style={{ background: "var(--t-gold-bright)", color: "var(--t-gold)" }}
        >
          {index + 1}
        </span>

        {/* File info */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 flex items-center gap-2 text-left transition-all hover:opacity-80"
        >
          <FileText size={13} className="flex-shrink-0" style={{ color: "var(--t-gold)" }} />
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: "var(--t-text-1)" }}>
              {citation.fileName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {citation.page && (
                <span className="text-xs" style={{ color: "var(--t-text-4)" }}>
                  Trang {citation.page}
                </span>
              )}
              {citation.chunkId && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--t-gold-bg)",
                    color: "var(--t-gold)",
                    fontFamily: "monospace",
                  }}
                >
                  {citation.chunkId}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* View PDF button */}
        {onOpenPDF && (
          <button
            onClick={() => onOpenPDF(citation)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "var(--t-gold-bg)",
              color: "var(--t-gold)",
              border: "1px solid var(--t-gold-border)",
            }}
            title="Mở trong PDF Viewer"
          >
            <ExternalLink size={11} />
            <span>Xem PDF</span>
          </button>
        )}

        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all hover:opacity-70"
          style={{ color: "var(--t-text-4)" }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 text-xs leading-relaxed"
              style={{
                borderTop: "1px solid var(--t-gold-bg)",
                background: "var(--t-gold-bg)",
                color: "var(--t-text-2)",
                fontStyle: "italic",
              }}
            >
              <div className="flex gap-2">
                <div
                  className="w-0.5 rounded flex-shrink-0 mt-0.5"
                  style={{ background: "var(--t-gold-border)", minHeight: "2rem" }}
                />
                <p>"{citation.excerpt}"</p>
              </div>
              <div
                className="flex items-center gap-1.5 mt-2 not-italic"
                style={{ color: "var(--t-gold)" }}
              >
                <BookOpen size={11} />
                <span>
                  {citation.fileName}
                  {citation.page ? `, tr. ${citation.page}` : ""}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CitationsProps {
  citations: Citation[];
  onOpenPDF?: (citation: Citation) => void;
}

export function Citations({ citations, onOpenPDF }: CitationsProps) {
  if (citations.length === 0) {
    return (
      <div
        className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 mt-3"
        style={{ background: "rgba(255,180,0,0.06)", border: "1px solid rgba(255,180,0,0.2)" }}
      >
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f5c842" }} />
        <p className="text-xs" style={{ color: "rgba(255,200,80,0.8)" }}>
          Không tìm thấy nguồn phù hợp; câu trả lời có thể kém chắc chắn.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={12} style={{ color: "var(--t-gold)" }} />
        <span
          className="text-xs"
          style={{ color: "var(--t-gold)", letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          Nguồn tham khảo ({citations.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {citations.map((citation, i) => (
          <CitationItem key={citation.id} citation={citation} index={i} onOpenPDF={onOpenPDF} />
        ))}
      </div>
    </div>
  );
}
