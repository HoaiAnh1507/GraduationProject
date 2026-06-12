package vn.history.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.history.backend.dto.chat.ChatAskRequest;
import vn.history.backend.dto.chat.ChatAskResponse;
import vn.history.backend.dto.chat.CitationDto;
import vn.history.backend.dto.retrieval.RetrievedChunkDto;
import vn.history.backend.service.embedding.EmbeddingClient;
import vn.history.backend.service.llm.LlmClient;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RagService {
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");

    private final RetrievalService retrievalService;
    private final EmbeddingClient embeddingClient;
    private final LlmClient llmClient;
    private final boolean llmEnabled;

    public RagService(
            RetrievalService retrievalService,
            EmbeddingClient embeddingClient,
            LlmClient llmClient,
            @Value("${app.llm.enabled:false}") boolean llmEnabled
    ) {
        this.retrievalService = retrievalService;
        this.embeddingClient = embeddingClient;
        this.llmClient = llmClient;
        this.llmEnabled = llmEnabled;
    }

    public ChatAskResponse ask(ChatAskRequest req) {
        int topK = req.topK() == null ? 5 : req.topK();

        List<Double> queryEmbedding = embeddingClient.embed(req.query());
        var retrieval = retrievalService.search(req.query(), topK, queryEmbedding);
        List<RetrievedChunkDto> chunks = retrieval.results();

        if (!llmEnabled) {
            String answer = buildRetrievalOnlyAnswer(req.query(), chunks);
            List<CitationDto> citations = buildCitations(limitChunks(chunks, Math.min(3, chunks.size())));
            return new ChatAskResponse(answer, citations);
        }

        String systemPrompt = """
                Bạn là trợ lý hỏi đáp lịch sử Việt Nam.
                Chỉ sử dụng thông tin trong phần CONTEXT để trả lời.
                Nếu CONTEXT không đủ thông tin để kết luận, hãy nói rõ là không đủ dữ liệu trong tài liệu nguồn.
                Trả lời ngắn gọn, đúng trọng tâm, tiếng Việt.
                """;

        String userPrompt = buildUserPrompt(req.query(), chunks);

        String answer = llmClient.chat(systemPrompt, userPrompt);
        List<CitationDto> citations = buildCitations(filterCitedChunks(answer, chunks));
        return new ChatAskResponse(answer, citations);
    }

    private List<RetrievedChunkDto> filterCitedChunks(String answer, List<RetrievedChunkDto> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }

        Set<Long> usedChunkIds = extractUsedChunkIds(answer, chunks);
        if (usedChunkIds.isEmpty()) {
            return List.of(chunks.get(0));
        }

        List<RetrievedChunkDto> out = new ArrayList<>();
        for (RetrievedChunkDto chunk : chunks) {
            if (usedChunkIds.contains(chunk.chunkId())) {
                out.add(chunk);
            }
        }
        return out.isEmpty() ? List.of(chunks.get(0)) : out;
    }

    private Set<Long> extractUsedChunkIds(String answer, List<RetrievedChunkDto> chunks) {
        Set<Long> validIds = new LinkedHashSet<>();
        for (RetrievedChunkDto chunk : chunks) {
            validIds.add(chunk.chunkId());
        }

        String sourceSection = extractSourcesSection(answer);
        Set<Long> out = parseChunkIds(sourceSection, validIds);
        if (!out.isEmpty()) {
            return out;
        }

        return parseChunkIds(answer, validIds);
    }

    private String extractSourcesSection(String answer) {
        if (answer == null || answer.isBlank()) {
            return "";
        }

        String normalized = removeVietnameseAccents(answer).toLowerCase();
        int idx = normalized.lastIndexOf("nguon tham khao");
        if (idx < 0) {
            idx = normalized.lastIndexOf("nguon");
        }
        return idx >= 0 ? answer.substring(idx) : "";
    }

    private Set<Long> parseChunkIds(String text, Set<Long> validIds) {
        Set<Long> out = new LinkedHashSet<>();
        if (text == null || text.isBlank()) {
            return out;
        }

        Matcher matcher = NUMBER_PATTERN.matcher(text);
        while (matcher.find()) {
            try {
                long id = Long.parseLong(matcher.group());
                if (validIds.contains(id)) {
                    out.add(id);
                }
            } catch (NumberFormatException ignored) {
                // Ignore malformed numbers.
            }
        }
        return out;
    }

    private String removeVietnameseAccents(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.replace('đ', 'd').replace('Đ', 'D');
    }

    private List<RetrievedChunkDto> limitChunks(List<RetrievedChunkDto> chunks, int limit) {
        if (chunks == null || chunks.isEmpty() || limit <= 0) {
            return List.of();
        }
        return chunks.subList(0, Math.min(limit, chunks.size()));
    }

    private String buildRetrievalOnlyAnswer(String query, List<RetrievedChunkDto> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "Không tìm thấy đoạn tài liệu phù hợp để trả lời câu hỏi này trong kho dữ liệu hiện tại.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("(Chế độ không dùng LLM)\n");
        sb.append("Mình chưa thể sinh câu trả lời tổng hợp vì LLM đang tắt. Dưới đây là các đoạn trích liên quan nhất để bạn tham khảo:\n\n");

        int limit = Math.min(3, chunks.size());
        for (int i = 0; i < limit; i++) {
            RetrievedChunkDto c = chunks.get(i);
            sb.append("- [chunkId=")
                    .append(c.chunkId())
                    .append(", file=")
                    .append(c.sourceFile())
                    .append(", pages=")
                    .append(c.pageStart())
                    .append("-")
                    .append(c.pageEnd())
                    .append("] ");
            sb.append(makeQuote(c.content())).append("\n");
        }

        sb.append("\nGợi ý: Bật LLM để hệ thống tự tổng hợp câu trả lời cho câu hỏi: \"")
                .append(query)
                .append("\".\n");
        sb.append("Nguồn tham khảo: ");
        for (int i = 0; i < limit; i++) {
            if (i > 0) sb.append(", ");
            sb.append(chunks.get(i).chunkId());
        }

        return sb.toString();
    }

    private String buildUserPrompt(String query, List<RetrievedChunkDto> chunks) {
        StringBuilder sb = new StringBuilder();
        sb.append("CONTEXT:\n");
        for (RetrievedChunkDto c : chunks) {
            sb.append("[chunkId=")
                    .append(c.chunkId())
                    .append(", file=")
                    .append(c.sourceFile())
                    .append(", pages=")
                    .append(c.pageStart())
                    .append("-")
                    .append(c.pageEnd())
                    .append("]\n");
            sb.append(c.content()).append("\n\n");
        }

        sb.append("CÂU HỎI: ").append(query).append("\n\n");
        sb.append("YÊU CẦU TRẢ LỜI:\n");
        sb.append("- Trả lời dựa trên CONTEXT.\n");
        sb.append("- Cuối câu trả lời, thêm mục 'Nguồn tham khảo:' liệt kê các chunkId đã dùng (ví dụ: 123, 456).\n");
        return sb.toString();
    }

    private List<CitationDto> buildCitations(List<RetrievedChunkDto> chunks) {
        List<CitationDto> out = new ArrayList<>();
        for (RetrievedChunkDto c : chunks) {
            String quote = makeQuote(c.content());
            out.add(new CitationDto(
                    c.chunkId(),
                    c.documentId(),
                    c.sourceFile(),
                    c.title(),
                    c.chunkIndex(),
                    c.pageStart(),
                    c.pageEnd(),
                    quote,
                    c.pageSpans()
            ));
        }
        return out;
    }

    private String makeQuote(String content) {
        if (content == null) return "";
        String s = content.trim().replaceAll("\\s+", " ");
        int max = 220;
        if (s.length() <= max) return s;
        return s.substring(0, max).trim() + "...";
    }
}
