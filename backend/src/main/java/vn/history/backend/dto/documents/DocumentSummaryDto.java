package vn.history.backend.dto.documents;

public record DocumentSummaryDto(
        long id,
        String sourceFile,
        String title,
        String language,
        Integer totalPages
) {
}
