import { useState } from "react";
import { X, Plus, Trash2, GraduationCap, Save, RotateCcw, ChevronDown, Sparkles } from "lucide-react";
import { Flashcard, Message } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";

interface EditableCard {
  id: string;
  question: string;
  answer: string;
  previewFlipped: boolean;
  source?: "manual" | "suggested" | "conversation_rule";
  sourceConversationId?: number | null;
  sourceMessageId?: number | null;
}

interface FlashcardEditorProps {
  suggestedCards?: Flashcard[];
  conversationMessages?: Message[];
  conversationId?: string | null;
  onClose: () => void;
}

interface ConversationCardSource {
  userQuestion?: string;
  assistantAnswer: string;
  sourceConversationId?: number | null;
  sourceMessageId?: number | null;
}

const DEFAULT_DECK_TOPIC = "Lịch sử Việt Nam";
const HISTORY_KEYWORDS: string[] = [];

const makeDraftId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseNumericId = (id?: string | null): number | null => {
  if (!id) return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const stripMarkdown = (value: string) =>
  value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearchText = (value: string) =>
  stripMarkdown(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const splitSentences = (value: string) =>
  stripMarkdown(value)
    .match(/[^.!?]+[.!?]?/g)
    ?.map((s) => s.trim())
    .filter(Boolean) ?? [];

const shortenAnswer = (value: string, maxLength = 620) => {
  const sentences = splitSentences(value);
  const summary = sentences.slice(0, 3).join(" ");
  const clean = summary || stripMarkdown(value);
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trim()}...` : clean;
};

const findSentenceContaining = (sentences: string[], keyword: string) =>
  sentences.find((sentence) => normalizeSearchText(sentence).includes(normalizeSearchText(keyword)));

const isFailedAssistantMessage = (message: Message) => {
  if (message.isError) return true;
  const content = normalizeSearchText(message.content);
  return (
    content.includes("khong the goi backend") ||
    content.includes("khong the xu ly") ||
    content.includes("da xay ra loi") ||
    content.includes("xin loi he thong gap loi khi xu ly yeu cau")
  );
};

const collectConversationCardSources = (messages: Message[], conversationId?: string | null): ConversationCardSource[] => {
  const sources: ConversationCardSource[] = [];
  let previousUserQuestion: string | undefined;
  const sourceConversationId = parseNumericId(conversationId);

  messages.forEach((message) => {
    if (message.role === "user") {
      previousUserQuestion = message.content;
      return;
    }

    if (message.role !== "assistant" || isFailedAssistantMessage(message) || !message.content.trim()) {
      return;
    }

    sources.push({
      userQuestion: previousUserQuestion,
      assistantAnswer: message.content,
      sourceConversationId,
      sourceMessageId: parseNumericId(message.id),
    });
  });

  return sources;
};

const generateRuleBasedCards = (source?: ConversationCardSource): EditableCard[] => {
  const assistantAnswer = source?.assistantAnswer?.trim();
  if (!assistantAnswer || !source?.userQuestion?.trim()) return [];

  const card: EditableCard = {
    id: makeDraftId("rule"),
    question: stripMarkdown(source.userQuestion),
    answer: shortenAnswer(assistantAnswer),
    previewFlipped: false,
    source: "conversation_rule",
    sourceConversationId: source.sourceConversationId,
    sourceMessageId: source.sourceMessageId,
  };

  return card.question && card.answer ? [card] : [];
};
const generateRuleBasedCardsFromConversation = (messages: Message[], conversationId?: string | null): EditableCard[] => {
  const seenQuestions = new Set<string>();
  return collectConversationCardSources(messages, conversationId).flatMap((source) =>
    generateRuleBasedCards(source).filter((card) => {
      const key = normalizeSearchText(card.question);
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    })
  );
};

export function FlashcardEditor({ suggestedCards = [], conversationMessages = [], conversationId, onClose }: FlashcardEditorProps) {
  const { flashcardDecks, addCardsToDeck, createDeck } = useApp();

  const [cards, setCards] = useState<EditableCard[]>(() =>
    suggestedCards.length > 0
      ? suggestedCards.map((c) => ({
          id: c.id,
          question: c.question,
          answer: c.answer,
          previewFlipped: false,
          source: "suggested",
          sourceConversationId: c.sourceConversationId,
          sourceMessageId: c.sourceMessageId,
        }))
      : [{ id: makeDraftId("new"), question: "", answer: "", previewFlipped: false, source: "manual" }]
  );

  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    flashcardDecks[0]?.id ?? "__new__"
  );
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckTopic, setNewDeckTopic] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const updateCard = (index: number, field: "question" | "answer", value: string) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCard = () => {
    const newCard: EditableCard = {
      id: makeDraftId("new"),
      question: "",
      answer: "",
      previewFlipped: false,
      source: "manual",
    };
    setCards((prev) => [...prev, newCard]);
    setActiveCardIndex(cards.length);
  };

  const generateFromConversation = () => {
    const existingQuestions = new Set(cards.map((card) => normalizeSearchText(card.question)));
    const generatedCards = generateRuleBasedCardsFromConversation(conversationMessages, conversationId).filter(
      (card) => !existingQuestions.has(normalizeSearchText(card.question))
    );
    if (generatedCards.length === 0) return;

    const firstGeneratedIndex = cards.length;
    setCards((prev) => [...prev, ...generatedCards]);
    setActiveCardIndex(firstGeneratedIndex);
  };

  const removeCard = (index: number) => {
    if (cards.length === 1) return;
    setCards((prev) => prev.filter((_, i) => i !== index));
    setActiveCardIndex((prev) => Math.min(prev, cards.length - 2));
  };

  const togglePreview = (index: number) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, previewFlipped: !c.previewFlipped } : c)));
  };

  const handleSave = async () => {
    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) return;
    if (selectedDeckId === "__new__" && !newDeckTitle.trim()) return;

    const flashcardsToSave: Flashcard[] = validCards.map((c) => ({
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      question: c.question,
      answer: c.answer,
      status: "new",
      source: c.source ?? "manual",
      sourceConversationId: c.sourceConversationId,
      sourceMessageId: c.sourceMessageId,
    }));

    setSaving(true);
    try {
    if (selectedDeckId === "__new__") {
      if (!newDeckTitle.trim()) return;
      await createDeck({
        title: newDeckTitle,
        topic: newDeckTopic || DEFAULT_DECK_TOPIC,
        cards: flashcardsToSave,
        color: "#c9a84c",
      });
    } else {
      await addCardsToDeck(selectedDeckId, flashcardsToSave);
    }

    setSaved(true);
    setTimeout(onClose, 1200);
    } finally {
      setSaving(false);
    }
  };

  const validCount = cards.filter((c) => c.question.trim() && c.answer.trim()).length;
  const activeCard = cards[activeCardIndex];
  const canGenerateFromConversation = collectConversationCardSources(conversationMessages, conversationId).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: "min(860px, 95vw)",
          height: "min(640px, 92vh)",
          background: "var(--t-card-bg2)",
          border: "1px solid rgba(150,100,255,0.25)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(150,100,255,0.15)", background: "var(--t-topbar-bg)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(150,100,255,0.15)", border: "1px solid rgba(150,100,255,0.25)" }}
          >
            <GraduationCap size={16} style={{ color: "#a06aff" }} />
          </div>
          <div>
            <h2 className="text-sm" style={{ color: "var(--t-text-1)" }}>
              Tạo Flashcard
            </h2>
            <p className="text-xs" style={{ color: "var(--t-text-3)" }}>
              {suggestedCards.length > 0
                ? `${suggestedCards.length} thẻ được gợi ý – chỉnh sửa trước khi lưu`
                : "Tạo thẻ flashcard mới để ôn tập"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
            style={{ color: "rgba(255,100,100,0.6)", border: "1px solid rgba(255,100,100,0.15)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: card list */}
          <div
            className="w-48 flex-shrink-0 flex flex-col"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="p-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Danh sách thẻ ({cards.length})
              </span>
              <button
                onClick={addCard}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: "rgba(150,100,255,0.2)", color: "#a06aff" }}
                title="Thêm thẻ mới"
              >
                <Plus size={12} />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-2 space-y-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(150,100,255,0.2) transparent" }}
            >
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => setActiveCardIndex(i)}
                  className="group relative rounded-lg p-2.5 cursor-pointer transition-all"
                  style={{
                    background: activeCardIndex === i ? "rgba(150,100,255,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeCardIndex === i ? "rgba(150,100,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {card.question || <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Chưa có câu hỏi</span>}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Thẻ {i + 1}
                  </p>
                  {cards.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCard(i); }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                      style={{ color: "rgba(255,100,100,0.6)" }}
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center: editor */}
          <div className="flex-1 flex flex-col min-w-0 p-5">
            {activeCard && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCardIndex}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-4 flex-1"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(150,100,255,0.1)", color: "#a06aff", border: "1px solid rgba(150,100,255,0.2)" }}
                    >
                      Thẻ {activeCardIndex + 1} / {cards.length}
                    </span>
                  </div>

                  {/* Question */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "rgba(150,100,255,0.8)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Câu hỏi
                    </label>
                    <textarea
                      value={activeCard.question}
                      onChange={(e) => updateCard(activeCardIndex, "question", e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all focus:outline-none"
                      style={{
                        background: "rgba(150,100,255,0.06)",
                        border: "1px solid rgba(150,100,255,0.2)",
                        color: "rgba(255,255,255,0.85)",
                        caretColor: "#a06aff",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(150,100,255,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(150,100,255,0.2)")}
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "rgba(80,200,100,0.8)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Đáp án
                    </label>
                    <textarea
                      value={activeCard.answer}
                      onChange={(e) => updateCard(activeCardIndex, "answer", e.target.value)}
                      placeholder="Nhập đáp án..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all focus:outline-none"
                      style={{
                        background: "rgba(80,200,100,0.05)",
                        border: "1px solid rgba(80,200,100,0.2)",
                        color: "rgba(255,255,255,0.85)",
                        caretColor: "#50c878",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(80,200,100,0.45)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(80,200,100,0.2)")}
                    />
                  </div>

                  {/* Mini preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Xem trước:</span>
                      <button
                        onClick={() => togglePreview(activeCardIndex)}
                        className="flex items-center gap-1 text-xs transition-all hover:opacity-70"
                        style={{ color: "rgba(150,100,255,0.6)" }}
                      >
                        <RotateCcw size={10} />
                        {activeCard.previewFlipped ? "Mặt sau" : "Mặt trước"}
                      </button>
                    </div>
                    <div
                      className="relative rounded-xl flex items-center justify-center"
                      style={{
                        height: "80px",
                        background: activeCard.previewFlipped
                          ? "linear-gradient(135deg, rgba(30,100,60,0.2), rgba(20,70,40,0.25))"
                          : "linear-gradient(135deg, rgba(100,60,180,0.15), rgba(60,40,120,0.2))",
                        border: `1px solid ${activeCard.previewFlipped ? "rgba(80,200,100,0.2)" : "rgba(150,100,255,0.2)"}`,
                        cursor: "pointer",
                      }}
                      onClick={() => togglePreview(activeCardIndex)}
                    >
                      <p className="text-xs text-center px-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {activeCard.previewFlipped
                          ? (activeCard.answer || "Đáp án chưa nhập")
                          : (activeCard.question || "Câu hỏi chưa nhập")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Right: save options */}
          <div
            className="w-52 flex-shrink-0 flex flex-col p-4 gap-4"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={generateFromConversation}
              disabled={!canGenerateFromConversation}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(201,168,76,0.1)",
                color: "var(--t-gold)",
                border: "1px solid rgba(201,168,76,0.28)",
              }}
              title="Sinh thêm thẻ nháp bằng rule từ câu hỏi và câu trả lời hiện tại"
            >
              <Sparkles size={13} />
              Sinh thẻ từ hội thoại
            </button>

            <div>
              <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Lưu vào bộ thẻ
              </label>

              {/* Deck selector */}
              <div className="relative">
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full appearance-none rounded-xl px-3 py-2.5 pr-8 text-xs focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {flashcardDecks.map((deck) => (
                    <option key={deck.id} value={deck.id} style={{ background: "#0d1b2e" }}>
                      {deck.title}
                    </option>
                  ))}
                  <option value="__new__" style={{ background: "#0d1b2e" }}>
                    + Tạo bộ thẻ mới
                  </option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </div>

              {/* New deck fields */}
              <AnimatePresence>
                {selectedDeckId === "__new__" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        placeholder="Tên bộ thẻ..."
                        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                        style={{
                          background: "rgba(201,168,76,0.06)",
                          border: "1px solid rgba(201,168,76,0.2)",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      />
                      <input
                        type="text"
                        value={newDeckTopic}
                        onChange={(e) => setNewDeckTopic(e.target.value)}
                        placeholder="Chủ đề (VD: Lịch sử cận đại)"
                        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                        style={{
                          background: "rgba(201,168,76,0.06)",
                          border: "1px solid rgba(201,168,76,0.2)",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Tóm tắt:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Tổng thẻ:</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{cards.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hợp lệ:</span>
                  <span className="text-xs" style={{ color: validCount > 0 ? "#50c878" : "rgba(255,100,100,0.7)" }}>{validCount}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {saved ? (
                <div
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(80,200,100,0.15)", color: "#50c878", border: "1px solid rgba(80,200,100,0.3)" }}
                >
                  ✓ Đã lưu thành công!
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || validCount === 0 || (selectedDeckId === "__new__" && !newDeckTitle.trim())}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #a06aff, #7040cc)",
                    color: "white",
                  }}
                >
                  <Save size={14} />
                  Lưu {validCount} thẻ
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
