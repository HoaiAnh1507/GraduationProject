package vn.history.backend.dto.documents;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

public record DocumentDetailDto(
        long id,
        String sourceFile,
        String title,
        String language,
        Integer totalPages,
        String checksumSha256,
        JsonNode metadata,
        Instant createdAt,
        Instant updatedAt
) {
}
