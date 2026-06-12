import { Lock, LogIn, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ open, onClose }: AuthRequiredModalProps) {
  const navigate = useNavigate();

  const goLogin = (mode?: "register") => {
    onClose();
    navigate(mode === "register" ? "/login?mode=register" : "/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.58)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl p-6 text-center"
            style={{
              background: "var(--t-card-bg)",
              border: "1px solid var(--t-card-border)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.36)",
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-75"
              style={{ color: "var(--t-text-3)", border: "1px solid var(--t-btn-border)" }}
            >
              <X size={15} />
            </button>
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
              Vui lòng đăng nhập để sử dụng học liệu, flashcard và lưu hội thoại.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => goLogin()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c9a84c, #a87c2a)", color: "white" }}
              >
                <LogIn size={15} />
                Đăng nhập
              </button>
              <button
                onClick={() => goLogin("register")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: "var(--t-btn-ghost-bg)", color: "var(--t-text-2)", border: "1px solid var(--t-btn-border)" }}
              >
                <UserPlus size={15} />
                Đăng ký
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
