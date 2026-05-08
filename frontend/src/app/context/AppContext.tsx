import { createContext, useContext, useState, ReactNode } from "react";
import { Conversation, FlashcardDeck, Flashcard } from "../types";
import { INITIAL_CONVERSATIONS, INITIAL_FLASHCARD_DECKS } from "../mockData";

let convIdCounter = 100;
export const newConvId = () => `conv_new_${++convIdCounter}`;

interface AppContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversationId: string | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  flashcardDecks: FlashcardDeck[];
  setFlashcardDecks: React.Dispatch<React.SetStateAction<FlashcardDeck[]>>;
  addCardsToDeck: (deckId: string, cards: Flashcard[]) => void;
  createDeck: (deck: Omit<FlashcardDeck, "id" | "createdAt">) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    INITIAL_CONVERSATIONS[0].id
  );
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(INITIAL_FLASHCARD_DECKS);

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
