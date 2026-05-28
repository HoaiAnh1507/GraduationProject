package vn.history.backend.dto.auth;

import java.time.OffsetDateTime;

public record AuthResponse(
        long userId,
        String email,
        String displayName,
        OffsetDateTime accessTokenExpiresAt
) {
}
