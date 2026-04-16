package vn.history.backend.dto.retrieval;

import java.util.List;

public record RetrievalSearchResponse(
        String query,
        int topK,
        List<RetrievedChunkDto> results
) {
}
