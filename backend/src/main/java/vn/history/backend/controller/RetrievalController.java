package vn.history.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.retrieval.RetrievalSearchRequest;
import vn.history.backend.dto.retrieval.RetrievalSearchResponse;
import vn.history.backend.service.RetrievalService;

@RestController
@RequestMapping("/api/retrieval")
public class RetrievalController {

    private final RetrievalService retrievalService;

    public RetrievalController(RetrievalService retrievalService) {
        this.retrievalService = retrievalService;
    }

    @PostMapping("/search")
    public RetrievalSearchResponse search(@Valid @RequestBody RetrievalSearchRequest req) {
        return retrievalService.search(req.query(), req.topK(), req.queryEmbedding());
    }
}
