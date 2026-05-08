import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackButtonsProps {
  feedback?: "helpful" | "not_helpful";
  onFeedback: (type: "helpful" | "not_helpful") => void;
}

export function FeedbackButtons({ feedback, onFeedback }: FeedbackButtonsProps) {
  const isSelected = !!feedback;

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs mr-1" style={{ color: "var(--t-text-5)" }}>
        Phản hồi:
      </span>
      <button
        onClick={() => !isSelected && onFeedback("helpful")}
        disabled={isSelected}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
        style={{
          background: feedback === "helpful" ? "rgba(52,199,89,0.15)" : "var(--t-btn-ghost-bg)",
          border: feedback === "helpful"
            ? "1px solid rgba(52,199,89,0.4)"
            : "1px solid var(--t-btn-border)",
          color: feedback === "helpful"
            ? "#34c759"
            : isSelected
            ? "var(--t-text-5)"
            : "var(--t-text-3)",
          cursor: isSelected ? "default" : "pointer",
          opacity: isSelected && feedback !== "helpful" ? 0.4 : 1,
        }}
      >
        <ThumbsUp size={12} />
        Hữu ích
      </button>
      <button
        onClick={() => !isSelected && onFeedback("not_helpful")}
        disabled={isSelected}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
        style={{
          background: feedback === "not_helpful" ? "rgba(255,59,48,0.12)" : "var(--t-btn-ghost-bg)",
          border: feedback === "not_helpful"
            ? "1px solid rgba(255,59,48,0.35)"
            : "1px solid var(--t-btn-border)",
          color: feedback === "not_helpful"
            ? "#ff6b6b"
            : isSelected
            ? "var(--t-text-5)"
            : "var(--t-text-3)",
          cursor: isSelected ? "default" : "pointer",
          opacity: isSelected && feedback !== "not_helpful" ? 0.4 : 1,
        }}
      >
        <ThumbsDown size={12} />
        Không hữu ích
      </button>
      {feedback && (
        <span className="text-xs" style={{ color: "var(--t-text-5)" }}>
          · Cảm ơn phản hồi của bạn!
        </span>
      )}
    </div>
  );
}