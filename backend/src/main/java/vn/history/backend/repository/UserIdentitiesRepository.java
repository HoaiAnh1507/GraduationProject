package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public class UserIdentitiesRepository {

    private static final String GOOGLE_PROVIDER = "google";

    private final JdbcTemplate jdbcTemplate;

    public UserIdentitiesRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<IdentityRow> findGoogleBySubject(String subject) {
        final String sql = """
                SELECT id, user_id, provider, provider_subject, email_at_link_time, created_at, last_login_at
                FROM user_identities
                WHERE provider = ? AND provider_subject = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new IdentityRow(
                    rs.getLong("id"),
                    rs.getLong("user_id"),
                    rs.getString("provider"),
                    rs.getString("provider_subject"),
                    rs.getString("email_at_link_time"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("last_login_at", OffsetDateTime.class))
            ), GOOGLE_PROVIDER, subject));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void linkGoogleIdentity(long userId, String subject, String email) {
        final String sql = """
                INSERT INTO user_identities (user_id, provider, provider_subject, email_at_link_time, last_login_at)
                VALUES (?, ?, ?, ?, now())
                ON CONFLICT (provider, provider_subject)
                DO UPDATE SET email_at_link_time = EXCLUDED.email_at_link_time,
                              last_login_at = now()
                """;
        jdbcTemplate.update(sql, userId, GOOGLE_PROVIDER, subject, email);
    }

    public record IdentityRow(
            long id,
            long userId,
            String provider,
            String providerSubject,
            String emailAtLinkTime,
            Instant createdAt,
            Instant lastLoginAt
    ) {
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }
}
