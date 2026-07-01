export interface DocumentSummary {
  id: number;
  sourceFile: string;
  title: string | null;
  language: string | null;
  totalPages: number | null;
}

export interface DocumentDetail extends DocumentSummary {
  checksumSha256: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface BBoxSpanDto {
  x0: number;
  top: number;
  x1: number;
  bottom: number;
}

export interface PageSpanDto {
  page_number: number;
  bbox_span: BBoxSpanDto;
  token_count?: number;
}

export interface BackendCitationDto {
  chunkId: number;
  documentId: number;
  sourceFile: string;
  title: string | null;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  quote: string | null;
  pageSpans?: PageSpanDto[];
}

export interface ChatAskResponse {
  answer: string;
  citations: BackendCitationDto[];
}

export interface AuthResponse {
  userId: number;
  email: string;
  displayName: string | null;
  accessTokenExpiresAt: string;
}

export interface ProfileResponse {
  id: number;
  email: string;
  displayName: string | null;
  username: string | null;
  provider?: "google" | "email";
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: number;
  title: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  modelName: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number | null;
  createdAt: string;
  citations?: BackendCitationDto[];
}

export interface ChatTurnPayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BackendFlashcard {
  id: number;
  question: string;
  answer: string;
  status: "new" | "learning" | "mastered";
  source: "manual" | "suggested" | "conversation_rule";
  sourceConversationId: number | null;
  sourceMessageId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendFlashcardDeck {
  id: number;
  title: string;
  topic: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  cards: BackendFlashcard[];
}

export interface FlashcardCardPayload {
  question: string;
  answer: string;
  status?: "new" | "learning" | "mastered";
  source?: "manual" | "suggested" | "conversation_rule";
  sourceConversationId?: number | null;
  sourceMessageId?: number | null;
}

function basename(p: string): string {
  if (!p) return p;
  const parts = p.split(/[/\\]/g);
  return parts[parts.length - 1] || p;
}

const AUTH_EXEMPT = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"];

async function httpJson<T>(url: string, init?: RequestInit, retry = true): Promise<T> {
  const resp = await fetch(url, { credentials: "include", ...init });
  if (!resp.ok) {
    if (resp.status === 401 && retry && !AUTH_EXEMPT.includes(url)) {
      try {
        await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        return httpJson<T>(url, init, false);
      } catch {
        // fall through
      }
    }
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }
  if (resp.status === 204) {
    return undefined as T;
  }
  const text = await resp.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const backendApi = {
  basename,

  listDocuments(): Promise<DocumentSummary[]> {
    return httpJson<DocumentSummary[]>("/api/documents");
  },

  getDocument(documentId: string | number): Promise<DocumentDetail> {
    return httpJson<DocumentDetail>(`/api/documents/${documentId}`);
  },

  askChat(query: string, conversationId?: number | null, topK?: number, history?: ChatTurnPayload[]): Promise<ChatAskResponse> {
    return httpJson<ChatAskResponse>("/api/chat/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK, conversationId, history }),
    });
  },

  pdfUrl(documentId: string | number): string {
    return `/api/documents/${documentId}/pdf`;
  },

  pageImageUrl(documentId: string | number, pageNumber: string | number): string {
    return `/api/documents/${documentId}/pages/${pageNumber}/image`;
  },

  register(payload: { email: string; password: string; displayName?: string; username?: string }): Promise<AuthResponse> {
    return httpJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }): Promise<AuthResponse> {
    return httpJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  refresh(): Promise<AuthResponse> {
    return httpJson<AuthResponse>("/api/auth/refresh", { method: "POST" });
  },

  logout(): Promise<void> {
    return httpJson<void>("/api/auth/logout", { method: "POST" });
  },

  changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    return httpJson<void>("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  me(): Promise<ProfileResponse> {
    return httpJson<ProfileResponse>("/api/me", { cache: "no-store" });
  },

  listConversations(): Promise<ConversationSummary[]> {
    return httpJson<ConversationSummary[]>("/api/conversations");
  },

  createConversation(payload: { title?: string | null }): Promise<ConversationDetail> {
    return httpJson<ConversationDetail>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
  },

  importGuestConversation(payload: { title?: string | null; history: ChatTurnPayload[] }): Promise<ConversationDetail> {
    return httpJson<ConversationDetail>("/api/conversations/import-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateConversation(id: number, payload: { title?: string | null }): Promise<ConversationDetail> {
    return httpJson<ConversationDetail>(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  deleteConversation(id: number): Promise<void> {
    return httpJson<void>(`/api/conversations/${id}`, { method: "DELETE" });
  },

  listConversationMessages(id: number, params?: { limit?: number; before?: string; after?: string }): Promise<ConversationMessage[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.before) query.set("before", params.before);
    if (params?.after) query.set("after", params.after);
    const qs = query.toString();
    return httpJson<ConversationMessage[]>(`/api/conversations/${id}/messages${qs ? `?${qs}` : ""}`);
  },

  listFlashcardDecks(): Promise<BackendFlashcardDeck[]> {
    return httpJson<BackendFlashcardDeck[]>("/api/flashcards/decks");
  },

  createFlashcardDeck(payload: {
    title: string;
    topic?: string | null;
    description?: string | null;
    color?: string | null;
    cards: FlashcardCardPayload[];
  }): Promise<BackendFlashcardDeck> {
    return httpJson<BackendFlashcardDeck>("/api/flashcards/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  addFlashcardsToDeck(deckId: number, cards: FlashcardCardPayload[]): Promise<BackendFlashcardDeck> {
    return httpJson<BackendFlashcardDeck>(`/api/flashcards/decks/${deckId}/cards/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    });
  },

  updateFlashcardStatus(cardId: number, status: "new" | "learning" | "mastered"): Promise<BackendFlashcard> {
    return httpJson<BackendFlashcard>(`/api/flashcards/cards/${cardId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },
};
