import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Minimize2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MiniMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MINI_RESPONSES: Record<string, string> = {
  default: "Đây là câu trả lời từ hệ thống RAG. Để tìm hiểu sâu hơn về chủ đề này, bạn có thể tạo một cuộc hội thoại mới.",
  "giải thích": "Để giải thích rõ hơn về vấn đề này, chúng ta cần xem xét bối cảnh lịch sử. Hệ thống sẽ truy xuất các đoạn văn liên quan từ kho tài liệu đã được kiểm chứng.",
  "ví dụ": "Một ví dụ điển hình là sự kiện xảy ra trong giai đoạn này khi các nhân vật lịch sử đã có những quyết định ảnh hưởng lâu dài đến tiến trình dân tộc.",
  "thêm": "Ngoài ra, còn có nhiều khía cạnh khác cần xem xét về chủ đề này. Tôi khuyến nghị bạn tìm hiểu thêm qua các nguồn tài liệu học thuật được đề cập trong hệ thống.",
};

function getAutoReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const [key, reply] of Object.entries(MINI_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return reply;
  }
  return MINI_RESPONSES.default;
}

interface MiniChatbotProps {
  contextTopic?: string;
}

export function MiniChatbot({ contextTopic }: MiniChatbotProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: contextTopic
        ? `Xin chào! Tôi có thể giúp bạn tìm hiểu thêm về "${contextTopic}". Hãy đặt câu hỏi!`
        : "Xin chào! Tôi có thể giải thích thêm về các thẻ flashcard bạn đang học. Hãy đặt câu hỏi!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: MiniMessage = { id: `u_${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = getAutoReply(text);
      setMessages((prev) => [...prev, { id: `a_${Date.now()}`, role: "assistant", content: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: "300px",
              height: minimized ? "auto" : "380px",
              background: "var(--t-card-bg2)",
              border: "1px solid var(--t-gold-border)",
              boxShadow: "0 20px 60px var(--t-overlay-bg)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{
                borderBottom: minimized ? "none" : "1px solid var(--t-divider)",
                background: "var(--t-topbar-bg)",
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--t-bot-bg)", border: "1px solid var(--t-gold-border)" }}
              >
                <Bot size={12} style={{ color: "var(--t-gold)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--t-text-1)" }}>Trợ lý học tập</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs" style={{ color: "var(--t-text-4)" }}>Trực tuyến</span>
                </div>
              </div>
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-6 h-6 flex items-center justify-center rounded transition-all hover:opacity-70"
                style={{ color: "var(--t-text-3)" }}
              >
                {minimized ? <ChevronDown size={12} /> : <Minimize2 size={12} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/10"
                style={{ color: "rgba(255,100,100,0.5)" }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Body */}
            {!minimized && (
              <>
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-3 space-y-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--t-gold-bg) transparent",
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "var(--t-gold-bg)" }}
                        >
                          <Bot size={10} style={{ color: "var(--t-gold)" }} />
                        </div>
                      )}
                      <div
                        className="max-w-[200px] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed"
                        style={{
                          background: msg.role === "user" ? "var(--t-gold-bright)" : "var(--t-card-bg)",
                          border: msg.role === "user"
                            ? "1px solid var(--t-gold-border)"
                            : "1px solid var(--t-card-border)",
                          color: "var(--t-text-1)",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--t-gold-bg)" }}
                      >
                        <Bot size={10} style={{ color: "var(--t-gold)" }} />
                      </div>
                      <div
                        className="px-3 py-2 rounded-xl"
                        style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                      >
                        <div className="flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "var(--t-gold)" }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div
                  className="flex items-center gap-2 p-2.5"
                  style={{ borderTop: "1px solid var(--t-divider)" }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Hỏi về chủ đề này..."
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                    style={{ color: "var(--t-text-1)" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30"
                    style={{ background: "var(--t-gold-bg)", color: "var(--t-gold)" }}
                  >
                    <Send size={11} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
        style={{
          background: "linear-gradient(135deg, #c9a84c, #a87c2a)",
          boxShadow: "0 8px 24px rgba(201,168,76,0.35)",
        }}
        title="Trợ lý học tập"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={18} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare size={18} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Unread indicator */}
        {!open && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white border-2"
            style={{ background: "#a06aff", fontSize: "9px", borderColor: "var(--t-app-bg)" }}
          >
            ?
          </div>
        )}
      </motion.button>
    </div>
  );
}
