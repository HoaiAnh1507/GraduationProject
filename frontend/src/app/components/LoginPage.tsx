import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Mail, Lock, User, Eye, EyeOff, Chrome, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type Tab = "login" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, register, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "register") {
      if (!name.trim()) return setError("Vui lòng nhập họ tên.");
      if (password.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự.");
      if (password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
      try {
        await register(name.trim(), email.trim(), password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.");
        return;
      }
    } else {
      if (!email.trim() || !password) return setError("Vui lòng nhập đầy đủ thông tin.");
      try {
        await loginWithEmail(email.trim(), password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
        return;
      }
    }
    navigate("/");
  };

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${isDark ? "rgba(201,168,76,0.18)" : "rgba(168,124,42,0.22)"}`,
    borderRadius: "10px",
    color: isDark ? "rgba(255,255,255,0.88)" : "rgba(10,18,35,0.88)",
    padding: "10px 40px 10px 40px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const pageBg = isDark ? "#060e1d" : "#f0e8d5";
  const textPrimary = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,18,35,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.38)" : "rgba(10,18,35,0.42)";
  const textFaint = isDark ? "rgba(255,255,255,0.25)" : "rgba(10,18,35,0.28)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const googleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const googleBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const googleColor = isDark ? "rgba(255,255,255,0.82)" : "rgba(10,18,35,0.75)";
  const tabBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const tabBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  return (
    <div
      className="min-h-screen w-screen flex overflow-hidden"
      style={{ background: pageBg }}
    >
      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0a1830 0%, #071220 50%, #0d1a10 100%)",
        }}
      >
        {/* Background image overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1758782963666-fb4cf416d117?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.12,
          }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(10,18,48,0.95) 0%, rgba(6,14,22,0.8) 50%, rgba(8,20,14,0.9) 100%)",
          }}
        />

        {/* Decorative orbs */}
        <div
          className="absolute top-1/4 left-1/3 rounded-full"
          style={{
            width: "380px",
            height: "380px",
            background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 rounded-full"
          style={{
            width: "280px",
            height: "280px",
            background: "radial-gradient(circle, rgba(99,153,255,0.06) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#c9a84c", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Lịch Sử Việt Nam
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                RAG Chatbot
              </p>
            </div>
          </div>
        </div>

        {/* Center tagline */}
        <div className="relative z-10 px-10 pb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Decorative line */}
            <div
              className="w-12 h-0.5 mb-6 rounded-full"
              style={{ background: "linear-gradient(90deg, #c9a84c, transparent)" }}
            />

            <h1
              className="mb-3"
              style={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.3, fontSize: "28px" }}
            >
              Khám phá lịch sử <br />
              <span style={{ color: "#c9a84c" }}>4000 năm</span> dựng nước
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Hệ thống hỏi đáp thông minh với RAG + Hybrid Search, trích dẫn nguồn PDF chính xác, giúp bạn học lịch sử Việt Nam hiệu quả.
            </p>

            {/* Feature list */}
            {[
              { emoji: "🔍", text: "Hybrid Search – BM25 + Dense Retrieval" },
              { emoji: "📚", text: "Trích dẫn nguồn từ tài liệu PDF học thuật" },
              { emoji: "🎴", text: "Tạo Flashcard ôn tập từ cuộc hội thoại" },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 mb-3"
              >
                <span className="text-lg">{feat.emoji}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {feat.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 p-10">
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <p className="text-sm italic leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              "Dân ta phải biết sử ta, cho tường gốc tích nước nhà Việt Nam."
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(201,168,76,0.6)" }}>
              — Hồ Chí Minh
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        {/* Theme toggle button – top right */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            border: `1px solid ${isDark ? "rgba(201,168,76,0.2)" : "rgba(168,124,42,0.2)"}`,
          }}
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark
            ? <Sun size={15} style={{ color: "#c9a84c" }} />
            : <Moon size={15} style={{ color: "#a87c2a" }} />}
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)" }}
          >
            <BookOpen size={16} className="text-white" />
          </div>
          <p className="text-sm" style={{ color: "#c9a84c", letterSpacing: "0.06em" }}>
            LỊCH SỬ VIỆT NAM
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[400px]"
        >
          {/* Title */}
          <h2
            className="mb-1"
            style={{ color: textPrimary, fontSize: "22px" }}
          >
            {tab === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-sm mb-7" style={{ color: textMuted }}>
            {tab === "login"
              ? "Đăng nhập để tiếp tục học lịch sử Việt Nam"
              : "Tham gia hệ thống học tập thông minh"}
          </p>

          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: tabBg, border: `1px solid ${tabBorder}` }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: tab === t ? "rgba(201,168,76,0.15)" : "transparent",
                  color: tab === t ? "#c9a84c" : textMuted,
                  border: tab === t ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                }}
              >
                {t === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] mb-5 disabled:opacity-60"
            style={{
              background: googleBg,
              border: `1px solid ${googleBorder}`,
              color: googleColor,
            }}
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Chrome size={16} style={{ color: "#4285f4" }} />
            )}
            {tab === "login" ? "Tiếp tục với Google" : "Đăng ký với Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: dividerColor }} />
            <span className="text-xs" style={{ color: textFaint }}>
              hoặc
            </span>
            <div className="flex-1 h-px" style={{ background: dividerColor }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {tab === "register" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="relative mb-3">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "rgba(201,168,76,0.5)" }}
                    />
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(201,168,76,0.18)" : "rgba(168,124,42,0.22)")}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(201,168,76,0.5)" }}
              />
              <input
                type="email"
                placeholder="Địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(201,168,76,0.18)" : "rgba(168,124,42,0.22)")}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(201,168,76,0.5)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: "40px" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(201,168,76,0.18)" : "rgba(168,124,42,0.22)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(10,18,35,0.3)" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Confirm password */}
            <AnimatePresence>
              {tab === "register" && (
                <motion.div
                  key="confirm-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "rgba(201,168,76,0.5)" }}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Xác nhận mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(201,168,76,0.18)" : "rgba(168,124,42,0.22)")}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot password (login only) */}
            {tab === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs transition-all hover:opacity-70"
                  style={{ color: "rgba(201,168,76,0.6)" }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                  style={{
                    background: "rgba(255,80,80,0.08)",
                    border: "1px solid rgba(255,80,80,0.2)",
                    color: "rgba(255,140,140,0.9)",
                  }}
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || googleLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a87c2a)",
                color: "white",
                marginTop: "8px",
              }}
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                  <ArrowRight size={14} />
                </>
              )}
            </motion.button>
          </form>

          {/* Terms */}
          {tab === "register" && (
            <p className="text-xs text-center mt-4" style={{ color: textFaint }}>
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <span style={{ color: "rgba(201,168,76,0.55)", cursor: "pointer" }}>
                Điều khoản sử dụng
              </span>{" "}
              và{" "}
              <span style={{ color: "rgba(201,168,76,0.55)", cursor: "pointer" }}>
                Chính sách bảo mật
              </span>
            </p>
          )}

          {/* Switch tab hint */}
          <p className="text-xs text-center mt-5" style={{ color: textFaint }}>
            {tab === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
              className="transition-all hover:opacity-70"
              style={{ color: "rgba(201,168,76,0.7)" }}
            >
              {tab === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}