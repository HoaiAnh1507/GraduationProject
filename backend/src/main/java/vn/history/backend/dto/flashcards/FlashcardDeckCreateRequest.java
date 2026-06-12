package vn.history.backend.dto.flashcards;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FlashcardDeckCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 200) String topic,
        @Size(max = 1000) String description,
        @Size(max = 32) String color,
        @NotEmpty @Size(max = 100) List<@Valid FlashcardCardRequest> cards
) {
}
