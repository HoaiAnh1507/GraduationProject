import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ChatPage } from "./ChatPage";
import type { Conversation } from "../types";

export function ChatPageWrapper() {
  const {
    conversations,
    setConversations,
    activeConversationId,
    createConversation,
    updateConversationTitle,
    loadConversationMessages,
  } = useApp();
  const loadedConversationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeConversationId) return;
    if (activeConversationId.startsWith("guest_")) return;
    if (loadedConversationIds.current.has(activeConversationId)) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.messages.length > 0) return;

    loadedConversationIds.current.add(activeConversationId);
    let cancelled = false;
    loadConversationMessages(activeConversationId)
      .then((msgs) => {
        if (cancelled) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, messages: msgs } : c))
        );
      })
      .catch(() => {
        // Keep empty state.
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, conversations, loadConversationMessages, setConversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ??
    null;

  const handleUpdateConversation = (updated: Conversation) => {
    setConversations((prev) => {
      const existing = prev.some((c) => c.id === updated.id);
      return existing
        ? prev.map((c) => (c.id === updated.id ? updated : c))
        : [updated, ...prev];
    });
    const existing = conversations.find((c) => c.id === updated.id);
    if (existing && existing.title !== updated.title) {
      updateConversationTitle(updated.id, updated.title);
    }
  };

  const handleCreate = async (title?: string) => {
    return createConversation(title || "Hoi thoai moi");
  };

  return (
    <ChatPage
      conversation={activeConversation}
      onUpdateConversation={handleUpdateConversation}
      onCreateConversation={handleCreate}
    />
  );
}
