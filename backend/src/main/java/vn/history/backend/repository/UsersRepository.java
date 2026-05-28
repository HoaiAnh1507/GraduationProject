package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public class UsersRepository {

    private final JdbcTemplate jdbcTemplate;

    public UsersRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<UserRow> findByEmail(String email) {
        final String sql = """
                SELECT id, email, display_name, username, created_at, updated_at
                FROM users
                WHERE email = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new UserRow(
                    rs.getLong("id"),
                    rs.getString("email"),
                    rs.getString("display_name"),
                    rs.getString("username"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("updated_at", OffsetDateTime.class))
            ), email));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<UserRow> findById(long userId) {
        final String sql = """
                SELECT id, email, display_name, username, created_at, updated_at
                FROM users
                WHERE id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new UserRow(
                    rs.getLong("id"),
                    rs.getString("email"),
                    rs.getString("display_name"),
                    rs.getString("username"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("updated_at", OffsetDateTime.class))
            ), userId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public long insertUser(String email, String displayName, String username) {
        final String sql = """
                INSERT INTO users (email, display_name, username)
                VALUES (?, ?, ?)
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(sql, Long.class, email, displayName, username);
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public record UserRow(
            long id,
            String email,
            String displayName,
            String username,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
