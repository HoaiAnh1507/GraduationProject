package vn.history.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.chunks.ChunkDetailDto;
import vn.history.backend.exception.NotFoundException;
import vn.history.backend.repository.RagChunksRepository;

@RestController
@RequestMapping("/api/chunks")
public class ChunksController {

    private final RagChunksRepository ragChunksRepository;
    private final ObjectMapper objectMapper;

    public ChunksController(RagChunksRepository ragChunksRepository, ObjectMapper objectMapper) {
        this.ragChunksRepository = ragChunksRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/{chunkId}")
    public ChunkDetailDto getChunk(@PathVariable long chunkId) {
        var row = ragChunksRepository.findChunkDetail(chunkId)
                .orElseThrow(() -> new NotFoundException("Chunk not found: " + chunkId));

        return new ChunkDetailDto(
                row.chunkId(),
                row.documentId(),
                row.sourceFile(),
                row.title(),
                row.chunkIndex(),
                row.pageStart(),
                row.pageEnd(),
                row.wordCount(),
                row.content(),
                parseJson(row.pageSpansJson()),
                parseJson(row.metadata()),
                row.createdAt(),
                row.updatedAt()
        );
    }

    private JsonNode parseJson(Object pgJson) {
        if (pgJson == null) {
            return objectMapper.createArrayNode();
        }
        try {
            return objectMapper.readTree(pgJson.toString());
        } catch (Exception e) {
            return objectMapper.createArrayNode();
        }
    }
}
