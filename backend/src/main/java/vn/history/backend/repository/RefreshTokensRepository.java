package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Repository
public class RefreshTokensRepository {

    private final JdbcTemplate jdbcTemplate;

    public RefreshTokensRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(long userId, String tokenHash, Instant expiresAt, String userAgent, String ipHash) {
        final String sql = """
                INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_hash)
                VALUES (?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(sql, userId, tokenHash, OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC), userAgent, ipHash);
    }

    public Optional<RefreshTokenRow> findValidByHash(String tokenHash) {
        final String sql = """
                SELECT id, user_id, expires_at, revoked_at, last_used_at
                FROM refresh_tokens
                WHERE token_hash = ?
                  AND revoked_at IS NULL
                  AND expires_at > now()
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new RefreshTokenRow(
                    rs.getLong("id"),
                    rs.getLong("user_id"),
                    toInstant(rs.getObject("expires_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("revoked_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("last_used_at", OffsetDateTime.class))
            ), tokenHash));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void revoke(long tokenId) {
        final String sql = """
                UPDATE refresh_tokens
                SET revoked_at = now()
                WHERE id = ?
                """;
        jdbcTemplate.update(sql, tokenId);
    }

    public void revokeAllForUser(long userId) {
        final String sql = """
                UPDATE refresh_tokens
                SET revoked_at = now()
                WHERE user_id = ? AND revoked_at IS NULL
                """;
        jdbcTemplate.update(sql, userId);
    }

    public void updateLastUsed(long tokenId) {
        final String sql = """
                UPDATE refresh_tokens
                SET last_used_at = now()
                WHERE id = ?
                """;
        jdbcTemplate.update(sql, tokenId);
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public record RefreshTokenRow(
            long id,
            long userId,
            Instant expiresAt,
            Instant revokedAt,
            Instant lastUsedAt
    ) {
    }
}
