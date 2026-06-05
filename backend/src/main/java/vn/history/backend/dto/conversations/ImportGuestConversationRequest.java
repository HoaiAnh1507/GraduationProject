package vn.history.backend.dto.conversations;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import vn.history.backend.dto.chat.ChatTurnDto;

import java.util.List;

public record ImportGuestConversationRequest(
        @Size(max = 160) String title,
        @Size(max = 200) List<@Valid ChatTurnDto> history
) {
}
