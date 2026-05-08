import { useState, useRef, useEffect } from "react";
import { Search, Settings, Database, Zap, Info } from "lucide-react";
import { Message, Conversation, Citation } from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageLoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ChatInput } from "./ChatInput";
import { PDFViewerModal } from "./PDFViewerModal";
import { SIMULATED_RESPONSE } from "../mockData";
import { motion, AnimatePresence } from "motion/react";

interface ChatPageProps {
  conversation: Conversation | null;
  onUpdateConversation: (conv: Conversation) => void;
}

let msgIdCounter = 1000;
const newId = () => `msg_${++msgIdCounter}`;

function TopBar({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{
        borderBottom: "1px solid var(--t-topbar-border)",
        background: "var(--t-topbar-bg)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm" style={{ color: "var(--t-text-1)" }}>
            {title || "Hội thoại mới"}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Zap size={10} style={{ color: "var(--t-gold)" }} />
              <span className="text-xs" style={{ color: "var(--t-text-4)" }}>RAG</span>
            </div>
            <span style={{ color: "var(--t-text-5)" }}>·</span>
            <div className="flex items-center gap-1">
              <Search size={10} style={{ color: "#6399ff" }} />
              <span className="text-xs" style={{ color: "var(--t-text-4)" }}>Hybrid Search</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(99,153,255,0.08)", border: "1px solid rgba(99,153,255,0.15)" }}
        >
          <Database size={11} style={{ color: "#6399ff" }} />
          <span className="text-xs" style={{ color: "rgba(99,153,255,0.8)" }}>12 tài liệu</span>
        </div>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
          title="Thông tin hệ thống"
        >
          <Info size={14} />
        </button>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
          title="Cài đặt"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}

export function ChatPage({ conversation, onUpdateConversation }: ChatPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openPDFCitation, setOpenPDFCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    if (!conversation) return;

    const userMsg: Message = {
      id: newId(),
      role: "user",
      content: text,
      timestamp: new Date(),
      hasCitations: false,
    };

    const updatedWithUser: Conversation = {
      ...conversation,
      title:
        conversation.messages.length === 0
          ? text.slice(0, 40) + (text.length > 40 ? "..." : "")
          : conversation.title,
      lastMessage: text,
      timestamp: new Date(),
      messages: [...conversation.messages, userMsg],
    };

    onUpdateConversation(updatedWithUser);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: newId(),
        role: "assistant",
        content: SIMULATED_RESPONSE.content,
        timestamp: new Date(),
        hasCitations: true,
        citations: SIMULATED_RESPONSE.citations,
        suggestedFlashcards: SIMULATED_RESPONSE.suggestedFlashcards,
        relatedTopics: [
          {
            id: "rt1",
            title: "Hệ thống RAG trong NLP",
            description: "Kiến trúc Retrieval-Augmented Generation kết hợp tìm kiếm tài liệu với sinh ngôn ngữ, giúp tăng độ chính xác và khả năng trích dẫn nguồn.",
            tags: ["RAG", "NLP", "AI"],
          },
          {
            id: "rt2",
            title: "Hybrid Search – BM25 + Dense Retrieval",
            description: "Kết hợp tìm kiếm thưa (BM25 keyword) và tìm kiếm dày (vector embedding) cho kết quả tốt hơn bất kỳ phương pháp đơn lẻ nào.",
            tags: ["Search", "BM25", "Embedding"],
          },
        ],
      };

      onUpdateConversation({
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, assistantMsg],
      });
      setIsLoading(false);
    }, 2200);
  };

  const handleFeedback = (msgId: string, type: "helpful" | "not_helpful") => {
    if (!conversation) return;
    onUpdateConversation({
      ...conversation,
      messages: conversation.messages.map((m) =>
        m.id === msgId ? { ...m, feedback: type } : m
      ),
    });
  };

  const handleRetry = (msgId: string) => {
    if (!conversation) return;
    onUpdateConversation({
      ...conversation,
      messages: conversation.messages.filter((m) => m.id !== msgId),
    });
  };

  const handleExploreRelated = (topic: string) => {
    handleSend(`Hãy cho tôi biết thêm về: ${topic}`);
  };

  const handleSelectQuestion = (q: string) => {
    handleSend(q);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title={conversation?.title ?? ""} />

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--t-gold-bg) transparent",
        }}
      >
        <AnimatePresence mode="wait">
          {messages.length === 0 && !isLoading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <EmptyState onSelectQuestion={handleSelectQuestion} />
            </motion.div>
          ) : (
            <motion.div key="messages" className="py-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onFeedback={handleFeedback}
                  onRetry={handleRetry}
                  onExploreRelated={handleExploreRelated}
                  onOpenPDF={(citation) => setOpenPDFCitation(citation)}
                />
              ))}
              {isLoading && <MessageLoadingSkeleton />}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder={isLoading ? "Đang xử lý câu hỏi..." : "Đặt câu hỏi về lịch sử Việt Nam..."}
      />

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {openPDFCitation && (
          <PDFViewerModal
            citation={openPDFCitation}
            onClose={() => setOpenPDFCitation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}