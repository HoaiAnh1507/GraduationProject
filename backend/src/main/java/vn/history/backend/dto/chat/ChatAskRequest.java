package vn.history.backend.dto.chat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ChatAskRequest(
        @NotBlank String query,
        @Min(1) @Max(50) Integer topK,
        Long conversationId,
        String sessionId,
        List<ChatTurnDto> history
) {
}
