package vn.history.backend.dto.conversations;

public record ConversationUpdateRequest(
        String title,
        Boolean archived,
        Boolean pinned
) {
}
