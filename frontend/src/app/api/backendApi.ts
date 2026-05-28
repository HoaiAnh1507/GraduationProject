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

export interface BackendCitationDto {
  chunkId: number;
  documentId: number;
  sourceFile: string;
  title: string | null;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  quote: string | null;
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
  createdAt: string;
  updatedAt: string;
}

function basename(p: string): string {
  if (!p) return p;
  const parts = p.split(/[/\\]/g);
  return parts[parts.length - 1] || p;
}

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, { credentials: "include", ...init });
  if (!resp.ok) {
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

  askChat(query: string, topK?: number): Promise<ChatAskResponse> {
    return httpJson<ChatAskResponse>("/api/chat/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK }),
    });
  },

  pdfUrl(documentId: string | number): string {
    return `/api/documents/${documentId}/pdf`;
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

  me(): Promise<ProfileResponse> {
    return httpJson<ProfileResponse>("/api/me");
  },
};
