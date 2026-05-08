import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Lightbulb, Search, BookOpen, Clock, ArrowRight, Filter, ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { POPULAR_TOPICS, LESSON_CONTENTS } from "../mockData";

const CATEGORIES = ["Tất cả", "Thời kỳ dựng nước", "Thời kỳ Bắc thuộc", "Kháng chiến chống Pháp", "Lịch sử cận đại"];

export function StudyMaterialsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const filtered = LESSON_CONTENTS.filter((lesson) => {
    const matchSearch =
      !search ||
      lesson.title.toLowerCase().includes(search.toLowerCase()) ||
      lesson.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      lesson.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Tất cả" || lesson.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg" style={{ color: "var(--t-text-1)" }}>
                Học liệu
              </h1>
              <p className="text-xs" style={{ color: "var(--t-text-4)" }}>
                Kho tài liệu học tập Lịch sử Việt Nam được tuyển chọn
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Bài học", value: LESSON_CONTENTS.length, color: "#c9a84c" },
              { label: "Thời kỳ lịch sử", value: 4, color: "#6399ff" },
              { label: "Nhân vật lịch sử", value: "20+", color: "#ff6b9d" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3"
                style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
              >
                <p className="text-lg" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--t-text-4)" }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="mb-6"
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3"
            style={{
              background: "var(--t-input-inner-bg)",
              border: "1px solid var(--t-input-border)",
            }}
          >
            <Search size={14} style={{ color: "var(--t-text-4)" }} />
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--t-text-1)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs transition-all hover:opacity-70"
                style={{ color: "var(--t-text-4)" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} style={{ color: "var(--t-text-4)" }} />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: activeCategory === cat ? "var(--t-gold-bg)" : "var(--t-card-bg)",
                  border: `1px solid ${activeCategory === cat ? "var(--t-gold-border)" : "var(--t-card-border)"}`,
                  color: activeCategory === cat ? "var(--t-gold)" : "var(--t-text-3)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* "Có thể bạn muốn biết" section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} style={{ color: "var(--t-gold)" }} />
            <h2
              className="text-sm"
              style={{
                color: "var(--t-text-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Có thể bạn muốn biết
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--t-text-3)" }}>
                Không tìm thấy bài học phù hợp
              </p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("Tất cả"); }}
                className="text-xs mt-2 transition-all hover:opacity-70"
                style={{ color: "var(--t-gold)" }}
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((lesson, i) => (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  className="text-left rounded-xl p-5 transition-all group hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "var(--t-card-bg)",
                    border: "1px solid var(--t-card-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${lesson.color}08`;
                    e.currentTarget.style.borderColor = `${lesson.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--t-card-bg)";
                    e.currentTarget.style.borderColor = "var(--t-card-border)";
                  }}
                >
                  {/* Icon + period */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${lesson.color}15` }}
                    >
                      {lesson.icon}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${lesson.color}15`,
                          color: lesson.color,
                        }}
                      >
                        {lesson.period}
                      </span>
                      <ArrowRight
                        size={13}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: lesson.color }}
                      />
                    </div>
                  </div>

                  <p className="text-sm mb-1" style={{ color: "var(--t-text-1)" }}>
                    {lesson.title}
                  </p>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--t-text-3)" }}>
                    {lesson.subtitle}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--t-card-bg)",
                        border: "1px solid var(--t-card-border)",
                        color: "var(--t-text-4)",
                      }}
                    >
                      {lesson.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--t-text-4)" }}>
                      <Clock size={10} />
                      {lesson.readTime} phút
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick browse by era */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <h2
              className="text-sm"
              style={{
                color: "var(--t-text-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Duyệt theo chủ đề nhanh
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {POPULAR_TOPICS.slice(0, 6).map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/lesson/${topic.id}`)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all hover:opacity-90 group"
                style={{
                  background: `${topic.color}10`,
                  border: `1px solid ${topic.color}22`,
                }}
              >
                <span className="text-base">{topic.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate" style={{ color: "var(--t-text-2)" }}>
                    {topic.title}
                  </p>
                </div>
                <ChevronRight size={11} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: topic.color }} />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
