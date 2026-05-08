import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Tag, ArrowRight } from "lucide-react";
import { RelatedTopic } from "../types";
import { AnimatePresence, motion } from "motion/react";

interface RelatedTopicsProps {
  topics: RelatedTopic[];
  onExplore?: (topic: string) => void;
}

export function RelatedTopics({ topics, onExplore }: RelatedTopicsProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!topics || topics.length === 0) return null;

  return (
    <div
      className="rounded-xl mt-4 overflow-hidden"
      style={{ border: "1px solid rgba(99,153,255,0.2)", background: "var(--t-card-bg)" }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-all hover:opacity-80"
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(99,153,255,0.15)" }}
        >
          <Lightbulb size={13} style={{ color: "#6399ff" }} />
        </div>
        <span className="flex-1 text-xs" style={{ color: "#6399ff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Kiến thức nổi bật liên quan ({topics.length})
        </span>
        <span style={{ color: "var(--t-text-4)" }}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 space-y-2"
              style={{ borderTop: "1px solid rgba(99,153,255,0.12)" }}
            >
              {topics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg p-3 group cursor-pointer transition-all"
                  style={{ border: "1px solid rgba(99,153,255,0.12)", background: "var(--t-card-bg)" }}
                  onClick={() => onExplore?.(topic.title)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,153,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--t-card-bg)")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm" style={{ color: "var(--t-text-1)" }}>
                      {topic.title}
                    </p>
                    <ArrowRight
                      size={13}
                      className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#6399ff" }}
                    />
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--t-text-3)" }}>
                    {topic.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Tag size={10} style={{ color: "rgba(99,153,255,0.5)" }} />
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(99,153,255,0.08)",
                          color: "rgba(99,153,255,0.7)",
                          border: "1px solid rgba(99,153,255,0.15)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}