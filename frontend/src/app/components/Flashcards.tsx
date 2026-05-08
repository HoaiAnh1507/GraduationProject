import { useState } from "react";
import { GraduationCap, Plus, Sparkles } from "lucide-react";
import { Flashcard } from "../types";
import { FlashcardEditor } from "./FlashcardEditor";
import { AnimatePresence } from "motion/react";

interface FlashcardsCreateButtonProps {
  suggestedCards?: Flashcard[];
  messageContext?: string;
}

export function FlashcardsCreateButton({ suggestedCards, messageContext: _messageContext }: FlashcardsCreateButtonProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const count = suggestedCards?.length ?? 0;

  return (
    <>
      <button
        onClick={() => setEditorOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-90 active:scale-[0.98] group"
        style={{
          background: "rgba(150,100,255,0.08)",
          border: "1px solid rgba(150,100,255,0.2)",
          color: "rgba(150,100,255,0.8)",
        }}
        title="Tạo flashcard từ câu trả lời này"
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(150,100,255,0.2)" }}
        >
          <GraduationCap size={11} style={{ color: "#a06aff" }} />
        </div>
        <span>Tạo Flashcard</span>
        {count > 0 && (
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(150,100,255,0.15)", color: "rgba(150,100,255,0.9)" }}
          >
            <Sparkles size={9} />
            {count} gợi ý
          </span>
        )}
        <Plus size={12} className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <AnimatePresence>
        {editorOpen && (
          <FlashcardEditor
            suggestedCards={suggestedCards}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
