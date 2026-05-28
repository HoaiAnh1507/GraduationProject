import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ChatPage } from "./ChatPage";

export function ChatPageWrapper() {
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversationTitle,
    loadConversationMessages,
  } = useApp();

  // Auto-select first conversation if none is active
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations, setActiveConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.messages.length > 0) return;

    let cancelled = false;
    loadConversationMessages(activeConversationId)
      .then((msgs) => {
        if (cancelled) return;
        setConversations((prev) => prev.map((c) =>
          c.id === activeConversationId ? { ...c, messages: msgs } : c
        ));
      })
      .catch(() => {
        // keep empty state
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, conversations, loadConversationMessages, setConversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ??
    conversations[0] ??
    null;

  const handleUpdateConversation = (updated: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    const existing = conversations.find((c) => c.id === updated.id);
    if (existing && existing.title !== updated.title) {
      updateConversationTitle(updated.id, updated.title);
    }
  };

  const handleCreate = async () => {
    await createConversation("Hội thoại mới");
  };

  return (
    <ChatPage
      conversation={activeConversation}
      onUpdateConversation={handleUpdateConversation}
      onCreateConversation={handleCreate}
    />
  );
}
