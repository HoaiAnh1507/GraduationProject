import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Plus, MessageSquare, Clock, ChevronLeft, ChevronRight,
  BookOpen, Home, GraduationCap, Sun, Moon,
  User, Settings, LogOut, ChevronUp, Globe, Library, PencilLine, Trash2, LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Conversation } from "../types";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { AuthRequiredModal } from "./AuthRequiredModal";

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

interface SidebarProps {
  conversations?: Conversation[];
}

export function Sidebar(_props: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    updateConversationTitle,
    deleteConversation,
  } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const isHome = location.pathname === "/" || location.pathname.startsWith("/chat");
  const isStudyMaterials = location.pathname.startsWith("/study-materials") || location.pathname.startsWith("/lesson");
  const isFlashcards = location.pathname.startsWith("/flashcards") || location.pathname.startsWith("/study/");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const navItems = [
    { id: "home", icon: Home, label: "Trang chủ", path: "/" },
    { id: "study-materials", icon: Library, label: "Học liệu", path: "/study-materials" },
    { id: "flashcards", icon: GraduationCap, label: "Flashcards", path: "/flashcards" },
  ];

  const handleNew = async () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    setActiveConversationId(null);
    navigate("/chat");
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate("/chat");
  };

  const handleRenameConversation = (id: string, currentTitle: string) => {
    setEditingConvId(id);
    setEditingTitle(currentTitle);
  };

  const commitRename = async (id: string, currentTitle: string) => {
    const next = editingTitle.trim();
    setEditingConvId(null);
    if (!next || next === currentTitle) return;
    await updateConversationTitle(id, next);
  };

  const handleDeleteConversation = async (id: string) => {
    const ok = window.confirm("Xóa hội thoại này?");
    if (!ok) return;
    await deleteConversation(id);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 272 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full flex-shrink-0 overflow-hidden"
      style={{
        background: "var(--t-sidebar-bg)",
        borderRight: "1px solid var(--t-sidebar-border)",
      }}
    >
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: "var(--t-sidebar-border)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
            >
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs truncate"
                style={{ color: "var(--t-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Lịch sử Việt Nam
              </p>
              <p className="text-xs truncate" style={{ color: "var(--t-text-4)" }}>
                RAG Chatbot
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
          >
            <BookOpen size={14} className="text-white" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={toggleTheme}
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "var(--t-gold-bg)", color: "var(--t-gold)" }}
            title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "var(--t-gold-bg)", color: "var(--t-text-3)" }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="px-2 py-3 space-y-1">
        {navItems.map(({ id, icon: Icon, label, path }) => {
          const active =
            id === "home" ? isHome
            : id === "study-materials" ? isStudyMaterials
            : isFlashcards;
          return (
            <button
              key={id}
              onClick={() => {
                if (id !== "home" && !user) {
                  setAuthPromptOpen(true);
                  return;
                }
                navigate(path);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all"
              style={{
                background: active ? "var(--t-gold-bg)" : "transparent",
                border: `1px solid ${active ? "var(--t-gold-border)" : "transparent"}`,
              }}
              title={collapsed ? label : undefined}
            >
              <Icon
                size={15}
                className="flex-shrink-0"
                style={{ color: active ? "var(--t-gold)" : "var(--t-text-3)" }}
              />
              {!collapsed && (
                <span
                  className="text-sm"
                  style={{ color: active ? "var(--t-gold-text)" : "var(--t-text-2)" }}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
          title={collapsed ? "Tạo hội thoại mới" : undefined}
        >
          <Plus size={15} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Hội thoại mới</span>}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-2 pb-4 space-y-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--t-gold-bg) transparent" }}
          >
            <p
              className="px-2 py-1.5 text-xs"
              style={{ color: "var(--t-text-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              <Clock size={11} className="inline mr-1.5" />
              Lịch sử hội thoại
            </p>
            {user ? conversations.map((conv) => {
              const isActive = activeConversationId === conv.id && location.pathname === "/chat";
              return (
                <div key={conv.id} className="relative group">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (editingConvId === conv.id) return;
                      handleSelectConversation(conv.id);
                    }}
                    onKeyDown={(e) => {
                      if (editingConvId === conv.id) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectConversation(conv.id);
                      }
                    }}
                    className="w-full text-left rounded-lg px-3 py-2.5 transition-all group"
                    style={{
                      background: isActive ? "var(--t-gold-bg)" : "transparent",
                      border: isActive ? "1px solid var(--t-gold-border)" : "1px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        size={14}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: isActive ? "var(--t-gold)" : "var(--t-text-4)" }}
                      />
                      <div className="min-w-0 flex-1">
                        {editingConvId === conv.id ? (
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => commitRename(conv.id, conv.title)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(conv.id, conv.title);
                              if (e.key === "Escape") setEditingConvId(null);
                            }}
                            autoFocus
                            className="text-sm w-full rounded-md px-2 py-1"
                            style={{
                              background: "var(--t-card-bg)",
                              color: "var(--t-text-1)",
                              border: "1px solid var(--t-divider)",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <p
                            className="text-sm truncate"
                            style={{ color: isActive ? "var(--t-gold-text)" : "var(--t-text-1)" }}
                          >
                            {conv.title}
                          </p>
                        )}
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--t-text-4)" }}>
                          {formatTime(conv.timestamp)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameConversation(conv.id, conv.title);
                          }}
                          className="p-1.5 rounded-md transition-all"
                          style={{ color: "var(--t-text-3)", background: "var(--t-card-bg)" }}
                          title="Đổi tên"
                        >
                          <PencilLine size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="p-1.5 rounded-md transition-all"
                          style={{ color: "#c15050", background: "var(--t-card-bg)" }}
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div
                className="mx-2 mt-2 rounded-lg px-3 py-3 text-xs leading-relaxed"
                style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)", color: "var(--t-text-4)" }}
              >
                Đăng nhập để lưu và xem lịch sử hội thoại.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {collapsed && <div className="flex-1" />}

      <div
        className="relative border-t"
        style={{ borderColor: "var(--t-sidebar-border)" }}
        ref={menuRef}
      >
        <AnimatePresence>
          {menuOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden z-50"
              style={{
                background: isDark
                  ? "rgba(13,24,45,0.98)"
                  : "rgba(248,244,236,0.98)",
                border: "1px solid var(--t-gold-border)",
                boxShadow: isDark
                  ? "0 -8px 32px rgba(0,0,0,0.5)"
                  : "0 -8px 32px rgba(0,0,0,0.12)",
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid var(--t-divider)" }}
              >
                <p className="text-sm truncate" style={{ color: "var(--t-text-1)" }}>
                  {user?.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--t-text-4)" }}>
                  {user?.email}
                </p>
              </div>

              {[
                { icon: User, label: "Hồ sơ cá nhân", action: () => { navigate("/profile"); setMenuOpen(false); } },
                { icon: Settings, label: "Cài đặt", action: () => { navigate("/settings"); setMenuOpen(false); } },
                { icon: Globe, label: "Ngôn ngữ: Tiếng Việt", action: () => setMenuOpen(false) },
                {
                  icon: isDark ? Sun : Moon,
                  label: isDark ? "Chế độ sáng" : "Chế độ tối",
                  action: () => { toggleTheme(); setMenuOpen(false); },
                },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-80"
                  style={{
                    color: "var(--t-text-2)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-card-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon size={14} style={{ color: "var(--t-text-3)" }} />
                  {label}
                </button>
              ))}

              <div className="h-px mx-3" style={{ background: "var(--t-divider)" }} />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                style={{ color: "rgba(255,90,90,0.85)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {user ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-2.5 p-3.5 transition-all hover:opacity-80"
            title={collapsed ? (user?.name ?? "Đăng nhập") : undefined}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a87c2a)",
                color: "white",
              }}
            >
              {user.initials}
            </div>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm truncate" style={{ color: "var(--t-text-1)" }}>
                    {user?.name ?? "Đăng nhập"}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: user ? "#4ade80" : "var(--t-gold)" }} />
                    <p className="text-xs" style={{ color: "var(--t-text-4)" }}>
                      Đang hoạt động
                    </p>
                  </div>
                </div>
                {user && <ChevronUp
                  size={13}
                  className="flex-shrink-0 transition-transform"
                  style={{
                    color: "var(--t-text-4)",
                    transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="m-3 w-[calc(100%-1.5rem)] flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
            title={collapsed ? "Đăng nhập" : undefined}
          >
            <LogIn size={15} />
            {!collapsed && <span>Đăng nhập</span>}
          </button>
        )}
      </div>
      <AuthRequiredModal open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </motion.aside>
  );
}
