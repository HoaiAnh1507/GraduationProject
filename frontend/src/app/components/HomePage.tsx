import { useNavigate } from "react-router";
import { BookOpen, GraduationCap, ArrowRight, Clock, Layers, TrendingUp, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { POPULAR_TOPICS } from "../mockData";

export function HomePage() {
  const navigate = useNavigate();
  const { flashcardDecks, setActiveConversationId, conversations } = useApp();

  const handleStartChat = (question?: string) => {
    navigate("/chat");
    if (question) {
      setActiveConversationId(conversations[0]?.id ?? null);
    }
  };

  const handleGoToLesson = (topicId: string) => {
    navigate(`/lesson/${topicId}`);
  };

  const handleStudyDeck = (deckId: string) => {
    navigate(`/study/${deckId}`);
  };

  const totalCards = flashcardDecks.reduce((acc, d) => acc + d.cards.length, 0);
  const masteredCards = flashcardDecks.reduce((acc, d) => acc + d.cards.filter((c) => c.status === "mastered").length, 0);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg" style={{ color: "var(--t-text-1)" }}>
                Chào mừng trở lại
              </h1>
              <p className="text-xs" style={{ color: "var(--t-text-4)" }}>
                Hệ thống học tập Lịch sử Việt Nam · RAG + Hybrid Search
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: Layers, label: "Bộ thẻ", value: flashcardDecks.length, color: "#a06aff" },
              { icon: GraduationCap, label: "Thẻ đã học", value: `${masteredCards}/${totalCards}`, color: "#50c878" },
              { icon: MessageSquare, label: "Hội thoại", value: conversations.length, color: "#6399ff" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--t-text-1)" }}>{value}</p>
                  <p className="text-xs" style={{ color: "var(--t-text-4)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Popular topics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "var(--t-gold)" }} />
              <h2
                className="text-sm"
                style={{ color: "var(--t-text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Có thể bạn muốn biết
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {POPULAR_TOPICS.map((topic, i) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
                onClick={() => handleGoToLesson(topic.id)}
                className="text-left rounded-xl p-4 transition-all group hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "var(--t-card-bg)",
                  border: "1px solid var(--t-card-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${topic.color}0a`;
                  e.currentTarget.style.borderColor = `${topic.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--t-card-bg)";
                  e.currentTarget.style.borderColor = "var(--t-card-border)";
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm" style={{ color: "var(--t-text-1)" }}>
                        {topic.title}
                      </p>
                      <ArrowRight
                        size={13}
                        className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: topic.color }}
                      />
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--t-text-3)" }}>
                      {topic.description}
                    </p>
                    <span
                      className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${topic.color}18`, color: topic.color, border: `1px solid ${topic.color}30` }}
                    >
                      {topic.period}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Flashcard decks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={14} style={{ color: "#a06aff" }} />
              <h2
                className="text-sm"
                style={{ color: "var(--t-text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Bộ thẻ Flashcard của bạn
              </h2>
            </div>
            <button
              onClick={() => navigate("/flashcards")}
              className="text-xs flex items-center gap-1 transition-all hover:opacity-70"
              style={{ color: "rgba(150,100,255,0.7)" }}
            >
              Xem tất cả
              <ArrowRight size={11} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {flashcardDecks.map((deck, i) => {
              const mastered = deck.cards.filter((c) => c.status === "mastered").length;
              const progress = deck.cards.length > 0 ? (mastered / deck.cards.length) * 100 : 0;

              return (
                <motion.button
                  key={deck.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.22 + i * 0.06 }}
                  onClick={() => handleStudyDeck(deck.id)}
                  className="text-left rounded-xl p-4 transition-all group hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "var(--t-card-bg)",
                    border: `1px solid ${deck.color ?? "#a06aff"}25`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${deck.color ?? "#a06aff"}08`;
                    e.currentTarget.style.borderColor = `${deck.color ?? "#a06aff"}45`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--t-card-bg)";
                    e.currentTarget.style.borderColor = `${deck.color ?? "#a06aff"}25`;
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${deck.color ?? "#a06aff"}18` }}
                  >
                    <GraduationCap size={15} style={{ color: deck.color ?? "#a06aff" }} />
                  </div>
                  <p className="text-sm mb-1" style={{ color: "var(--t-text-1)" }}>
                    {deck.title}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--t-text-3)" }}>
                    {deck.topic}
                  </p>

                  {/* Progress bar */}
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden mb-2"
                    style={{ background: "var(--t-divider)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: deck.color ?? "#a06aff" }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--t-text-4)" }}>
                      {mastered}/{deck.cards.length} đã thuộc
                    </span>
                    {deck.lastStudied && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--t-text-5)" }}>
                        <Clock size={9} />
                        {formatRelative(deck.lastStudied)}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Vừa xong";
  if (h < 24) return `${h}h trước`;
  return `${d}d trước`;
}