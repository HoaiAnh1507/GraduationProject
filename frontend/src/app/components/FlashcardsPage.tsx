import { useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Plus, Play, Trash2, Clock, Layers, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { FlashcardDeck } from "../types";

function DeckCard({ deck, onStudy, onDelete }: { deck: FlashcardDeck; onStudy: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const mastered = deck.cards.filter((c) => c.status === "mastered").length;
  const learning = deck.cards.filter((c) => c.status === "learning").length;
  const newCards = deck.cards.filter((c) => !c.status || c.status === "new").length;
  const progress = deck.cards.length > 0 ? (mastered / deck.cards.length) * 100 : 0;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--t-card-bg2)",
        border: `1px solid ${deck.color ?? "#a06aff"}28`,
      }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${deck.color ?? "#a06aff"}18` }}
          >
            <GraduationCap size={18} style={{ color: deck.color ?? "#a06aff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: "var(--t-text-1)" }}>
              {deck.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-text-3)" }}>
              {deck.topic}
            </p>
            {deck.description && (
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--t-text-3)" }}>
                {deck.description}
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10 flex-shrink-0"
            style={{ color: "rgba(255,100,100,0.4)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: "var(--t-text-3)" }}>
              Tiến độ học
            </span>
            <span className="text-xs" style={{ color: deck.color ?? "#a06aff" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--t-divider)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: deck.color ?? "#a06aff" }}
            />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="flex items-center gap-3 mt-3">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: "#50c878" }} />
            <span style={{ color: "var(--t-text-3)" }}>{mastered} thuộc</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: "#f5c842" }} />
            <span style={{ color: "var(--t-text-3)" }}>{learning} đang học</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--t-divider)" }} />
            <span style={{ color: "var(--t-text-3)" }}>{newCards} mới</span>
          </span>
          {deck.lastStudied && (
            <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: "var(--t-text-5)" }}>
              <Clock size={10} />
              {formatRelative(deck.lastStudied)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderTop: "1px solid var(--t-divider)" }}
      >
        <button
          onClick={onStudy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${deck.color ?? "#a06aff"}cc, ${deck.color ?? "#a06aff"}88)`,
            color: "white",
          }}
        >
          <Play size={14} />
          Học ngay ({deck.cards.length} thẻ)
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{
            border: "1px solid var(--t-btn-border)",
            color: "var(--t-text-3)",
          }}
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.div>
        </button>
      </div>

      {/* Card list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-4 space-y-2 max-h-64 overflow-y-auto"
              style={{
                borderTop: "1px solid var(--t-divider)",
                scrollbarWidth: "thin",
                scrollbarColor: "var(--t-card-border) transparent",
              }}
            >
              <p
                className="text-xs pt-3 pb-1"
                style={{ color: "var(--t-text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                {deck.cards.length} thẻ trong bộ
              </p>
              {deck.cards.map((card, i) => (
                <div
                  key={card.id}
                  className="rounded-lg p-3"
                  style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--t-text-4)" }}>
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: "var(--t-text-2)" }}>{card.question}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--t-text-3)" }}>{card.answer}</p>
                    </div>
                    <span
                      className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: card.status === "mastered"
                          ? "rgba(80,200,100,0.12)"
                          : card.status === "learning"
                          ? "rgba(245,200,66,0.12)"
                          : "var(--t-card-bg)",
                        color: card.status === "mastered"
                          ? "#50c878"
                          : card.status === "learning"
                          ? "#f5c842"
                          : "var(--t-text-4)",
                      }}
                    >
                      {card.status === "mastered" ? "Thuộc" : card.status === "learning" ? "Đang học" : "Mới"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FlashcardsPage() {
  const navigate = useNavigate();
  const { flashcardDecks, setFlashcardDecks } = useApp();

  const handleDelete = (deckId: string) => {
    setFlashcardDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const totalCards = flashcardDecks.reduce((acc, d) => acc + d.cards.length, 0);
  const masteredCards = flashcardDecks.reduce((acc, d) => acc + d.cards.filter((c) => c.status === "mastered").length, 0);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-base" style={{ color: "var(--t-text-1)" }}>
              Bộ thẻ Flashcard
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--t-text-3)" }}>
              {flashcardDecks.length} bộ · {totalCards} thẻ · {masteredCards} đã thuộc
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Overall progress */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(150,100,255,0.08)", border: "1px solid rgba(150,100,255,0.15)" }}
            >
              <Layers size={13} style={{ color: "#a06aff" }} />
              <span className="text-xs" style={{ color: "rgba(150,100,255,0.8)" }}>
                {totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0}% hoàn thành
              </span>
            </div>

            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #a06aff, #7040cc)", color: "white" }}
            >
              <Plus size={13} />
              Bộ thẻ mới
            </button>
          </div>
        </motion.div>

        {/* Deck grid */}
        {flashcardDecks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <GraduationCap size={40} className="mx-auto mb-4" style={{ color: "rgba(150,100,255,0.3)" }} />
            <p className="text-sm mb-2" style={{ color: "var(--t-text-3)" }}>
              Chưa có bộ thẻ nào
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--t-text-4)" }}>
              Tạo flashcard từ các cuộc hội thoại để bắt đầu học
            </p>
            <button
              onClick={() => navigate("/chat")}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90"
              style={{
                background: "rgba(150,100,255,0.15)",
                color: "#a06aff",
                border: "1px solid rgba(150,100,255,0.25)",
              }}
            >
              Bắt đầu trò chuyện
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {flashcardDecks.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <DeckCard
                  deck={deck}
                  onStudy={() => navigate(`/study/${deck.id}`)}
                  onDelete={() => handleDelete(deck.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
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
