package vn.history.backend.service;

import org.springframework.stereotype.Service;
import vn.history.backend.dto.chat.ChatAskRequest;
import vn.history.backend.dto.chat.ChatAskResponse;
import vn.history.backend.dto.chat.CitationDto;
import vn.history.backend.dto.retrieval.RetrievedChunkDto;

import java.util.ArrayList;
import java.util.List;

@Service
public class RagService {

    private final RetrievalService retrievalService;
    private final LlmClient llmClient;

    public RagService(RetrievalService retrievalService, LlmClient llmClient) {
        this.retrievalService = retrievalService;
        this.llmClient = llmClient;
    }

    public ChatAskResponse ask(ChatAskRequest req) {
        int topK = req.topK() == null ? 5 : req.topK();

        // For now: query embedding is not provided by the API contract, so retrieval is keyword-only.
        var retrieval = retrievalService.search(req.query(), topK, null);
        List<RetrievedChunkDto> chunks = retrieval.results();

        String systemPrompt = """
                Bạn là trợ lý hỏi đáp lịch sử Việt Nam.
                Chỉ sử dụng thông tin trong phần CONTEXT để trả lời.
                Nếu CONTEXT không đủ thông tin để kết luận, hãy nói rõ là không đủ dữ liệu trong tài liệu nguồn.
                Trả lời ngắn gọn, đúng trọng tâm, tiếng Việt.
                """;

        String userPrompt = buildUserPrompt(req.query(), chunks);

        String answer = llmClient.chat(systemPrompt, userPrompt);

        List<CitationDto> citations = buildCitations(chunks);
        return new ChatAskResponse(answer, citations);
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
                    quote
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
