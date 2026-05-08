import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Sun, Moon, Globe, Bell, BellOff,
  Eye, Type, Palette, Info, ChevronRight, Monitor
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";

function ToggleSwitch({
  enabled,
  onChange,
  color = "#c9a84c",
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative flex-shrink-0 transition-all"
      style={{ width: 36, height: 20 }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all"
        style={{ background: enabled ? color : "var(--t-divider)" }}
      />
      <div
        className="absolute top-0.5 rounded-full transition-all"
        style={{
          width: 16,
          height: 16,
          background: "white",
          left: enabled ? "calc(100% - 18px)" : "2px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme, theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoSaveFlashcards, setAutoSaveFlashcards] = useState(true);
  const [language] = useState("Tiếng Việt");

  const sections = [
    {
      title: "Giao diện",
      icon: Palette,
      items: [
        {
          type: "theme-selector",
        },
        {
          type: "toggle",
          icon: Monitor,
          label: "Chế độ thu gọn",
          description: "Hiển thị nhiều nội dung hơn trên một màn hình",
          value: compactMode,
          onChange: setCompactMode,
        },
        {
          type: "toggle",
          icon: Eye,
          label: "Hiển thị dấu thời gian",
          description: "Hiển thị thời gian của từng tin nhắn",
          value: showTimestamps,
          onChange: setShowTimestamps,
        },
      ],
    },
    {
      title: "Thông báo",
      icon: Bell,
      items: [
        {
          type: "toggle",
          icon: Bell,
          label: "Thông báo ứng dụng",
          description: "Nhận thông báo từ hệ thống",
          value: notifications,
          onChange: setNotifications,
        },
        {
          type: "toggle",
          icon: BellOff,
          label: "Nhắc nhở học bài",
          description: "Nhắc bạn ôn tập flashcard theo lịch",
          value: studyReminders,
          onChange: setStudyReminders,
        },
      ],
    },
    {
      title: "Học tập",
      icon: Type,
      items: [
        {
          type: "toggle",
          icon: Type,
          label: "Tự động lưu Flashcard",
          description: "Lưu flashcard được gợi ý ngay sau khi chatbot phản hồi",
          value: autoSaveFlashcards,
          onChange: setAutoSaveFlashcards,
        },
      ],
    },
    {
      title: "Ngôn ngữ & Khu vực",
      icon: Globe,
      items: [
        {
          type: "info",
          icon: Globe,
          label: "Ngôn ngữ hiển thị",
          value: language,
        },
      ],
    },
    {
      title: "Về ứng dụng",
      icon: Info,
      items: [
        {
          type: "info",
          icon: Info,
          label: "Phiên bản",
          value: "1.0.0 (Beta)",
        },
        {
          type: "link",
          icon: Info,
          label: "Điều khoản sử dụng",
        },
        {
          type: "link",
          icon: Info,
          label: "Chính sách bảo mật",
        },
      ],
    },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b sticky top-0 z-10"
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
        <p className="text-sm" style={{ color: "var(--t-text-2)" }}>
          Cài đặt
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: si * 0.07 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--t-card-border)" }}
          >
            {/* Section header */}
            <div
              className="flex items-center gap-2 px-5 py-3 border-b"
              style={{ background: "var(--t-card-bg)", borderColor: "var(--t-divider)" }}
            >
              <section.icon size={13} style={{ color: "var(--t-gold)" }} />
              <p className="text-xs" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {section.title}
              </p>
            </div>

            {section.items.map((item, ii) => {
              if (item.type === "theme-selector") {
                return (
                  <div
                    key="theme"
                    className="px-5 py-4 border-b"
                    style={{ background: "var(--t-card-bg)", borderColor: "var(--t-divider)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Palette size={14} style={{ color: "var(--t-text-3)" }} />
                      <p className="text-sm" style={{ color: "var(--t-text-2)" }}>Chủ đề giao diện</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "dark", icon: Moon, label: "Tối", desc: "Navy đậm" },
                        { id: "light", icon: Sun, label: "Sáng", desc: "Kem vàng" },
                      ].map(({ id, icon: Icon, label, desc }) => (
                        <button
                          key={id}
                          onClick={() => setTheme(id as "dark" | "light")}
                          className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all"
                          style={{
                            background: theme === id ? "var(--t-gold-bg)" : "var(--t-btn-ghost-bg)",
                            border: `1px solid ${theme === id ? "var(--t-gold-border)" : "var(--t-btn-border)"}`,
                          }}
                        >
                          <Icon size={16} style={{ color: theme === id ? "var(--t-gold)" : "var(--t-text-3)" }} />
                          <div>
                            <p className="text-xs" style={{ color: theme === id ? "var(--t-gold)" : "var(--t-text-2)" }}>
                              {label}
                            </p>
                            <p className="text-xs" style={{ color: "var(--t-text-4)" }}>{desc}</p>
                          </div>
                        </button>
                      ))}

                      {/* Quick toggle */}
                      <button
                        onClick={toggleTheme}
                        className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all col-span-1"
                        style={{
                          background: "var(--t-btn-ghost-bg)",
                          border: "1px solid var(--t-btn-border)",
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Sun size={12} style={{ color: "var(--t-text-3)" }} />
                          <span className="text-xs" style={{ color: "var(--t-text-4)" }}>/</span>
                          <Moon size={12} style={{ color: "var(--t-text-3)" }} />
                        </div>
                        <p className="text-xs" style={{ color: "var(--t-text-3)" }}>Chuyển đổi</p>
                      </button>
                    </div>
                  </div>
                );
              }

              if (item.type === "toggle") {
                const toggleItem = item as {
                  type: string; icon: React.ElementType; label: string;
                  description: string; value: boolean; onChange: (v: boolean) => void
                };
                const Icon = toggleItem.icon;
                return (
                  <div
                    key={toggleItem.label}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{
                      background: "var(--t-card-bg)",
                      borderBottom: ii < section.items.length - 1 ? "1px solid var(--t-divider)" : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--t-gold-bg)" }}
                    >
                      <Icon size={14} style={{ color: "var(--t-gold)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--t-text-1)" }}>{toggleItem.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--t-text-4)" }}>{toggleItem.description}</p>
                    </div>
                    <ToggleSwitch enabled={toggleItem.value} onChange={toggleItem.onChange} />
                  </div>
                );
              }

              if (item.type === "info") {
                const infoItem = item as { type: string; icon: React.ElementType; label: string; value: string };
                const Icon = infoItem.icon;
                return (
                  <div
                    key={infoItem.label}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{
                      background: "var(--t-card-bg)",
                      borderBottom: ii < section.items.length - 1 ? "1px solid var(--t-divider)" : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--t-gold-bg)" }}
                    >
                      <Icon size={14} style={{ color: "var(--t-gold)" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: "var(--t-text-4)" }}>{infoItem.label}</p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--t-text-1)" }}>{infoItem.value}</p>
                    </div>
                  </div>
                );
              }

              if (item.type === "link") {
                const linkItem = item as { type: string; icon: React.ElementType; label: string };
                const Icon = linkItem.icon;
                return (
                  <button
                    key={linkItem.label}
                    className="w-full flex items-center gap-4 px-5 py-3.5 transition-all hover:opacity-80"
                    style={{
                      background: "var(--t-card-bg)",
                      borderBottom: ii < section.items.length - 1 ? "1px solid var(--t-divider)" : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--t-gold-bg)" }}
                    >
                      <Icon size={14} style={{ color: "var(--t-gold)" }} />
                    </div>
                    <p className="flex-1 text-sm text-left" style={{ color: "var(--t-text-2)" }}>
                      {linkItem.label}
                    </p>
                    <ChevronRight size={13} style={{ color: "var(--t-text-4)" }} />
                  </button>
                );
              }

              return null;
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
