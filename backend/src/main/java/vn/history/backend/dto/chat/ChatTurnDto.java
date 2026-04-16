package vn.history.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;

public record ChatTurnDto(
        @NotBlank String role,
        @NotBlank String content
) {
}
