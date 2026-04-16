package vn.history.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

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
                        // store distance in score field for now; service will normalize
                        rs.getDouble("distance")
                ),
                queryVectorLiteral,
                limit
        );
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
            double score
    ) {
    }
}
