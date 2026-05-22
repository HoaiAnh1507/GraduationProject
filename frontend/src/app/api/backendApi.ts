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

function basename(p: string): string {
  if (!p) return p;
  const parts = p.split(/[/\\]/g);
  return parts[parts.length - 1] || p;
}

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return (await resp.json()) as T;
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
};
