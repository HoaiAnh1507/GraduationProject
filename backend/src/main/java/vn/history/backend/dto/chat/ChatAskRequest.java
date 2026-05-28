package vn.history.backend.dto.chat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ChatAskRequest(
        @NotBlank String query,
        @Min(1) @Max(50) Integer topK,
        @NotNull Long conversationId,
        String sessionId,
        List<ChatTurnDto> history
) {
}
