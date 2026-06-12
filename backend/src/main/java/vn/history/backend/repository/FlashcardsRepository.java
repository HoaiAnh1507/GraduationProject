package vn.history.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class FlashcardsRepository {

    private final JdbcTemplate jdbcTemplate;

    public FlashcardsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insertDeck(long userId, String title, String topic, String description, String color) {
        final String sql = """
                INSERT INTO flashcard_decks (user_id, title, topic, description, color)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(sql, Long.class, userId, title, topic, description, color);
    }

    public Optional<DeckRow> findDeck(long userId, long deckId) {
        final String sql = """
                SELECT id, title, topic, description, color, created_at, updated_at
                FROM flashcard_decks
                WHERE id = ? AND user_id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new DeckRow(
                    rs.getLong("id"),
                    rs.getString("title"),
                    rs.getString("topic"),
                    rs.getString("description"),
                    rs.getString("color"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("updated_at", OffsetDateTime.class))
            ), deckId, userId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<DeckRow> listDecks(long userId) {
        final String sql = """
                SELECT id, title, topic, description, color, created_at, updated_at
                FROM flashcard_decks
                WHERE user_id = ?
                ORDER BY updated_at DESC, id DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new DeckRow(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("topic"),
                rs.getString("description"),
                rs.getString("color"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                toInstant(rs.getObject("updated_at", OffsetDateTime.class))
        ), userId);
    }

    public List<CardRow> listCards(long userId, long deckId) {
        final String sql = """
                SELECT f.id,
                       f.question,
                       f.answer,
                       f.status,
                       f.source,
                       f.source_conversation_id,
                       f.source_message_id,
                       f.created_at,
                       f.updated_at
                FROM flashcards f
                JOIN flashcard_decks d ON d.id = f.deck_id
                WHERE f.deck_id = ? AND d.user_id = ?
                ORDER BY f.created_at ASC, f.id ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CardRow(
                rs.getLong("id"),
                rs.getString("question"),
                rs.getString("answer"),
                rs.getString("status"),
                rs.getString("source"),
                (Long) rs.getObject("source_conversation_id"),
                (Long) rs.getObject("source_message_id"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                toInstant(rs.getObject("updated_at", OffsetDateTime.class))
        ), deckId, userId);
    }

    public Optional<CardRow> findCard(long userId, long cardId) {
        final String sql = """
                SELECT f.id,
                       f.question,
                       f.answer,
                       f.status,
                       f.source,
                       f.source_conversation_id,
                       f.source_message_id,
                       f.created_at,
                       f.updated_at
                FROM flashcards f
                JOIN flashcard_decks d ON d.id = f.deck_id
                WHERE f.id = ? AND d.user_id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new CardRow(
                    rs.getLong("id"),
                    rs.getString("question"),
                    rs.getString("answer"),
                    rs.getString("status"),
                    rs.getString("source"),
                    (Long) rs.getObject("source_conversation_id"),
                    (Long) rs.getObject("source_message_id"),
                    toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                    toInstant(rs.getObject("updated_at", OffsetDateTime.class))
            ), cardId, userId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public int updateCardStatus(long userId, long cardId, String status) {
        final String sql = """
                UPDATE flashcards f
                SET status = ?
                FROM flashcard_decks d
                WHERE d.id = f.deck_id
                  AND d.user_id = ?
                  AND f.id = ?
                """;
        return jdbcTemplate.update(sql, status, userId, cardId);
    }

    public void insertCard(long userId, long deckId, CardInsert card) {
        final String sql = """
                INSERT INTO flashcards (
                    user_id,
                    deck_id,
                    question,
                    answer,
                    status,
                    source,
                    source_conversation_id,
                    source_message_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(
                sql,
                userId,
                deckId,
                card.question(),
                card.answer(),
                card.status(),
                card.source(),
                card.sourceConversationId(),
                card.sourceMessageId()
        );
    }

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public record DeckRow(
            long id,
            String title,
            String topic,
            String description,
            String color,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record CardRow(
            long id,
            String question,
            String answer,
            String status,
            String source,
            Long sourceConversationId,
            Long sourceMessageId,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record CardInsert(
            String question,
            String answer,
            String status,
            String source,
            Long sourceConversationId,
            Long sourceMessageId
    ) {
    }
}
