package vn.history.backend.dto.flashcards;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FlashcardCardRequest(
        @NotBlank @Size(max = 2000) String question,
        @NotBlank @Size(max = 8000) String answer,
        String status,
        String source,
        Long sourceConversationId,
        Long sourceMessageId
) {
}
