package vn.history.backend.dto.conversations;

import java.time.Instant;

public record ConversationDetailDto(
        long id,
        String title,
        Instant createdAt,
        Instant updatedAt
) {
}
