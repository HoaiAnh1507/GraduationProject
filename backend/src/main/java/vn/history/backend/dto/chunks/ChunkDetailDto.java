package vn.history.backend.dto.chunks;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

public record ChunkDetailDto(
        long chunkId,
        long documentId,
        String sourceFile,
        String title,
        int chunkIndex,
        int pageStart,
        int pageEnd,
        Integer wordCount,
        String content,
        JsonNode pageSpans,
        JsonNode metadata,
        Instant createdAt,
        Instant updatedAt
) {
}
