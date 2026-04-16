package vn.history.backend.dto.chat;

import java.util.List;

public record ChatAskResponse(
        String answer,
        List<CitationDto> citations
) {
}
