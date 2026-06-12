package vn.history.backend.dto.flashcards;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FlashcardBulkCreateRequest(
        @NotEmpty @Size(max = 100) List<@Valid FlashcardCardRequest> cards
) {
}
