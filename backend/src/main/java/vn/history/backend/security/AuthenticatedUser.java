package vn.history.backend.security;

public record AuthenticatedUser(
        long id,
        String email
) {
}
