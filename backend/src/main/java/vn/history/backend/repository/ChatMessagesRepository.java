package vn.history.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Repository
public class ChatMessagesRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChatMessagesRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

        public long insertMessage(
            long conversationId,
            String role,
            String content,
            String modelName,
            Integer promptTokens,
            Integer completionTokens,
            Integer latencyMs
        ) {
        final String sql = """
            INSERT INTO chat_messages (
              conversation_id, role, content, model_name, prompt_tokens, completion_tokens, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            """;
        return jdbcTemplate.queryForObject(
            sql,
            Long.class,
            conversationId,
            role,
            content,
            modelName,
            promptTokens,
            completionTokens,
            latencyMs
        );
        }

    public List<MessageRow> listMessages(long conversationId, Instant after, Instant before, int limit, boolean newestFirst) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT id, role, content, model_name, prompt_tokens, completion_tokens, latency_ms, created_at ")
           .append("FROM chat_messages WHERE conversation_id = ? ");

        if (after != null) {
            sql.append("AND created_at > ? ");
        }
        if (before != null) {
            sql.append("AND created_at < ? ");
        }
        sql.append("ORDER BY created_at ").append(newestFirst ? "DESC" : "ASC").append(" LIMIT ?");

        Object[] params;
        if (after != null && before != null) {
            params = new Object[] { conversationId, OffsetDateTime.ofInstant(after, ZoneOffset.UTC), OffsetDateTime.ofInstant(before, ZoneOffset.UTC), limit };
        } else if (after != null) {
            params = new Object[] { conversationId, OffsetDateTime.ofInstant(after, ZoneOffset.UTC), limit };
        } else if (before != null) {
            params = new Object[] { conversationId, OffsetDateTime.ofInstant(before, ZoneOffset.UTC), limit };
        } else {
            params = new Object[] { conversationId, limit };
        }

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new MessageRow(
                rs.getLong("id"),
                rs.getString("role"),
                rs.getString("content"),
                rs.getString("model_name"),
                (Integer) rs.getObject("prompt_tokens"),
                (Integer) rs.getObject("completion_tokens"),
                (Integer) rs.getObject("latency_ms"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class))
        ), params);
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public record MessageRow(
            long id,
            String role,
            String content,
            String modelName,
            Integer promptTokens,
            Integer completionTokens,
            Integer latencyMs,
            Instant createdAt
    ) {
    }
}
