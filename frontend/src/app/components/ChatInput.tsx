import { useState, useRef, KeyboardEvent } from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { motion } from "motion/react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className="px-6 py-4"
      style={{ borderTop: "1px solid var(--t-topbar-border)", background: "var(--t-input-area-bg)" }}
    >
      <div
        className="rounded-2xl overflow-hidden transition-all"
        style={{
          background: "var(--t-input-inner-bg)",
          border: `1px solid ${canSend ? "var(--t-gold-border)" : "var(--t-input-border)"}`,
          boxShadow: canSend ? "0 0 20px rgba(201,168,76,0.06)" : "none",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={placeholder ?? "Đặt câu hỏi về lịch sử Việt Nam..."}
          rows={1}
          className="w-full bg-transparent px-4 pt-3 pb-2 text-sm resize-none outline-none transition-all"
          style={{
            color: "var(--t-text-1)",
            caretColor: "var(--t-gold)",
            minHeight: "44px",
            maxHeight: "160px",
          }}
        />

        <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
          <div className="flex items-center gap-1">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
              style={{ color: "var(--t-text-5)" }}
              title="Đính kèm tệp"
            >
              <Paperclip size={14} />
            </button>
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
              style={{ color: "var(--t-text-5)" }}
              title="Nhập bằng giọng nói"
            >
              <Mic size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--t-text-5)" }}>
              {value.length > 0 ? `${value.length} ký tự` : "Enter để gửi"}
            </span>
            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              whileTap={canSend ? { scale: 0.92 } : {}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: canSend
                  ? "linear-gradient(135deg, #c9a84c, #a87c2a)"
                  : "var(--t-btn-ghost-bg)",
                color: canSend ? "white" : "var(--t-text-5)",
                cursor: canSend ? "pointer" : "not-allowed",
                border: "1px solid transparent",
              }}
            >
              <Send size={12} />
              Gửi
            </motion.button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs mt-2.5" style={{ color: "var(--t-text-5)" }}>
        Hệ thống RAG + Hybrid Search · Mọi câu trả lời đều kèm trích dẫn nguồn tài liệu
      </p>
    </div>
  );
}
