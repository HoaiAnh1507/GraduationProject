package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class LocalCredentialsRepository {

    private final JdbcTemplate jdbcTemplate;

    public LocalCredentialsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(long userId, String passwordHash) {
        final String sql = """
                INSERT INTO local_credentials (user_id, password_hash)
                VALUES (?, ?)
                """;
        jdbcTemplate.update(sql, userId, passwordHash);
    }

    public Optional<String> findPasswordHashByUserId(long userId) {
        final String sql = """
                SELECT password_hash
                FROM local_credentials
                WHERE user_id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, String.class, userId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
