package vn.history.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import vn.history.backend.dto.retrieval.RetrievedChunkDto;
import vn.history.backend.dto.retrieval.RetrievalSearchResponse;
import vn.history.backend.repository.RagChunksRepository;
import vn.history.backend.util.VectorUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RetrievalService {

    private final RagChunksRepository ragChunksRepository;
    private final ObjectMapper objectMapper;
    private final int embeddingDim;

    public RetrievalService(
            RagChunksRepository ragChunksRepository,
            ObjectMapper objectMapper,
            @Value("${spring.ai.vectorstore.pgvector.dimensions:1024}") int embeddingDim
    ) {
        this.ragChunksRepository = ragChunksRepository;
        this.objectMapper = objectMapper;
        this.embeddingDim = embeddingDim;
    }

    public RetrievalSearchResponse search(String query, Integer topK, List<Double> queryEmbedding) {
        int k = normalizeTopK(topK);

        int candidateLimit = Math.min(k * 5, 100);

        var keywordRows = ragChunksRepository.keywordSearch(query, candidateLimit);

        List<RagChunksRepository.RetrievedChunkRow> vectorRows = List.of();
        if (queryEmbedding != null && !queryEmbedding.isEmpty()) {
            String vecLiteral = VectorUtils.toPgVectorLiteral(queryEmbedding, embeddingDim);
            vectorRows = ragChunksRepository.vectorSearch(vecLiteral, candidateLimit);
        }

        List<RetrievedChunkDto> results;
        if (!keywordRows.isEmpty() && !vectorRows.isEmpty()) {
            results = fuseRrf(keywordRows, vectorRows, k);
        } else if (!keywordRows.isEmpty()) {
            results = keywordOnly(keywordRows, k);
        } else if (!vectorRows.isEmpty()) {
            results = vectorOnly(vectorRows, k);
        } else {
            results = List.of();
        }

        return new RetrievalSearchResponse(query, k, results);
    }

    private int normalizeTopK(Integer topK) {
        if (topK == null) return 5;
        return Math.max(1, Math.min(50, topK));
    }

    private List<RetrievedChunkDto> keywordOnly(List<RagChunksRepository.RetrievedChunkRow> rows, int topK) {
        List<RetrievedChunkDto> out = new ArrayList<>(Math.min(topK, rows.size()));
        for (int i = 0; i < rows.size() && out.size() < topK; i++) {
            var r = rows.get(i);
            out.add(new RetrievedChunkDto(
                    r.chunkId(),
                    r.documentId(),
                    r.sourceFile(),
                    r.title(),
                    r.chunkIndex(),
                    r.pageStart(),
                    r.pageEnd(),
                    r.wordCount(),
                    r.content(),
                    r.score(),
                    "keyword",
                    parseArrayJson(r.pageSpansJson())
            ));
        }
        return out;
    }

    private List<RetrievedChunkDto> vectorOnly(List<RagChunksRepository.RetrievedChunkRow> rows, int topK) {
        List<RetrievedChunkDto> out = new ArrayList<>(Math.min(topK, rows.size()));
        for (int i = 0; i < rows.size() && out.size() < topK; i++) {
            var r = rows.get(i);
            double distance = r.score();
            double score = 1.0d / (1.0d + Math.max(0.0d, distance));
            out.add(new RetrievedChunkDto(
                    r.chunkId(),
                    r.documentId(),
                    r.sourceFile(),
                    r.title(),
                    r.chunkIndex(),
                    r.pageStart(),
                    r.pageEnd(),
                    r.wordCount(),
                    r.content(),
                    score,
                    "vector",
                    parseArrayJson(r.pageSpansJson())
            ));
        }
        return out;
    }

    private List<RetrievedChunkDto> fuseRrf(
            List<RagChunksRepository.RetrievedChunkRow> keyword,
            List<RagChunksRepository.RetrievedChunkRow> vector,
            int topK
    ) {
        final int rrfK = 60;

        Map<Long, Integer> kwRank = new HashMap<>();
        for (int i = 0; i < keyword.size(); i++) {
            kwRank.put(keyword.get(i).chunkId(), i + 1);
        }

        Map<Long, Integer> vecRank = new HashMap<>();
        for (int i = 0; i < vector.size(); i++) {
            vecRank.put(vector.get(i).chunkId(), i + 1);
        }

        // Keep first-seen row details.
        Map<Long, RagChunksRepository.RetrievedChunkRow> rowById = new LinkedHashMap<>();
        for (var r : keyword) rowById.putIfAbsent(r.chunkId(), r);
        for (var r : vector) rowById.putIfAbsent(r.chunkId(), r);

        Map<Long, Double> scoreById = new HashMap<>();
        for (var e : rowById.entrySet()) {
            long id = e.getKey();
            int r1 = kwRank.getOrDefault(id, Integer.MAX_VALUE);
            int r2 = vecRank.getOrDefault(id, Integer.MAX_VALUE);

            double s = 0.0d;
            if (r1 != Integer.MAX_VALUE) s += 1.0d / (rrfK + r1);
            if (r2 != Integer.MAX_VALUE) s += 1.0d / (rrfK + r2);
            scoreById.put(id, s);
        }

        return scoreById.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(topK)
                .map(e -> {
                    var r = rowById.get(e.getKey());
                    String matchedBy;
                    boolean hasKw = kwRank.containsKey(r.chunkId());
                    boolean hasVec = vecRank.containsKey(r.chunkId());
                    if (hasKw && hasVec) matchedBy = "hybrid";
                    else if (hasKw) matchedBy = "keyword";
                    else matchedBy = "vector";

                    return new RetrievedChunkDto(
                            r.chunkId(),
                            r.documentId(),
                            r.sourceFile(),
                            r.title(),
                            r.chunkIndex(),
                            r.pageStart(),
                            r.pageEnd(),
                            r.wordCount(),
                            r.content(),
                            e.getValue(),
                            matchedBy,
                            parseArrayJson(r.pageSpansJson())
                    );
                })
                .toList();
    }

    private JsonNode parseArrayJson(Object pgJson) {
        if (pgJson == null) {
            return objectMapper.createArrayNode();
        }
        try {
            JsonNode node = objectMapper.readTree(pgJson.toString());
            return node.isArray() ? node : objectMapper.createArrayNode();
        } catch (Exception e) {
            return objectMapper.createArrayNode();
        }
    }
}
