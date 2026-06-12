import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Conversation, FlashcardDeck, Flashcard, Message } from "../types";
import { INITIAL_FLASHCARD_DECKS } from "../mockData";
import { backendApi, ConversationSummary } from "../api/backendApi";
import { useAuth } from "./AuthContext";

const GUEST_PREFIX = "guest_";
const OPEN_NEW_CHAT_AFTER_LOGIN = "open-new-chat-after-login";

const parseServerId = (id: string): number | null => {
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
};

const isGuestConversationId = (id: string | null) => !!id && id.startsWith(GUEST_PREFIX);

const makeGuestConversation = (title = "Guest chat"): Conversation => ({
  id: `${GUEST_PREFIX}${Date.now()}`,
  title,
  lastMessage: "",
  timestamp: new Date(),
  messages: [],
});

const mapConversationSummaries = (rows: ConversationSummary[]): Conversation[] =>
  rows.map((row) => {
    const ts = row.lastMessageAt ?? row.updatedAt;
    const timestamp = ts ? new Date(ts) : new Date();
    return {
      id: String(row.id),
      title: row.title || "Hoi thoai moi",
      lastMessage: row.messageCount > 0 ? `${row.messageCount} tin nhan` : "Chua co tin nhan",
      timestamp,
      messages: [],
    };
  });

interface AppContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversationId: string | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  flashcardDecks: FlashcardDeck[];
  setFlashcardDecks: React.Dispatch<React.SetStateAction<FlashcardDeck[]>>;
  addCardsToDeck: (deckId: string, cards: Flashcard[]) => void;
  createDeck: (deck: Omit<FlashcardDeck, "id" | "createdAt">) => string;
  createConversation: (title?: string) => Promise<string>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  loadConversationMessages: (id: string) => Promise<Message[]>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(INITIAL_FLASHCARD_DECKS);

  useEffect(() => {
    if (authLoading) return;

    let active = true;

    const loadUserConversations = async () => {
      const rows = await backendApi.listConversations();
      if (!active) return;
      const serverConvs = mapConversationSummaries(rows);
      if (sessionStorage.getItem(OPEN_NEW_CHAT_AFTER_LOGIN) === "1") {
        sessionStorage.removeItem(OPEN_NEW_CHAT_AFTER_LOGIN);
        setConversations(serverConvs);
        setActiveConversationId(null);
        return;
      }
      setConversations(serverConvs);
      setActiveConversationId(null);
    };

    if (!user) {
      setConversations([]);
      setActiveConversationId(null);
      return () => {
        active = false;
      };
    }

    loadUserConversations().catch(() => {
      // Keep current in-memory state if backend is not ready.
    });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const addCardsToDeck = (deckId: string, cards: Flashcard[]) => {
    setFlashcardDecks((prev) =>
      prev.map((deck) =>
        deck.id === deckId
          ? { ...deck, cards: [...deck.cards, ...cards] }
          : deck
      )
    );
  };

  const createDeck = (deckData: Omit<FlashcardDeck, "id" | "createdAt">): string => {
    const id = `deck_${Date.now()}`;
    const newDeck: FlashcardDeck = {
      ...deckData,
      id,
      createdAt: new Date(),
    };
    setFlashcardDecks((prev) => [...prev, newDeck]);
    return id;
  };

  const createConversation = async (title?: string): Promise<string> => {
    if (!user) {
      const conv = makeGuestConversation(title || "Guest chat");
      setConversations([conv]);
      setActiveConversationId(conv.id);
      return conv.id;
    }

    const resp = await backendApi.createConversation({ title });
    const conv: Conversation = {
      id: String(resp.id),
      title: resp.title || title || "Hoi thoai moi",
      lastMessage: "",
      timestamp: new Date(resp.updatedAt || resp.createdAt),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(conv.id);
    return conv.id;
  };

  const updateConversationTitle = async (id: string, title: string): Promise<void> => {
    if (isGuestConversationId(id)) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
      return;
    }

    const numericId = parseServerId(id);
    if (numericId == null) return;
    await backendApi.updateConversation(numericId, { title });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const deleteConversation = async (id: string): Promise<void> => {
    if (isGuestConversationId(id)) {
      const conv = makeGuestConversation();
      setConversations([conv]);
      setActiveConversationId(conv.id);
      return;
    }

    const numericId = parseServerId(id);
    if (numericId != null) {
      await backendApi.deleteConversation(numericId);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConversationId((prev) => (prev === id ? null : prev));
  };

  const loadConversationMessages = async (id: string): Promise<Message[]> => {
    if (isGuestConversationId(id)) {
      return conversations.find((c) => c.id === id)?.messages ?? [];
    }

    const numericId = parseServerId(id);
    if (numericId == null) return [];
    const rows = await backendApi.listConversationMessages(numericId, { limit: 200 });
    return rows.map((row) => ({
      id: String(row.id),
      role: row.role === "system" ? "assistant" : row.role,
      content: row.content,
      timestamp: new Date(row.createdAt),
      hasCitations: !!row.citations && row.citations.length > 0,
      citations: row.citations?.map((c, i) => ({
        id: `c_${c.chunkId}_${i}`,
        fileName: backendApi.basename(c.sourceFile),
        page: c.pageStart,
        chunkId: String(c.chunkId),
        excerpt: c.quote ?? "",
        documentId: c.documentId,
        sourceFile: c.sourceFile,
        title: c.title ?? undefined,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
        pageSpans: c.pageSpans ?? [],
      })),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        conversations,
        setConversations,
        activeConversationId,
        setActiveConversationId,
        flashcardDecks,
        setFlashcardDecks,
        addCardsToDeck,
        createDeck,
        createConversation,
        updateConversationTitle,
        deleteConversation,
        loadConversationMessages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
