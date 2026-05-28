package vn.history.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.history.backend.dto.chat.CitationDto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class AnswerCitationsRepository {

    private final JdbcTemplate jdbcTemplate;

    public AnswerCitationsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insertMany(long assistantMessageId, List<CitationRow> citations) {
        if (citations == null || citations.isEmpty()) return;

        final String sql = """
                INSERT INTO answer_citations (
                  assistant_msg_id, chunk_id, citation_order, quote_text, start_char, end_char
                ) VALUES (?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.batchUpdate(
                sql,
                citations,
                citations.size(),
                (ps, c) -> {
                    ps.setLong(1, assistantMessageId);
                    ps.setLong(2, c.chunkId());
                    ps.setInt(3, c.order());
                    ps.setString(4, c.quoteText());
                    if (c.startChar() == null) ps.setNull(5, java.sql.Types.INTEGER); else ps.setInt(5, c.startChar());
                    if (c.endChar() == null) ps.setNull(6, java.sql.Types.INTEGER); else ps.setInt(6, c.endChar());
                }
        );
    }

    public Map<Long, List<CitationDto>> listByMessageIds(List<Long> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) return Map.of();

        String placeholders = String.join(",", messageIds.stream().map(id -> "?").toList());
                final String sql = String.format("""
                                SELECT
                                    ac.assistant_msg_id,
                                    rc.id AS chunk_id,
                                    rc.document_id,
                                    d.source_file,
                                    d.title,
                                    rc.chunk_index,
                                    rc.page_start,
                                    rc.page_end,
                                    ac.quote_text
                                FROM answer_citations ac
                                JOIN rag_chunks rc ON rc.id = ac.chunk_id
                                JOIN documents d ON d.id = rc.document_id
                                WHERE ac.assistant_msg_id IN (%s)
                                ORDER BY ac.assistant_msg_id, ac.citation_order ASC
                                """, placeholders);

        List<Object> params = new ArrayList<>(messageIds);
        Map<Long, List<CitationDto>> out = new HashMap<>();
        jdbcTemplate.query(sql, params.toArray(), (rs) -> {
            long msgId = rs.getLong("assistant_msg_id");
            CitationDto dto = new CitationDto(
                    rs.getLong("chunk_id"),
                    rs.getLong("document_id"),
                    rs.getString("source_file"),
                    rs.getString("title"),
                    rs.getInt("chunk_index"),
                    rs.getInt("page_start"),
                    rs.getInt("page_end"),
                    rs.getString("quote_text")
            );
            out.computeIfAbsent(msgId, k -> new ArrayList<>()).add(dto);
        });
        return out;
    }

    public record CitationRow(
            long chunkId,
            int order,
            String quoteText,
            Integer startChar,
            Integer endChar
    ) {
    }
}
