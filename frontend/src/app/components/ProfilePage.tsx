import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, User, Mail, Shield, Camera,
  MessageSquare, Layers, GraduationCap, Edit2, Check, X
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { AuthRequired } from "./AuthRequired";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, flashcardDecks } = useApp();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editBio, setEditBio] = useState("Đam mê nghiên cứu lịch sử Việt Nam và các nền văn hóa phương Đông.");

  const totalCards = flashcardDecks.reduce((acc, d) => acc + d.cards.length, 0);
  const masteredCards = flashcardDecks.reduce(
    (acc, d) => acc + d.cards.filter((c) => c.status === "mastered").length,
    0
  );

  const stats = [
    { icon: MessageSquare, label: "Hội thoại", value: conversations.length, color: "#6399ff" },
    { icon: Layers, label: "Bộ thẻ", value: flashcardDecks.length, color: "#a06aff" },
    { icon: GraduationCap, label: "Thẻ đã thuộc", value: `${masteredCards}/${totalCards}`, color: "#50c878" },
  ];

  const handleSave = () => {
    setEditMode(false);
    // In a real app, persist changes via API
  };

  if (!user) {
    return <AuthRequired />;
  }

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
          Hồ sơ cá nhân
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Avatar + name card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 mb-6"
          style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
              >
                {user?.initials ?? "??"}
              </div>
              <button
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: "var(--t-app-bg)", border: "2px solid var(--t-gold-border)" }}
                title="Thay ảnh đại diện"
              >
                <Camera size={11} style={{ color: "var(--t-gold)" }} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--t-text-4)" }}>Họ và tên</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        background: "var(--t-input-inner-bg)",
                        border: "1px solid var(--t-gold-border)",
                        color: "var(--t-text-1)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--t-text-4)" }}>Giới thiệu</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                      style={{
                        background: "var(--t-input-inner-bg)",
                        border: "1px solid var(--t-gold-border)",
                        color: "var(--t-text-1)",
                      }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
                    >
                      <Check size={12} /> Lưu
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setEditName(user?.name ?? ""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                      style={{ background: "var(--t-btn-ghost-bg)", border: "1px solid var(--t-btn-border)", color: "var(--t-text-2)" }}
                    >
                      <X size={12} /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg" style={{ color: "var(--t-text-1)" }}>
                      {user?.name}
                    </h2>
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:opacity-70"
                      style={{ background: "var(--t-gold-bg)" }}
                    >
                      <Edit2 size={11} style={{ color: "var(--t-gold)" }} />
                    </button>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--t-text-3)" }}>
                    {editBio}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs" style={{ color: "var(--t-text-4)" }}>Đang hoạt động</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-4 text-center"
              style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ background: `${color}18` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-sm" style={{ color: "var(--t-text-1)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--t-text-4)" }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ border: "1px solid var(--t-card-border)" }}
        >
          <div
            className="px-5 py-3 border-b"
            style={{ background: "var(--t-card-bg)", borderColor: "var(--t-divider)" }}
          >
            <p className="text-xs" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Thông tin tài khoản
            </p>
          </div>
          {[
            { icon: User, label: "Họ và tên", value: user?.name ?? "—" },
            { icon: Mail, label: "Email", value: user?.email ?? "—" },
            {
              icon: Shield,
              label: "Phương thức đăng nhập",
              value: user?.provider === "google" ? "Google Account" : "Email & Mật khẩu",
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ background: "var(--t-card-bg)", borderBottom: "1px solid var(--t-divider)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--t-gold-bg)" }}
              >
                <Icon size={14} style={{ color: "var(--t-gold)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--t-text-4)" }}>{label}</p>
                <p className="text-sm mt-0.5 truncate" style={{ color: "var(--t-text-1)" }}>{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Change password (only for email users) */}
        {user?.provider === "email" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
          >
            <p className="text-xs mb-3" style={{ color: "var(--t-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Bảo mật
            </p>
            <button
              className="w-full flex items-center justify-between text-sm py-2 transition-all hover:opacity-70"
              style={{ color: "var(--t-text-2)" }}
            >
              <span>Đổi mật khẩu</span>
              <ArrowLeft size={13} className="rotate-180" style={{ color: "var(--t-text-4)" }} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
