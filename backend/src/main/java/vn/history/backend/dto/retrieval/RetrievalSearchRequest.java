package vn.history.backend.dto.retrieval;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record RetrievalSearchRequest(
        @NotBlank String query,
        @Min(1) @Max(50) Integer topK,
        // Optional: pass a precomputed query embedding (size must match DB dimension).
        List<Double> queryEmbedding
) {
}
