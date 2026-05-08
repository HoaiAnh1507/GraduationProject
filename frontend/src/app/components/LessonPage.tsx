import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Clock, BookOpen, Users, Calendar, Star,
  ChevronRight, MessageSquare, Send, Loader2, Lightbulb, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LESSON_CONTENTS, POPULAR_TOPICS } from "../mockData";
import { useApp, newConvId } from "../context/AppContext";
import { Conversation } from "../types";

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

export function LessonPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { setConversations, setActiveConversationId } = useApp();

  const lesson = LESSON_CONTENTS.find((l) => l.id === topicId);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  if (!lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "var(--t-text-3)" }}>
        <BookOpen size={40} className="mb-4 opacity-40" />
        <p>Không tìm thấy bài học</p>
        <button
          onClick={() => navigate("/study-materials")}
          className="mt-4 text-sm"
          style={{ color: "var(--t-gold)" }}
        >
          ← Quay lại Học liệu
        </button>
      </div>
    );
  }

  const relatedTopics = POPULAR_TOPICS.filter((t) => lesson.relatedTopicIds.includes(t.id));

  const handleAskQuestion = async (q?: string) => {
    const question = q ?? chatInput.trim();
    if (!question) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setIsChatLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const mockAnswer = `Đây là câu trả lời liên quan đến "${lesson.title}": Hệ thống RAG đã tìm thấy thông tin phù hợp trong tài liệu lịch sử. ${
      lesson.significance.slice(0, 150)
    }... Để tìm hiểu chi tiết hơn, bạn có thể mở cuộc hội thoại mới với chatbot.`;
    setChatMessages((prev) => [...prev, { role: "bot", text: mockAnswer }]);
    setIsChatLoading(false);
  };

  const handleOpenFullChat = () => {
    const newConv: Conversation = {
      id: newConvId(),
      title: lesson.title,
      lastMessage: "",
      timestamp: new Date(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    navigate("/chat");
  };

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "content", label: "Nội dung" },
    { id: "timeline", label: "Niên đại" },
    { id: "figures", label: "Nhân vật" },
  ];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "var(--t-app-bg)" }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
        style={{
          background: "var(--t-topbar-bg)",
          borderColor: "var(--t-topbar-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition-all hover:opacity-70"
          style={{ color: "var(--t-text-3)" }}
        >
          <ArrowLeft size={15} />
          Quay lại
        </button>
        <div className="h-4 w-px" style={{ background: "var(--t-divider)" }} />
        <div className="flex items-center gap-2">
          <span className="text-lg">{lesson.icon}</span>
          <span className="text-sm truncate" style={{ color: "var(--t-text-2)" }}>
            {lesson.title}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: `${lesson.color}18`,
              color: lesson.color,
              border: `1px solid ${lesson.color}30`,
            }}
          >
            {lesson.category}
          </span>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--t-text-4)" }}>
            <Clock size={11} />
            {lesson.readTime} phút đọc
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: lesson content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
        >
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${lesson.color}18`, border: `1px solid ${lesson.color}30` }}
                >
                  {lesson.icon}
                </div>
                <div>
                  <h1 className="text-2xl mb-1" style={{ color: "var(--t-text-1)" }}>
                    {lesson.title}
                  </h1>
                  <p className="text-sm mb-2" style={{ color: "var(--t-text-3)" }}>
                    {lesson.subtitle}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${lesson.color}15`,
                        color: lesson.color,
                        border: `1px solid ${lesson.color}28`,
                      }}
                    >
                      <Calendar size={10} />
                      {lesson.period}
                    </span>
                    <span className="text-xs" style={{ color: "var(--t-text-4)" }}>
                      {lesson.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: activeSection === tab.id ? `${lesson.color}18` : "transparent",
                      color: activeSection === tab.id ? lesson.color : "var(--t-text-3)",
                      border: activeSection === tab.id ? `1px solid ${lesson.color}28` : "1px solid transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* ─ Overview ─ */}
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    <div
                      className="rounded-xl p-5"
                      style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={14} style={{ color: lesson.color }} />
                        <p className="text-xs" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Tổng quan
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-2)" }}>
                        {lesson.overview}
                      </p>
                    </div>

                    {/* Significance */}
                    <div
                      className="rounded-xl p-5"
                      style={{
                        background: `${lesson.color}08`,
                        border: `1px solid ${lesson.color}25`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={14} style={{ color: lesson.color }} />
                        <p className="text-xs" style={{ color: lesson.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Ý nghĩa lịch sử
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-2)" }}>
                        {lesson.significance}
                      </p>
                    </div>

                    {/* Suggested questions */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={14} style={{ color: "var(--t-gold)" }} />
                        <p className="text-xs" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Câu hỏi gợi ý
                        </p>
                      </div>
                      <div className="space-y-2">
                        {lesson.suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleAskQuestion(q)}
                            className="w-full text-left text-sm px-4 py-3 rounded-xl transition-all hover:opacity-90 group"
                            style={{
                              background: "var(--t-card-bg)",
                              border: "1px solid var(--t-card-border)",
                              color: "var(--t-text-2)",
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <MessageSquare size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--t-gold)" }} />
                              {q}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ Content ─ */}
                {activeSection === "content" && (
                  <div className="space-y-5">
                    {lesson.sections.map((sec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-xl p-5"
                        style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                      >
                        <h3
                          className="text-sm mb-3 pb-2 border-b"
                          style={{ color: lesson.color, borderColor: `${lesson.color}20` }}
                        >
                          {sec.heading}
                        </h3>
                        <div
                          className="text-sm leading-relaxed"
                          style={{ color: "var(--t-text-2)" }}
                          dangerouslySetInnerHTML={{
                            __html: `<p>${parseMarkdown(sec.body)}</p>`,
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ─ Timeline ─ */}
                {activeSection === "timeline" && (
                  <div className="space-y-0">
                    {lesson.timeline.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-4"
                      >
                        {/* Line + dot */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ background: lesson.color, boxShadow: `0 0 0 3px ${lesson.color}20` }}
                          />
                          {i < lesson.timeline.length - 1 && (
                            <div
                              className="w-px flex-1 my-1"
                              style={{ background: `${lesson.color}25`, minHeight: "24px" }}
                            />
                          )}
                        </div>

                        <div className="pb-5 flex-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full inline-block mb-1"
                            style={{ background: `${lesson.color}15`, color: lesson.color }}
                          >
                            {item.year}
                          </span>
                          <p className="text-sm" style={{ color: "var(--t-text-2)" }}>
                            {item.event}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ─ Key Figures ─ */}
                {activeSection === "figures" && (
                  <div className="grid grid-cols-1 gap-3">
                    {lesson.keyFigures.map((fig, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 rounded-xl p-4"
                        style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: `${lesson.color}15`, color: lesson.color }}
                        >
                          <Users size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: "var(--t-text-1)" }}>
                            {fig.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--t-text-3)" }}>
                            {fig.role}
                          </p>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--t-text-4)" }}>
                          {fig.years}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Related topics */}
            {relatedTopics.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={13} style={{ color: "var(--t-gold)" }} />
                  <p className="text-xs" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Chủ đề liên quan
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {relatedTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => navigate(`/lesson/${topic.id}`)}
                      className="text-left rounded-xl p-4 transition-all hover:scale-[1.01] group"
                      style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${topic.color}08`;
                        e.currentTarget.style.borderColor = `${topic.color}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--t-card-bg)";
                        e.currentTarget.style.borderColor = "var(--t-card-border)";
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{topic.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm" style={{ color: "var(--t-text-1)" }}>
                              {topic.title}
                            </p>
                            <ChevronRight
                              size={13}
                              className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: topic.color }}
                            />
                          </div>
                          <span
                            className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${topic.color}15`, color: topic.color }}
                          >
                            {topic.period}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: mini chatbot */}
        <div
          className="w-80 flex-shrink-0 flex flex-col border-l"
          style={{ borderColor: "var(--t-sidebar-border)" }}
        >
          {/* Chat header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
            style={{ borderColor: "var(--t-divider)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `${lesson.color}18` }}
              >
                <MessageSquare size={12} style={{ color: lesson.color }} />
              </div>
              <p className="text-xs" style={{ color: "var(--t-text-2)" }}>
                Hỏi về bài học
              </p>
            </div>
            <button
              onClick={handleOpenFullChat}
              className="text-xs transition-all hover:opacity-70"
              style={{ color: "var(--t-gold)" }}
            >
              Mở chatbot →
            </button>
          </div>

          {/* Chat messages */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-3"
            style={{ scrollbarWidth: "thin" }}
          >
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                  style={{ background: `${lesson.color}15` }}
                >
                  {lesson.icon}
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--t-text-3)" }}>
                  Hỏi về {lesson.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--t-text-4)" }}>
                  Chọn câu hỏi gợi ý hoặc nhập câu hỏi của bạn bên dưới
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "var(--t-user-msg-bg)", color: "var(--t-text-1)" }
                      : { background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)", color: "var(--t-text-2)" }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                >
                  <Loader2 size={12} className="animate-spin" style={{ color: "var(--t-gold)" }} />
                  <span className="text-xs" style={{ color: "var(--t-text-3)" }}>Đang tìm kiếm...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div
            className="p-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--t-divider)" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--t-input-inner-bg)", border: "1px solid var(--t-input-border)" }}
            >
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-xs outline-none"
                style={{ color: "var(--t-text-1)" }}
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={!chatInput.trim() || isChatLoading}
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: `${lesson.color}20`, color: lesson.color }}
              >
                <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
