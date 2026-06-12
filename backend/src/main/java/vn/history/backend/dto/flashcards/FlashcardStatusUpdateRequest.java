package vn.history.backend.dto.flashcards;

import jakarta.validation.constraints.NotBlank;

public record FlashcardStatusUpdateRequest(
        @NotBlank String status
) {
}
