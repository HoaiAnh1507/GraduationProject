import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight,
  GraduationCap, Layers, Trophy, SkipForward
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { Flashcard } from "../types";
import { MiniChatbot } from "./MiniChatbot";

type StudyStatus = "new" | "learning" | "mastered" | "skipped";

interface StudyCard extends Flashcard {
  studyStatus: StudyStatus;
}

function FlipCard({ card, flipped, onFlip }: { card: StudyCard; flipped: boolean; onFlip: () => void }) {
  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: "100%", maxWidth: "520px", height: "300px", perspective: "1200px" }}
      onClick={onFlip}
    >
      <motion.div
        className="w-full h-full relative"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, rgba(100,60,180,0.18), rgba(60,40,120,0.22))",
            border: "1px solid rgba(150,100,255,0.3)",
          }}
        >
          <span
            className="text-xs mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(150,100,255,0.12)", color: "rgba(150,100,255,0.8)", letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Câu hỏi
          </span>
          <p className="text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>
            {card.question}
          </p>
          <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
            Nhấn để xem đáp án
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg, rgba(30,100,60,0.2), rgba(20,70,40,0.25))",
            border: "1px solid rgba(80,200,100,0.3)",
          }}
        >
          <CheckCircle size={20} className="mb-4" style={{ color: "rgba(80,200,100,0.7)" }} />
          <span
            className="text-xs mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(80,200,100,0.1)", color: "rgba(80,200,100,0.8)", letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Đáp án
          </span>
          <p className="text-center leading-relaxed text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
            {card.answer}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { flashcardDecks, setFlashcardDecks } = useApp();

  const deck = flashcardDecks.find((d) => d.id === deckId);

  const [cards, setCards] = useState<StudyCard[]>(() =>
    (deck?.cards ?? []).map((c) => ({ ...c, studyStatus: c.status ?? "new" }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (!deck) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--t-text-3)" }}>
        <div className="text-center">
          <GraduationCap size={40} className="mx-auto mb-4" style={{ color: "rgba(150,100,255,0.3)" }} />
          <p>Không tìm thấy bộ thẻ</p>
          <button onClick={() => navigate("/flashcards")} className="mt-4 text-xs" style={{ color: "#a06aff" }}>
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const masteredCount = cards.filter((c) => c.studyStatus === "mastered").length;
  const learningCount = cards.filter((c) => c.studyStatus === "learning").length;
  const progress = cards.length > 0 ? (masteredCount / cards.length) * 100 : 0;

  const navigateTo = (newIndex: number) => {
    setDirection(newIndex > currentIndex ? 1 : -1);
    setFlipped(false);
    setTimeout(() => setCurrentIndex(newIndex), 50);
  };

  const handleRate = (status: "mastered" | "learning" | "skipped") => {
    const updated = cards.map((c, i) => i === currentIndex ? { ...c, studyStatus: status } : c);
    setCards(updated);

    // Also update the deck in context
    setFlashcardDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              lastStudied: new Date(),
              cards: d.cards.map((c, i) =>
                i === currentIndex ? { ...c, status: status === "skipped" ? "learning" : status } : c
              ),
            }
          : d
      )
    );

    if (currentIndex < cards.length - 1) {
      navigateTo(currentIndex + 1);
    } else {
      setSessionDone(true);
    }
  };

  const handleRestart = () => {
    setCards((prev) => prev.map((c) => ({ ...c, studyStatus: "new" as StudyStatus })));
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
  };

  if (sessionDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--t-gold-bg)", border: "1px solid var(--t-gold-border)" }}
          >
            <Trophy size={28} style={{ color: "var(--t-gold)" }} />
          </div>
          <h2 className="text-base mb-2" style={{ color: "var(--t-text-1)" }}>
            Hoàn thành phiên học!
          </h2>
          <p className="text-xs mb-6" style={{ color: "var(--t-text-3)" }}>
            Bạn đã xem qua tất cả {cards.length} thẻ trong bộ "{deck.title}"
          </p>

          {/* Results */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Đã thuộc", count: masteredCount, color: "#50c878" },
              { label: "Đang học", count: learningCount, color: "#f5c842" },
              { label: "Bỏ qua", count: cards.filter((c) => c.studyStatus === "skipped").length, color: "var(--t-text-4)" },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="rounded-xl py-3 px-2 text-center"
                style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
              >
                <p className="text-lg" style={{ color }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-3)" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: "var(--t-btn-ghost-bg)", color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
            >
              <RotateCcw size={14} />
              Học lại
            </button>
            <button
              onClick={() => navigate("/flashcards")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #a06aff, #7040cc)", color: "white" }}
            >
              <Layers size={14} />
              Về bộ thẻ
            </button>
          </div>
        </motion.div>
        <MiniChatbot contextTopic={deck.title} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--t-topbar-border)" }}
      >
        <button
          onClick={() => navigate("/flashcards")}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm" style={{ color: "var(--t-text-1)" }}>{deck.title}</h2>
          <p className="text-xs" style={{ color: "var(--t-text-3)" }}>{deck.topic}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--t-text-3)" }}>
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="flex items-center gap-2">
            {[
              { label: "Thuộc", count: masteredCount, color: "#50c878" },
              { label: "Học", count: learningCount, color: "#f5c842" },
            ].map(({ label, count, color }) => (
              <span key={label} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ color: "var(--t-text-3)" }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "var(--t-divider)" }}>
        <motion.div
          className="h-full"
          style={{ background: deck.color ?? "#a06aff" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Main study area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-6 w-full max-w-xl"
          >
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {currentCard.studyStatus === "mastered" && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(80,200,100,0.12)", color: "#50c878", border: "1px solid rgba(80,200,100,0.2)" }}>
                  ✓ Đã thuộc
                </span>
              )}
              {currentCard.studyStatus === "learning" && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(245,200,66,0.1)", color: "#f5c842", border: "1px solid rgba(245,200,66,0.2)" }}>
                  Đang học
                </span>
              )}
            </div>

            <FlipCard card={currentCard} flipped={flipped} onFlip={() => setFlipped(!flipped)} />

            {/* Flip hint */}
            {!flipped && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                Nhấn vào thẻ để lật xem đáp án
              </p>
            )}

            {/* Action buttons (visible after flip) */}
            <AnimatePresence>
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-center gap-3 w-full max-w-md"
                >
                  <button
                    onClick={() => handleRate("learning")}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.25)", color: "#ff8080" }}
                  >
                    <XCircle size={18} />
                    <span className="text-xs">Chưa thuộc</span>
                  </button>
                  <button
                    onClick={() => handleRate("skipped")}
                    className="w-12 h-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}
                  >
                    <SkipForward size={15} />
                    <span style={{ fontSize: "9px" }}>Bỏ qua</span>
                  </button>
                  <button
                    onClick={() => handleRate("mastered")}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: "rgba(80,200,100,0.1)", border: "1px solid rgba(80,200,100,0.25)", color: "#50c878" }}
                  >
                    <CheckCircle size={18} />
                    <span className="text-xs">Đã thuộc</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--t-topbar-border)" }}
      >
        <button
          onClick={() => currentIndex > 0 && navigateTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
        >
          <ChevronLeft size={14} />
          Thẻ trước
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 overflow-hidden max-w-32">
          {cards.slice(Math.max(0, currentIndex - 4), currentIndex + 5).map((card, relI) => {
            const absI = Math.max(0, currentIndex - 4) + relI;
            const isCurrent = absI === currentIndex;
            return (
              <button
                key={card.id}
                onClick={() => navigateTo(absI)}
                className="rounded-full transition-all flex-shrink-0"
                style={{
                  width: isCurrent ? "20px" : "7px",
                  height: "7px",
                  background: isCurrent
                    ? (deck.color ?? "#a06aff")
                    : card.studyStatus === "mastered"
                    ? "#50c878"
                    : card.studyStatus === "learning"
                    ? "#f5c842"
                    : "var(--t-divider)",
                }}
              />
            );
          })}
        </div>

        <button
          onClick={() => currentIndex < cards.length - 1 && navigateTo(currentIndex + 1)}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
        >
          Thẻ tiếp
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Mini chatbot */}
      <MiniChatbot contextTopic={deck.title} />
    </div>
  );
}