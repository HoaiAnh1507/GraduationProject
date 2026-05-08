import { useEffect } from "react";
import { useApp, newConvId } from "../context/AppContext";
import { ChatPage } from "./ChatPage";
import { Conversation } from "../types";

export function ChatPageWrapper() {
  const { conversations, setConversations, activeConversationId, setActiveConversationId } = useApp();

  // Auto-select first conversation if none is active
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    } else if (!activeConversationId && conversations.length === 0) {
      const newConv: Conversation = {
        id: newConvId(),
        title: "Hội thoại mới",
        lastMessage: "",
        timestamp: new Date(),
        messages: [],
      };
      setConversations((prev) => [...prev, newConv]);
      setActiveConversationId(newConv.id);
    }
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ??
    conversations[0] ??
    null;

  const handleUpdateConversation = (updated: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <ChatPage
      conversation={activeConversation}
      onUpdateConversation={handleUpdateConversation}
    />
  );
}
