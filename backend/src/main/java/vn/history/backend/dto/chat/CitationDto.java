package vn.history.backend.dto.chat;

import com.fasterxml.jackson.databind.JsonNode;

public record CitationDto(
        long chunkId,
        long documentId,
        String sourceFile,
        String title,
        int chunkIndex,
        int pageStart,
        int pageEnd,
        String quote,
        JsonNode pageSpans
) {
}
