package vn.history.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import vn.history.backend.dto.documents.DocumentDetailDto;
import vn.history.backend.dto.documents.DocumentSummaryDto;
import vn.history.backend.exception.NotFoundException;
import vn.history.backend.repository.DocumentsRepository;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class DocumentsService {

    private final DocumentsRepository documentsRepository;
    private final ObjectMapper objectMapper;

    private final String storageRoot;
    private final boolean allowAbsolutePath;
    private final float pageImageDpi;

    public DocumentsService(
            DocumentsRepository documentsRepository,
            ObjectMapper objectMapper,
            @Value("${app.documents.storage-root:}") String storageRoot,
            @Value("${app.documents.allow-absolute-path:false}") boolean allowAbsolutePath,
            @Value("${app.documents.page-image.dpi:150}") float pageImageDpi
    ) {
        this.documentsRepository = documentsRepository;
        this.objectMapper = objectMapper;
        this.storageRoot = storageRoot == null ? "" : storageRoot.trim();
        this.allowAbsolutePath = allowAbsolutePath;
        this.pageImageDpi = pageImageDpi;
    }

    public List<DocumentSummaryDto> listDocuments() {
        return documentsRepository.listAll().stream()
                .map(r -> new DocumentSummaryDto(
                        r.id(),
                        r.sourceFile(),
                        r.title(),
                        r.language(),
                        r.totalPages()
                ))
                .toList();
    }

    public DocumentDetailDto getDocument(long documentId) {
        var row = documentsRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found: " + documentId));

        return new DocumentDetailDto(
                row.id(),
                row.sourceFile(),
                row.title(),
                row.language(),
                row.totalPages(),
                row.checksumSha256(),
                parseJson(row.metadata()),
                row.createdAt(),
                row.updatedAt()
        );
    }

    public ResponseEntity<?> streamPdf(long documentId, HttpHeaders requestHeaders) {
        var row = documentsRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found: " + documentId));

        Path pdfPath = resolvePdfPath(row.sourceFile());
        Resource resource = new FileSystemResource(pdfPath);

        long contentLength;
        try {
            contentLength = resource.contentLength();
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read PDF content length", e);
        }

        List<HttpRange> ranges = requestHeaders.getRange();
        if (ranges == null || ranges.isEmpty()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename(row.sourceFile()) + "\"")
                    .contentLength(contentLength)
                    .body(resource);
        }

        HttpRange range = ranges.getFirst();
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        long rangeLength = Math.max(0, end - start + 1);

        ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
        return ResponseEntity.status(206)
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename(row.sourceFile()) + "\"")
                .contentLength(rangeLength)
                .body(region);
    }

    public byte[] renderPageImage(long documentId, int pageNumber) {
        if (pageNumber < 1) {
            throw new IllegalArgumentException("pageNumber must be >= 1");
        }

        var row = documentsRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found: " + documentId));

        Path pdfPath = resolvePdfPath(row.sourceFile());

        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            int totalPages = doc.getNumberOfPages();
            if (pageNumber > totalPages) {
                throw new NotFoundException("Page not found: " + pageNumber + " (total " + totalPages + ")");
            }

            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage image = renderer.renderImageWithDPI(pageNumber - 1, pageImageDpi, ImageType.RGB);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to render PDF page image", e);
        }
    }

    private Path resolvePdfPath(String sourceFile) {
        if (sourceFile == null || sourceFile.isBlank()) {
            throw new NotFoundException("Document sourceFile is empty");
        }

        Path src = Paths.get(sourceFile);
        if (src.isAbsolute()) {
            if (!allowAbsolutePath) {
                throw new IllegalStateException("Absolute document paths are disabled (set APP_DOCUMENTS_ALLOW_ABSOLUTE_PATH=true to allow)");
            }
            Path normalized = src.normalize();
            if (!Files.exists(normalized) || !Files.isRegularFile(normalized)) {
                throw new NotFoundException("PDF not found on disk");
            }
            return normalized;
        }

        if (storageRoot.isBlank()) {
            throw new IllegalStateException("Document storage root is not configured (set APP_DOCUMENTS_STORAGE_ROOT)");
        }

        Path root = Paths.get(storageRoot).toAbsolutePath().normalize();
        Path resolved = root.resolve(src).normalize();

        if (!resolved.startsWith(root)) {
            throw new IllegalArgumentException("Invalid sourceFile path");
        }

        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            throw new NotFoundException("PDF not found on disk");
        }

        return resolved;
    }

    private JsonNode parseJson(Object pgJson) {
        if (pgJson == null) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(pgJson.toString());
        } catch (Exception e) {
            // Keep API resilient even if metadata is malformed.
            return objectMapper.createObjectNode();
        }
    }

    private String safeFilename(String sourceFile) {
        if (sourceFile == null || sourceFile.isBlank()) return "document.pdf";
        try {
            return Paths.get(sourceFile).getFileName().toString();
        } catch (Exception e) {
            return "document.pdf";
        }
    }
}
