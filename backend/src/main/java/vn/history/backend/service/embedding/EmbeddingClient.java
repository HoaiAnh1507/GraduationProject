package vn.history.backend.service.embedding;

import java.util.List;

public interface EmbeddingClient {
    List<Double> embed(String text);
}
