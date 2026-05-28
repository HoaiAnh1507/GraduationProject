import { useState, useRef, useEffect } from "react";
import { Search, Settings, Database, Zap, Info } from "lucide-react";
import { Message, Conversation, Citation } from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageLoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ChatInput } from "./ChatInput";
import { PDFViewerModal } from "./PDFViewerModal";
import { motion, AnimatePresence } from "motion/react";
import { backendApi } from "../api/backendApi";

interface ChatPageProps {
  conversation: Conversation | null;
  onUpdateConversation: (conv: Conversation) => void;
  onCreateConversation: () => void;
}

let msgIdCounter = 1000;
const newId = () => `msg_${++msgIdCounter}`;

function TopBar({ title, documentCount }: { title: string; documentCount?: number }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{
        borderBottom: "1px solid var(--t-topbar-border)",
        background: "var(--t-topbar-bg)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <h2
            className="text-sm"
            style={{
              color: "var(--t-text-1)",
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "clip",
              wordBreak: "break-word",
            }}
          >
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
          <span className="text-xs" style={{ color: "rgba(99,153,255,0.8)" }}>
            {documentCount ?? 0} tài liệu
          </span>
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

export function ChatPage({ conversation, onUpdateConversation, onCreateConversation }: ChatPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openPDFCitation, setOpenPDFCitation] = useState<Citation | null>(null);
  const [documentCount, setDocumentCount] = useState<number | undefined>(undefined);
  const [documentsByBaseName, setDocumentsByBaseName] = useState<Map<string, number>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    let cancelled = false;
    backendApi
      .listDocuments()
      .then((docs) => {
        if (cancelled) return;
        setDocumentCount(docs.length);
        const map = new Map<string, number>();
        for (const d of docs) {
          map.set(backendApi.basename(d.sourceFile), d.id);
        }
        setDocumentsByBaseName(map);
      })
      .catch(() => {
        if (cancelled) return;
        setDocumentCount(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async (text: string) => {
    if (!conversation) {
      return (
        <div className="flex flex-col h-full">
          <TopBar title="" documentCount={documentCount} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm" style={{ color: "var(--t-text-3)" }}>
                Chưa có hội thoại nào. Tạo hội thoại mới để bắt đầu.
              </p>
              <button
                onClick={onCreateConversation}
                className="mt-4 px-4 py-2 rounded-lg text-sm"
                style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
              >
                Tạo hội thoại
              </button>
            </div>
          </div>
        </div>
      );
    }

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

    try {
      const conversationId = Number(conversation.id);
      if (Number.isNaN(conversationId)) {
        throw new Error("Invalid conversation id");
      }
      const resp = await backendApi.askChat(text, conversationId);

      const citations: Citation[] = (resp.citations ?? []).map((c, i) => {
        const fileName = backendApi.basename(c.sourceFile);
        return {
          id: `c_${c.chunkId}_${i}`,
          fileName,
          page: c.pageStart,
          chunkId: String(c.chunkId),
          excerpt: c.quote ?? "",
          documentId: c.documentId,
          sourceFile: c.sourceFile,
          title: c.title,
          pageStart: c.pageStart,
          pageEnd: c.pageEnd,
        };
      });

      const assistantMsg: Message = {
        id: newId(),
        role: "assistant",
        content: resp.answer,
        timestamp: new Date(),
        hasCitations: citations.length > 0,
        citations,
      };

      onUpdateConversation({
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, assistantMsg],
      });
    } catch (e) {
      const assistantMsg: Message = {
        id: newId(),
        role: "assistant",
        content:
          "Không thể gọi backend (/api/chat/ask). Hãy kiểm tra backend đang chạy và Vite proxy đang trỏ đúng cổng.",
        timestamp: new Date(),
        isError: true,
        hasCitations: false,
      };
      onUpdateConversation({
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, assistantMsg],
      });
    } finally {
      setIsLoading(false);
    }
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
      <TopBar title={conversation?.title ?? ""} documentCount={documentCount} />

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
                  onOpenPDF={(citation) => {
                    const resolvedId =
                      citation.documentId ?? documentsByBaseName.get(citation.fileName);
                    setOpenPDFCitation({ ...citation, documentId: resolvedId ?? citation.documentId });
                  }}
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