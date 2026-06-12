import { User, Bot, RefreshCw, AlertCircle } from "lucide-react";
import { Message, Citation } from "../types";
import { Citations } from "./Citations";
import { FeedbackButtons } from "./FeedbackButtons";
import { RelatedTopics } from "./RelatedTopics";
import { FlashcardsCreateButton } from "./Flashcards";
import { motion } from "motion/react";

interface MessageBubbleProps {
  message: Message;
  conversationMessages?: Message[];
  conversationId?: string | null;
  onFeedback: (id: string, type: "helpful" | "not_helpful") => void;
  onRetry?: (id: string) => void;
  onExploreRelated?: (topic: string) => void;
  onOpenPDF?: (citation: Citation) => void;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^\*\*.*\*\*$/)) {
      const content = line.replace(/\*\*/g, "");
      result.push(
        <p key={key++} className="mt-3 mb-1" style={{ color: "var(--t-gold-text)", fontWeight: 600 }}>
          {content}
        </p>
      );
    } else if (line.includes("**")) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      result.push(
        <p key={key++} className="leading-relaxed" style={{ color: "var(--t-text-2)" }}>
          {parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pi} style={{ color: "var(--t-gold-text)", fontWeight: 600 }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    } else if (line.trim() === "") {
      result.push(<div key={key++} className="h-2" />);
    } else if (line.startsWith("*") && !line.startsWith("**")) {
      result.push(
        <p
          key={key++}
          className="leading-relaxed pl-3 border-l-2"
          style={{
            color: "var(--t-text-2)",
            borderColor: "var(--t-gold-border)",
            fontStyle: "italic",
          }}
        >
          {line.slice(1).trim()}
        </p>
      );
    } else {
      result.push(
        <p key={key++} className="leading-relaxed" style={{ color: "var(--t-text-2)" }}>
          {line}
        </p>
      );
    }
  }

  return result;
}

export function MessageBubble({ message, conversationMessages = [], conversationId, onFeedback, onRetry, onExploreRelated, onOpenPDF }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 px-6 py-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant avatar */}
      {isAssistant && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
          style={{
            background: "var(--t-bot-bg)",
            border: "1px solid var(--t-gold-border)",
          }}
        >
          <Bot size={15} style={{ color: "var(--t-gold)" }} />
        </div>
      )}

      {/* Content */}
      <div className={`flex flex-col ${isUser ? "items-end max-w-lg" : "flex-1 max-w-3xl"}`}>
        {/* Role label */}
        <span className="text-xs mb-1.5" style={{ color: "var(--t-text-4)" }}>
          {isUser ? "Bạn" : "Trợ lý AI · RAG"}
        </span>

        {/* Message content */}
        {isUser ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
            style={{
              background: "var(--t-user-msg-bg)",
              border: "1px solid var(--t-gold-border)",
              color: "var(--t-text-1)",
            }}
          >
            {message.content}
          </div>
        ) : message.isError ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm"
            style={{
              background: "rgba(255,59,48,0.08)",
              border: "1px solid rgba(255,59,48,0.25)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#ff6b6b" }} />
              <div>
                <p className="text-sm" style={{ color: "rgba(255,150,150,0.9)" }}>
                  {message.content}
                </p>
                {onRetry && (
                  <button
                    onClick={() => onRetry(message.id)}
                    className="flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(255,59,48,0.15)", color: "#ff9999", border: "1px solid rgba(255,59,48,0.2)" }}
                  >
                    <RefreshCw size={11} />
                    Thử lại
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div
              className="px-4 py-4 rounded-2xl rounded-tl-sm text-sm"
              style={{
                background: "var(--t-msg-bot-bg)",
                border: "1px solid var(--t-card-border)",
              }}
            >
              <div className="space-y-0.5">{parseMarkdown(message.content)}</div>
            </div>

            {/* Citations */}
            {isAssistant && (
              <Citations
                citations={message.hasCitations ? (message.citations ?? []) : []}
                onOpenPDF={onOpenPDF}
              />
            )}

            {/* Related Topics */}
            {isAssistant && message.relatedTopics && message.relatedTopics.length > 0 && (
              <RelatedTopics topics={message.relatedTopics} onExplore={onExploreRelated} />
            )}

            {/* Create Flashcard button */}
            {isAssistant && !message.isError && (
              <div className="mt-3">
                <FlashcardsCreateButton
                  suggestedCards={message.suggestedFlashcards}
                  conversationMessages={conversationMessages}
                  conversationId={conversationId}
                />
              </div>
            )}

            {/* Feedback */}
            {isAssistant && !message.isError && (
              <FeedbackButtons
                feedback={message.feedback}
                onFeedback={(type) => onFeedback(message.id, type)}
              />
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
          style={{
            background: "var(--t-gold-bright)",
            border: "1px solid var(--t-gold-border)",
          }}
        >
          <User size={15} style={{ color: "var(--t-gold)" }} />
        </div>
      )}
    </motion.div>
  );
}
