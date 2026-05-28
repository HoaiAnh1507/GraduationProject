package vn.history.backend.dto.conversations;

import java.time.Instant;

public record ConversationSummaryDto(
        long id,
        String title,
        Instant lastMessageAt,
        int messageCount,
        Instant createdAt,
        Instant updatedAt
) {
}
