export type MessageRole = "user" | "assistant";

export interface Citation {
  id: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  excerpt: string;

  // Backend linkage (optional so mock data still works)
  documentId?: string | number;
  sourceFile?: string;
  title?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status?: "new" | "learning" | "mastered";
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  description?: string;
  cards: Flashcard[];
  createdAt: Date;
  lastStudied?: Date;
  color?: string;
}

export interface RelatedTopic {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  citations?: Citation[];
  hasCitations: boolean;
  feedback?: "helpful" | "not_helpful";
  relatedTopics?: RelatedTopic[];
  suggestedFlashcards?: Flashcard[];
  isLoading?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}