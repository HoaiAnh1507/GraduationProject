package vn.history.backend.util;

import java.util.List;

public final class VectorUtils {

    private VectorUtils() {
    }

    public static String toPgVectorLiteral(List<Double> embedding, int expectedDim) {
        if (embedding == null) {
            throw new IllegalArgumentException("queryEmbedding is null");
        }
        if (embedding.size() != expectedDim) {
            throw new IllegalArgumentException(
                    "queryEmbedding dim mismatch: expected " + expectedDim + ", got " + embedding.size()
            );
        }

        StringBuilder sb = new StringBuilder(expectedDim * 8);
        sb.append('[');
        for (int i = 0; i < embedding.size(); i++) {
            Double v = embedding.get(i);
            if (v == null || v.isNaN() || v.isInfinite()) {
                throw new IllegalArgumentException("queryEmbedding contains invalid value at index " + i);
            }
            if (i > 0) sb.append(',');
            sb.append(String.format(java.util.Locale.ROOT, "%.8f", v));
        }
        sb.append(']');
        return sb.toString();
    }
}
