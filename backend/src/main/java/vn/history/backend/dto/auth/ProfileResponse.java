package vn.history.backend.dto.auth;

import java.time.Instant;

public record ProfileResponse(
        long id,
        String email,
        String displayName,
        String username,
        String provider,
        Instant createdAt,
        Instant updatedAt
) {
}
