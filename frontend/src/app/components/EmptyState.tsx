import { Scroll, Sparkles, ArrowRight } from "lucide-react";
import { SAMPLE_QUESTIONS } from "../mockData";
import { motion } from "motion/react";

interface EmptyStateProps {
  onSelectQuestion: (question: string) => void;
}

export function EmptyState({ onSelectQuestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full text-center"
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--t-gold-bg)", border: "1px solid var(--t-gold-border)" }}
        >
          <Scroll size={28} style={{ color: "var(--t-gold)" }} />
        </div>

        {/* Title */}
        <h1 className="mb-2" style={{ color: "var(--t-gold-text)" }}>
          Chatbot Hỏi Đáp Lịch Sử Việt Nam
        </h1>
        <p className="text-sm mb-1" style={{ color: "var(--t-text-3)" }}>
          Hệ thống RAG + Hybrid Search · Trích dẫn nguồn tài liệu PDF
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--t-text-4)" }}>
          Đặt câu hỏi bằng tiếng Việt, hệ thống sẽ trả lời kèm trích dẫn nguồn chính xác
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "var(--t-gold-border)" }}></div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--t-text-4)" }}>
            <Sparkles size={11} />
            Gợi ý câu hỏi
          </div>
          <div className="flex-1 h-px" style={{ background: "var(--t-gold-border)" }}></div>
        </div>

        {/* Sample Questions */}
        <div className="space-y-3">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              onClick={() => onSelectQuestion(q)}
              className="w-full text-left rounded-xl px-4 py-3 transition-all group flex items-start gap-3 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "var(--t-card-bg)",
                border: "1px solid var(--t-gold-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--t-gold-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--t-card-bg)";
              }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center mt-0.5"
                style={{ background: "var(--t-gold-bright)", color: "var(--t-gold)" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm" style={{ color: "var(--t-text-2)" }}>
                {q}
              </span>
              <ArrowRight
                size={14}
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--t-gold)" }}
              />
            </motion.button>
          ))}
        </div>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          {["Trích dẫn nguồn PDF", "Flashcard ôn tập", "Kiến thức liên quan", "Hybrid Search"].map((feat) => (
            <span
              key={feat}
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: "var(--t-card-bg)",
                border: "1px solid var(--t-card-border)",
                color: "var(--t-text-4)",
              }}
            >
              {feat}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
