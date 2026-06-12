export type MessageRole = "user" | "assistant";

export interface BBoxSpan {
  x0: number;
  top: number;
  x1: number;
  bottom: number;
}

export interface PageSpan {
  page_number: number;
  bbox_span: BBoxSpan;
  token_count?: number;
}

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
  pageSpans?: PageSpan[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status?: "new" | "learning" | "mastered";
  source?: "manual" | "suggested" | "conversation_rule";
  sourceConversationId?: number | null;
  sourceMessageId?: number | null;
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
