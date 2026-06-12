import { useEffect, useRef, useState } from "react";
import { Database, Info, LogIn, Search, Settings, UserPlus, Zap } from "lucide-react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Message, Conversation, Citation } from "../types";
import { backendApi } from "../api/backendApi";
import { MessageBubble } from "./MessageBubble";
import { MessageLoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ChatInput } from "./ChatInput";
import { PDFViewerModal } from "./PDFViewerModal";
import { useAuth } from "../context/AuthContext";

interface ChatPageProps {
  conversation: Conversation | null;
  onUpdateConversation: (conv: Conversation) => void;
  onCreateConversation: (title?: string) => Promise<string>;
}

let msgIdCounter = 1000;
const newId = () => `msg_${++msgIdCounter}`;

function TopBar({ title, documentCount }: { title: string; documentCount?: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();

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
            {title || "Hoi thoai moi"}
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
        {!user && (
          <>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
            >
              <LogIn size={13} />
              <span>Đăng nhập</span>
            </button>
            <button
              onClick={() => navigate("/login?mode=register")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all hover:opacity-80"
              style={{ background: "var(--t-btn-ghost-bg)", color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
            >
              <UserPlus size={13} />
              <span>Đăng ký</span>
            </button>
          </>
        )}

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(99,153,255,0.08)", border: "1px solid rgba(99,153,255,0.15)" }}
        >
          <Database size={11} style={{ color: "#6399ff" }} />
          <span className="text-xs" style={{ color: "rgba(99,153,255,0.8)" }}>
            {documentCount ?? 0} tai lieu
          </span>
        </div>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
          title="Thong tin he thong"
        >
          <Info size={14} />
        </button>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
          title="Cai dat"
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        if (!cancelled) setDocumentCount(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async (text: string) => {
    const fallbackTitle = text.slice(0, 40) + (text.length > 40 ? "..." : "");
    let currentConversation = conversation;

    if (!currentConversation) {
      const id = await onCreateConversation(fallbackTitle);
      currentConversation = {
        id,
        title: fallbackTitle,
        lastMessage: "",
        timestamp: new Date(),
        messages: [],
      };
    }

    const userMsg: Message = {
      id: newId(),
      role: "user",
      content: text,
      timestamp: new Date(),
      hasCitations: false,
    };

    const updatedWithUser: Conversation = {
      ...currentConversation,
      title: currentConversation.messages.length === 0 ? fallbackTitle : currentConversation.title,
      lastMessage: text,
      timestamp: new Date(),
      messages: [...currentConversation.messages, userMsg],
    };

    onUpdateConversation(updatedWithUser);
    setIsLoading(true);

    try {
      const numericConversationId = Number(currentConversation.id);
      const conversationId = Number.isNaN(numericConversationId) ? null : numericConversationId;
      const history = updatedWithUser.messages.map((m) => ({ role: m.role, content: m.content }));
      const resp = await backendApi.askChat(text, conversationId, undefined, history);

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
          pageSpans: c.pageSpans ?? [],
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
        content: "Khong the goi backend (/api/chat/ask). Hay kiem tra backend dang chay va Vite proxy dung cong.",
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
    handleSend(`Hay cho toi biet them ve: ${topic}`);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title={conversation?.title ?? ""} documentCount={documentCount} />

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
              <EmptyState onSelectQuestion={handleSend} />
            </motion.div>
          ) : (
            <motion.div key="messages" className="py-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  conversationMessages={messages}
                  conversationId={conversation?.id ?? null}
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
        placeholder={isLoading ? "Dang xu ly cau hoi..." : "Dat cau hoi ve lich su Viet Nam..."}
      />

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
