package vn.history.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.documents.DocumentDetailDto;
import vn.history.backend.dto.documents.DocumentSummaryDto;
import vn.history.backend.service.DocumentsService;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentsController {

    private final DocumentsService documentsService;

    public DocumentsController(DocumentsService documentsService) {
        this.documentsService = documentsService;
    }

    @GetMapping
    public List<DocumentSummaryDto> listDocuments() {
        return documentsService.listDocuments();
    }

    @GetMapping("/{documentId}")
    public DocumentDetailDto getDocument(@PathVariable long documentId) {
        return documentsService.getDocument(documentId);
    }

    @GetMapping("/{documentId}/pdf")
    public ResponseEntity<?> getPdf(
            @PathVariable long documentId,
            @RequestHeader HttpHeaders headers
    ) {
        return documentsService.streamPdf(documentId, headers);
    }

    @GetMapping(value = "/{documentId}/pages/{pageNumber}/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getPageImage(
            @PathVariable long documentId,
            @PathVariable int pageNumber
    ) {
        byte[] png = documentsService.renderPageImage(documentId, pageNumber);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }
}
