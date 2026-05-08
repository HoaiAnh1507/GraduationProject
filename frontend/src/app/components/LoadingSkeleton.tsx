import { motion } from "motion/react";

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`rounded ${className}`}
      style={{ background: "var(--t-divider)", ...style }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function MessageLoadingSkeleton() {
  return (
    <div className="flex gap-3 px-6 py-4">
      {/* Avatar */}
      <Shimmer className="w-8 h-8 rounded-lg flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 max-w-2xl space-y-2">
        <Shimmer className="h-3 w-20" />
        <div
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: "var(--t-card-bg)", border: "1px solid var(--t-card-border)" }}
        >
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-5/6" />
          <Shimmer className="h-3 w-4/5" />
          <Shimmer className="h-3 w-3/4" />
          <div className="pt-1">
            <Shimmer className="h-3 w-full" />
            <div className="mt-2 space-y-1.5">
              <Shimmer className="h-3 w-5/6" />
              <Shimmer className="h-3 w-4/6" />
            </div>
          </div>
        </div>

        {/* Citation skeleton */}
        <div className="mt-3">
          <Shimmer className="h-2.5 w-28 mb-2" />
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ border: "1px solid var(--t-card-border)", background: "var(--t-card-bg)" }}
              >
                <Shimmer className="w-5 h-5 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-2.5 w-3/4" />
                  <Shimmer className="h-2 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--t-gold)" }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
          <span className="text-xs ml-1" style={{ color: "var(--t-text-5)" }}>
            Đang phân tích tài liệu...
          </span>
        </div>
      </div>
    </div>
  );
}