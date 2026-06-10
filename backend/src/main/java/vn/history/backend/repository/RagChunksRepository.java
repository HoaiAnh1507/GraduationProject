package vn.history.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.time.OffsetDateTime;

@Repository
public class RagChunksRepository {

    private final JdbcTemplate jdbcTemplate;

    public RagChunksRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RetrievedChunkRow> keywordSearch(String query, int limit) {
        final String sql = """
                SELECT
                  rc.id AS chunk_id,
                  rc.document_id,
                  d.source_file,
                  d.title,
                  rc.chunk_index,
                  rc.page_start,
                  rc.page_end,
                  rc.word_count,
                  rc.content,
                  rc.page_spans_json,
                  ts_rank_cd(rc.chunk_tsv, q) AS score
                FROM rag_chunks rc
                JOIN documents d ON d.id = rc.document_id
                CROSS JOIN plainto_tsquery('simple', unaccent(?)) AS q
                WHERE rc.chunk_tsv @@ q
                ORDER BY score DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new RetrievedChunkRow(
                        rs.getLong("chunk_id"),
                        rs.getLong("document_id"),
                        rs.getString("source_file"),
                        rs.getString("title"),
                        rs.getInt("chunk_index"),
                        rs.getInt("page_start"),
                        rs.getInt("page_end"),
                        (Integer) rs.getObject("word_count"),
                        rs.getString("content"),
                        rs.getObject("page_spans_json"),
                        rs.getDouble("score")
                ),
                query,
                limit
        );
    }

    public List<RetrievedChunkRow> vectorSearch(String queryVectorLiteral, int limit) {
        final String sql = """
                SELECT
                  rc.id AS chunk_id,
                  rc.document_id,
                  d.source_file,
                  d.title,
                  rc.chunk_index,
                  rc.page_start,
                  rc.page_end,
                  rc.word_count,
                  rc.content,
                  rc.page_spans_json,
                  (rc.embedding <=> (?::vector)) AS distance
                FROM rag_chunks rc
                JOIN documents d ON d.id = rc.document_id
                ORDER BY distance ASC
                LIMIT ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new RetrievedChunkRow(
                        rs.getLong("chunk_id"),
                        rs.getLong("document_id"),
                        rs.getString("source_file"),
                        rs.getString("title"),
                        rs.getInt("chunk_index"),
                        rs.getInt("page_start"),
                        rs.getInt("page_end"),
                        (Integer) rs.getObject("word_count"),
                        rs.getString("content"),
                        rs.getObject("page_spans_json"),
                        // store distance in score field for now; service will normalize
                        rs.getDouble("distance")
                ),
                queryVectorLiteral,
                limit
        );
    }

        public Optional<ChunkDetailRow> findChunkDetail(long chunkId) {
                final String sql = """
                                SELECT
                                  rc.id AS chunk_id,
                                  rc.document_id,
                                  d.source_file,
                                  d.title,
                                  rc.chunk_index,
                                  rc.page_start,
                                  rc.page_end,
                                  rc.word_count,
                                  rc.content,
                                  rc.page_spans_json,
                                  rc.metadata,
                                  rc.created_at,
                                  rc.updated_at
                                FROM rag_chunks rc
                                JOIN documents d ON d.id = rc.document_id
                                WHERE rc.id = ?
                                """;

                try {
                        ChunkDetailRow row = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new ChunkDetailRow(
                                        rs.getLong("chunk_id"),
                                        rs.getLong("document_id"),
                                        rs.getString("source_file"),
                                        rs.getString("title"),
                                        rs.getInt("chunk_index"),
                                        rs.getInt("page_start"),
                                        rs.getInt("page_end"),
                                        (Integer) rs.getObject("word_count"),
                                        rs.getString("content"),
                                        rs.getObject("page_spans_json"),
                                        rs.getObject("metadata"),
                                        toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                                        toInstant(rs.getObject("updated_at", OffsetDateTime.class))
                        ), chunkId);
                        return Optional.ofNullable(row);
                } catch (EmptyResultDataAccessException e) {
                        return Optional.empty();
                }
        }

        private static Instant toInstant(OffsetDateTime odt) {
                return odt == null ? null : odt.toInstant();
        }

    public record RetrievedChunkRow(
            long chunkId,
            long documentId,
            String sourceFile,
            String title,
            int chunkIndex,
            int pageStart,
            int pageEnd,
            Integer wordCount,
            String content,
            Object pageSpansJson,
            double score
    ) {
    }

    public record ChunkDetailRow(
            long chunkId,
            long documentId,
            String sourceFile,
            String title,
            int chunkIndex,
            int pageStart,
            int pageEnd,
            Integer wordCount,
            String content,
            Object pageSpansJson,
            Object metadata,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
