package vn.history.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class DocumentsRepository {

    private final JdbcTemplate jdbcTemplate;

    public DocumentsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DocumentRow> listAll() {
        final String sql = """
                SELECT
                  id,
                  source_file,
                  title,
                  language,
                  total_pages,
                  checksum_sha256,
                  metadata,
                  created_at,
                  updated_at
                FROM documents
                ORDER BY id ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new DocumentRow(
                rs.getLong("id"),
                rs.getString("source_file"),
                rs.getString("title"),
                rs.getString("language"),
                (Integer) rs.getObject("total_pages"),
                rs.getString("checksum_sha256"),
                rs.getObject("metadata"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                toInstant(rs.getObject("updated_at", OffsetDateTime.class))
        ));
    }

    public Optional<DocumentRow> findById(long documentId) {
        final String sql = """
                SELECT
                  id,
                  source_file,
                  title,
                  language,
                  total_pages,
                  checksum_sha256,
                  metadata,
                  created_at,
                  updated_at
                FROM documents
                WHERE id = ?
                """;

        List<DocumentRow> rows = jdbcTemplate.query(sql, (rs, rowNum) -> new DocumentRow(
                rs.getLong("id"),
                rs.getString("source_file"),
                rs.getString("title"),
                rs.getString("language"),
                (Integer) rs.getObject("total_pages"),
                rs.getString("checksum_sha256"),
                rs.getObject("metadata"),
                toInstant(rs.getObject("created_at", OffsetDateTime.class)),
                toInstant(rs.getObject("updated_at", OffsetDateTime.class))
        ), documentId);

        if (rows.isEmpty()) return Optional.empty();
        return Optional.of(rows.getFirst());
    }

        private static Instant toInstant(OffsetDateTime odt) {
                return odt == null ? null : odt.toInstant();
        }

    public record DocumentRow(
            long id,
            String sourceFile,
            String title,
            String language,
            Integer totalPages,
            String checksumSha256,
            Object metadata,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
