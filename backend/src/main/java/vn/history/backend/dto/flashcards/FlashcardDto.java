package vn.history.backend.dto.flashcards;

import java.time.Instant;

public record FlashcardDto(
        long id,
        String question,
        String answer,
        String status,
        String source,
        Long sourceConversationId,
        Long sourceMessageId,
        Instant createdAt,
        Instant updatedAt
) {
}
