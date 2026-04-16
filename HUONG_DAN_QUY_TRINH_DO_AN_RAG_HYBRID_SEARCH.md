# Tổng quan kiến trúc & phương án triển khai đồ án RAG + Hybrid Search

Tài liệu này mô tả **khung tổng quan** để triển khai đồ án chatbot hỏi đáp lịch sử Việt Nam theo kiến trúc RAG + Hybrid Search, độc lập với trạng thái code hiện tại.

---

## MÔ TẢ CHI TIẾT ĐỒ ÁN (BẢN GHI NHỚ NGỮ CẢNH)

Mục tiêu của đồ án là xây dựng hệ thống chatbot hỏi đáp lịch sử Việt Nam có khả năng trả lời dựa trên tri thức từ tài liệu nguồn, thay vì trả lời thuần theo trí nhớ tham số của mô hình ngôn ngữ. Cốt lõi kỹ thuật là kết hợp Retrieval-Augmented Generation (RAG) và Hybrid Search để nâng độ chính xác, giảm hallucination và tăng khả năng trích dẫn nguồn.

### 1) Bài toán cần giải quyết

- Dữ liệu lịch sử Việt Nam nằm ở dạng PDF, chất lượng không đồng đều (text-based và scan/image).
- Người dùng cần hỏi bằng tiếng Việt tự nhiên, có thể đa dạng cách diễn đạt.
- Hệ thống cần trả lời có căn cứ, ưu tiên bám sát tài liệu nguồn.

### 2) Đầu vào - đầu ra mong muốn

- **Đầu vào**: PDF tài liệu lịch sử + câu hỏi tiếng Việt của người dùng.
- **Đầu ra**:
  - Câu trả lời tự nhiên, ngắn gọn, đúng trọng tâm.
  - Trích dẫn chunk/tài liệu liên quan (ít nhất file + trang/chunk).

### 3) Kiến trúc tư duy của đồ án

- Tách pipeline thành 2 phần độc lập:
  1. **Offline indexing pipeline**: extract -> chunk -> embedding -> index/store.
  2. **Online QA pipeline**: query -> retrieve (hybrid) -> generate -> cite.

- Mục tiêu thiết kế:
  - Có thể thay model embedding/LLM mà không phá vỡ toàn bộ hệ.
  - Có thể benchmark theo từng tầng (retrieval tách biệt generation).

### 4) Quyết định kỹ thuật đã chốt cho hướng đi hiện tại

- Xử lý dữ liệu chính theo **text-based PDF** để đảm bảo độ chính xác extract.
- Chunking theo **fixed-size + overlap** để ổn định và dễ benchmark.
- Chuyển vector store từ Chroma sang **PGVector (PostgreSQL)** để đồng nhất backend.
- Backend theo hướng **Spring Boot 3.x + monolith** để giảm độ phức tạp triển khai.
- Chuẩn bị luồng embedding tách rời bằng Kaggle khi máy local thiếu GPU/RAM.

### 5) Trạng thái triển khai tại thời điểm hiện tại

- Đã có pipeline extract/chunk chạy hàng loạt.
- Đã ingest dữ liệu chunk embedding vào PostgreSQL + pgvector.
- Đã xử lý phần kết nối DB và migration dependency để tương thích Spring AI.
- Chưa hoàn chỉnh phần runtime retrieval + generation end-to-end trong backend.

### 6) Những việc còn lại để hoàn tất đồ án

- Cấu hình EmbeddingModel trong backend để chạy PGVector autoconfiguration đúng chuẩn.
- Hoàn thiện API retrieval (top-k) và API RAG trả lời có citation.
- Hoàn thiện hybrid search (vector + keyword + fusion).
- Thiết kế benchmark retrieval (Recall@k) và bộ câu hỏi đánh giá chất lượng trả lời.

### 7) Tiêu chí hoàn thành có thể bảo vệ

- Demo chạy được end-to-end với dữ liệu thật.
- Có so sánh baseline vs hybrid (ít nhất ở retrieval quality).
- Câu trả lời có nguồn tham chiếu rõ ràng.
- Có tài liệu mô tả quy trình tái lập (reproducible workflow).

---

## 0) Trạng thái hiện tại của nhóm (đã chọn gì, đã làm gì)

Phần này ghi rõ các quyết định và tiến độ hiện tại để đối chiếu với các phương án bên dưới.

### 0.1. Các lựa chọn đã chốt

- **Nguồn dữ liệu chính**: PDF lịch sử Việt Nam.
- **Tiền xử lý chính**: **text-based PDF pipeline** (`pdfplumber`/`PyMuPDF`) thay vì OCR toàn phần.
- **Chunking hiện tại**: **fixed-size + overlap** theo số từ (đã có batch chạy hàng loạt).
- **Vector database mục tiêu**: **PGVector trên PostgreSQL** (Docker).
- **Backend framework**: **Spring Boot 3.x** (đã hạ từ 4.x để tương thích Spring AI).
- **Kiến trúc backend hiện tại**: hướng **monolith**.
- **Frontend**: chưa chốt chính thức trong tài liệu này (định hướng React + Vite).

### 0.2. Những phần đã làm

- Đã có script extract text + bbox trong `data-pipeline/scripts`.
- Đã có script chunking và batch chunking hàng loạt.
- Đã tách được bộ file sạch để chạy chunking hàng loạt.
- Đã thêm dependency Spring AI PGVector vào `backend/pom.xml` (artifact đúng).
- Đã cấu hình datasource PostgreSQL trong `application.properties`.
- Đã xử lý lỗi xác thực DB (password).

### 0.3. Những phần chưa hoàn tất

- Chưa cấu hình **EmbeddingModel** cho Spring AI nên PGVector autoconfig chưa chạy end-to-end.
- Chưa hoàn tất luồng **ingest chunks -> pgvector** theo backend runtime.
- Chưa hoàn thiện **hybrid fusion** (vector + keyword) ở tầng truy xuất.
- Chưa có bộ đánh giá chất lượng retrieval/answering đầy đủ.

---

## 1) Mục tiêu hệ thống

Xây dựng hệ thống hỏi đáp có khả năng:
- Truy xuất tri thức từ tài liệu lịch sử (grounded answers)
- Trả lời tự nhiên bằng mô hình ngôn ngữ
- Giảm hallucination nhờ retrieve đúng ngữ cảnh
- Có thể mở rộng dữ liệu và theo dõi chất lượng qua các vòng đánh giá

---

## 2) Kiến trúc tổng thể

Hệ thống gồm 4 lớp:

1. **Data Processing Layer**  
   Chuẩn hóa PDF, extract text, chunking, tạo metadata, embedding.

2. **Retrieval Layer (Hybrid Search)**  
   Kết hợp semantic search (vector) + keyword search (BM25/full-text) + fusion/rerank.

3. **Generation Layer (LLM/RAG)**  
   Dựng prompt từ top-k chunks, sinh câu trả lời, trích dẫn nguồn.

4. **Application Layer**  
   Backend API + Frontend UI + observability + đánh giá chất lượng.

---

## 3) Quy trình end-to-end chuẩn

1. Thu thập PDF nguồn  
2. Làm sạch dữ liệu & phân loại text-based/scan  
3. Extract text + metadata (+bbox nếu cần citations theo tọa độ)  
4. Chunking theo chiến lược đã chọn  
5. Tạo embedding cho mỗi chunk  
6. Lưu chỉ mục: vector + keyword  
7. Triển khai API hỏi đáp  
8. Kết hợp Hybrid Search + RAG prompting  
9. Đánh giá, tinh chỉnh, lặp lại

---

## 4) Các phương án kỹ thuật cho từng khối

## 4.1. Nguồn dữ liệu & tiền xử lý

**Phương án A (ưu tiên): text-based PDF pipeline**
- Công cụ: `pdfplumber`, `PyMuPDF`
- Ưu: chính xác cao với PDF có text layer, nhanh
- Nhược: yếu với file scan

**Phương án B: OCR pipeline**
- Công cụ: `PaddleOCR`, `Tesseract`, `pdf2image`
- Ưu: xử lý được file scan
- Nhược: nhiễu, sai chính tả, tốn tài nguyên

Khuyến nghị:  
- Dùng A làm luồng chính  
- Dùng B cho tập tài liệu scan quan trọng, có bước hậu kiểm thủ công

**Trạng thái nhóm**: đã chọn **Phương án A** làm chính.

## 4.2. Chunking strategy

**Phương án 1: fixed-size + overlap (dễ triển khai)**
- Theo số từ/tokens (ví dụ 180–300 từ, overlap 15–25%)
- Ổn định, dễ benchmark

**Phương án 2: sentence/paragraph-aware**
- Cắt theo câu/đoạn, tránh cắt giữa câu
- Tăng chất lượng ngữ nghĩa

**Phương án 3: semantic chunking**
- Cắt theo điểm đổi chủ đề (embedding distance)
- Chất lượng tốt hơn nhưng triển khai phức tạp hơn

Khuyến nghị: bắt đầu từ phương án 1, sau đó nâng lên 2/3 nếu cần.

**Trạng thái nhóm**: đang dùng **Phương án 1 (fixed-size + overlap)**.

## 4.3. Embedding model

**Cloud API**
- OpenAI / Azure OpenAI embedding
- Ưu: chất lượng mạnh, vận hành nhẹ
- Nhược: chi phí, phụ thuộc mạng

**Local/Open models**
- BGE, E5, multilingual sentence-transformers, Ollama embedding
- Ưu: chủ động dữ liệu, tiết kiệm dài hạn
- Nhược: cần tài nguyên máy chủ, tuning nhiều hơn

Khuyến nghị cho tiếng Việt + tài liệu lịch sử:  
- ưu tiên model multilingual mạnh, benchmark theo recall@k.

## 4.4. Vector database

**Phương án A: PGVector (PostgreSQL)**
- Ưu: tích hợp SQL, đơn giản hóa stack, phù hợp đồ án học thuật
- Nhược: scale vector thuần túy không bằng vector DB chuyên dụng

**Phương án B: Chroma/Qdrant/Weaviate/Milvus**
- Ưu: tối ưu ANN/vector-native
- Nhược: thêm thành phần vận hành

Khuyến nghị:  
- PGVector nếu ưu tiên đơn giản và đồng bộ hệ backend Java/Spring  
- Có thể giữ Chroma làm baseline so sánh

**Trạng thái nhóm**: đã chuyển mục tiêu từ Chroma sang **PGVector**.

## 4.5. Keyword/BM25

**Phương án A: PostgreSQL full-text**
- Dùng `tsvector/tsquery`, dễ tích hợp với PGVector

**Phương án B: Elasticsearch/OpenSearch**
- Mạnh cho ranking, highlight, analyzer tiếng Việt
- Nhưng tăng độ phức tạp hệ thống

Khuyến nghị: bắt đầu với PostgreSQL full-text, sau đó nâng cấp nếu cần.

## 4.6. Hybrid fusion

Các cách gộp:
- Weighted score fusion
- Reciprocal Rank Fusion (RRF)
- Reranker model (cross-encoder) cho top candidates

Khuyến nghị:  
- Bắt đầu bằng RRF (đơn giản, robust)  
- Sau đó thêm reranker để tăng precision ở top-3/top-5.

## 4.7. LLM generation

**Phương án A: API model (OpenAI/Azure/OpenRouter)**
- Chất lượng tốt, thời gian triển khai nhanh

**Phương án B: self-hosted model**
- Chủ động dữ liệu nhưng yêu cầu hạ tầng lớn

Khuyến nghị: chọn 1 model baseline ổn định, giữ prompt nhất quán để dễ đánh giá.

---

## 5) Phương án backend (chi tiết)

## 5.1. Kiến trúc backend đề xuất

- **Framework**: Spring Boot 3.x
- **Tầng chức năng**:
  - Ingestion service (nếu cần chạy từ backend)
  - Retrieval service (vector + keyword + fusion)
  - RAG service (prompt + generation)
  - Citation/trace service
  - Evaluation endpoint (offline tests)

## 5.2. Các lựa chọn triển khai

**Backend Option 1: Monolith (khuyến nghị giai đoạn đồ án)**
- 1 service xử lý API + retrieval + generation
- Nhanh, dễ debug, phù hợp demo

**Backend Option 2: Microservices**
- Tách retrieval/generation/indexing
- Chỉ nên làm nếu cần scale và có thời gian

**Trạng thái nhóm**: đang theo hướng **Option 1 (Monolith)**.

## 5.3. API tối thiểu cần có

- `POST /api/chat/ask`
- `POST /api/index/rebuild` (tuỳ chọn)
- `GET /api/health`
- `GET /api/eval/report` (tuỳ chọn)

---

## 6) Phương án frontend (chi tiết)

## 6.1. Mục tiêu UI
- Chat hỏi đáp
- Hiển thị nguồn tham chiếu (file, trang, đoạn)
- Cho phép feedback chất lượng câu trả lời

## 6.2. Các lựa chọn công nghệ

**Option A: React + Vite (khuyến nghị)**
- Nhanh, nhẹ, dễ tích hợp API

**Option B: Next.js**
- Mạnh hơn cho SSR/SEO, nhưng không bắt buộc cho đồ án chatbot nội bộ

**Trạng thái nhóm**: cần chốt chính thức; tài liệu khuyến nghị **React + Vite**.

## 6.3. Tính năng frontend nên có

- Khung chat + trạng thái loading
- Panel “Nguồn tham khảo” cho từng câu trả lời
- Hiển thị confidence/relevance (nếu có)
- History hội thoại
- Nút “đánh giá câu trả lời” (thumbs up/down)

---

## 7) Lộ trình triển khai theo mốc

## Giai đoạn 1: Data readiness
- Chốt tập dữ liệu sạch
- Extract + chunk + metadata chuẩn

## Giai đoạn 2: Retrieval baseline
- Vector retrieval chạy ổn
- Keyword retrieval chạy ổn
- Fusion baseline cho top-k

## Giai đoạn 3: RAG integration
- Prompt template có citations
- API chat hoạt động end-to-end

## Giai đoạn 4: Evaluation & optimization
- Bộ câu hỏi đánh giá
- So sánh baseline vs hybrid
- Tinh chỉnh tham số chunk/retrieve/model

---

## 8) Bộ chỉ số đánh giá nên dùng

- **Retrieval**: Recall@k, MRR, nDCG
- **Answer quality**: Faithfulness, Relevance, Citation accuracy
- **System**: latency p50/p95, cost/query, throughput

---

## 9) Rủi ro thường gặp & hướng xử lý

- PDF scan nhiều -> bổ sung OCR + hậu kiểm
- Chunk sai ngữ cảnh -> đổi strategy chunking
- Retrieval lệch chủ đề -> hybrid fusion + rerank
- LLM hallucination -> tăng grounding + strict prompt + citation bắt buộc
- Lỗi dependency stack -> khóa version theo BOM, tách profile dev/prod

---

## 10) Kết luận định hướng

Để hoàn thành đồ án với chất lượng tốt và tiến độ ổn:
- Chọn kiến trúc **Monolith backend + React frontend**
- Dùng **PGVector + PostgreSQL full-text** cho hybrid search
- Chuẩn hóa pipeline data trước, sau đó mới tối ưu model
- Duy trì vòng lặp: **build → test retrieval → test answer → refine**

