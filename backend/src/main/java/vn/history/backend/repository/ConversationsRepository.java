package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ConversationsRepository {

    private final JdbcTemplate jdbcTemplate;

    public ConversationsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insert(long userId, String title) {
        final String sql = """
                INSERT INTO conversations (user_id, title)
                VALUES (?, ?)
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(sql, Long.class, userId, title);
    }

    public Optional<ConversationRow> findById(long userId, long conversationId) {
        final String sql = """
                SELECT id, title, created_at, updated_at
                FROM conversations
                WHERE id = ? AND user_id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new ConversationRow(
                    rs.getLong("id"),
                    rs.getString("title"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("updated_at", OffsetDateTime.class))
            ), conversationId, userId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<ConversationSummaryRow> listSummaries(long userId) {
        final String sql = """
                SELECT
                  c.id,
                  c.title,
                  c.created_at,
                  c.updated_at,
                  COALESCE(m.last_message_at, c.updated_at) AS last_message_at,
                  COALESCE(m.message_count, 0) AS message_count
                FROM conversations c
                LEFT JOIN (
                  SELECT conversation_id,
                         MAX(created_at) AS last_message_at,
                         COUNT(*) AS message_count
                  FROM chat_messages
                  GROUP BY conversation_id
                ) m ON m.conversation_id = c.id
                WHERE c.user_id = ?
                ORDER BY last_message_at DESC NULLS LAST, c.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new ConversationSummaryRow(
                rs.getLong("id"),
                rs.getString("title"),
                toInstant(rs.getObject("last_message_at", OffsetDateTime.class)),
                rs.getInt("message_count"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                toInstant(rs.getObject("updated_at", OffsetDateTime.class))
        ), userId);
    }

    public int updateTitle(long userId, long conversationId, String title) {
        final String sql = """
                UPDATE conversations
                SET title = ?
                WHERE id = ? AND user_id = ?
                """;
        return jdbcTemplate.update(sql, title, conversationId, userId);
    }

    public int delete(long userId, long conversationId) {
        final String sql = """
                DELETE FROM conversations
                WHERE id = ? AND user_id = ?
                """;
        return jdbcTemplate.update(sql, conversationId, userId);
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public record ConversationRow(
            long id,
            String title,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record ConversationSummaryRow(
            long id,
            String title,
            Instant lastMessageAt,
            int messageCount,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
