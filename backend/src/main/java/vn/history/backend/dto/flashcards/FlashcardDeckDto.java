package vn.history.backend.dto.flashcards;

import java.time.Instant;
import java.util.List;

public record FlashcardDeckDto(
        long id,
        String title,
        String topic,
        String description,
        String color,
        Instant createdAt,
        Instant updatedAt,
        List<FlashcardDto> cards
) {
}
