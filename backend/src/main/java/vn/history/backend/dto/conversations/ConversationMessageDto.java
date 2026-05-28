package vn.history.backend.dto.conversations;

import java.time.Instant;
import java.util.List;
import vn.history.backend.dto.chat.CitationDto;

public record ConversationMessageDto(
        long id,
        String role,
        String content,
        String modelName,
        Integer promptTokens,
        Integer completionTokens,
        Integer latencyMs,
        Instant createdAt,
        List<CitationDto> citations
) {
}
