import { useNavigate } from "react-router";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { motion } from "motion/react";

export function AuthRequired() {
  const navigate = useNavigate();

  return (
    <div
      className="flex-1 flex items-center justify-center px-6"
      style={{ background: "var(--t-app-bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl p-6 text-center"
        style={{
          background: "var(--t-card-bg)",
          border: "1px solid var(--t-card-border)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--t-gold-bg)", border: "1px solid var(--t-gold-border)" }}
        >
          <Lock size={24} style={{ color: "var(--t-gold)" }} />
        </div>
        <h2 className="text-base mb-2" style={{ color: "var(--t-text-1)" }}>
          Đăng nhập để thực hiện được chức năng này
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--t-text-3)" }}>
          Học liệu và flashcard chỉ khả dụng với tài khoản đã đăng nhập.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
          >
            <LogIn size={15} />
            Đăng nhập
          </button>
          <button
            onClick={() => navigate("/login?mode=register")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "var(--t-btn-ghost-bg)", color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
          >
            <UserPlus size={15} />
            Đăng ký
          </button>
        </div>
      </motion.div>
    </div>
  );
}
