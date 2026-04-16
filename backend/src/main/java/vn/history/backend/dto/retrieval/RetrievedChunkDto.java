package vn.history.backend.dto.retrieval;

public record RetrievedChunkDto(
        long chunkId,
        long documentId,
        String sourceFile,
        String title,
        int chunkIndex,
        int pageStart,
        int pageEnd,
        Integer wordCount,
        String content,
        double score,
        String matchedBy
) {
}
