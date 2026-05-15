package vn.history.backend.controller;

import jakarta.validation.Valid;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import vn.history.backend.dto.chat.ChatAskRequest;
import vn.history.backend.dto.chat.ChatAskResponse;
import vn.history.backend.service.RagService;

import java.io.IOException;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RagService ragService;
    private final TaskExecutor taskExecutor;

    public ChatController(RagService ragService, TaskExecutor taskExecutor) {
        this.ragService = ragService;
        this.taskExecutor = taskExecutor;
    }

    @PostMapping("/ask")
    public ChatAskResponse ask(@Valid @RequestBody ChatAskRequest req) {
        return ragService.ask(req);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestParam("query") String query,
            @RequestParam(value = "topK", required = false) Integer topK
    ) {
        SseEmitter emitter = new SseEmitter(0L);

        taskExecutor.execute(() -> {
            try {
                ChatAskResponse resp = ragService.ask(new ChatAskRequest(query, topK, null, null));

                // Stream answer as chunks (not true model token streaming yet).
                streamText(emitter, resp.answer());

                emitter.send(SseEmitter.event().name("citation").data(resp.citations()));
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage() == null ? "error" : e.getMessage()));
                } catch (IOException ignored) {
                    // client likely disconnected
                } finally {
                    emitter.completeWithError(e);
                }
            }
        });

        return emitter;
    }

    private void streamText(SseEmitter emitter, String text) throws IOException {
        if (text == null || text.isBlank()) {
            return;
        }
        // Chunk by ~40 chars to keep UI responsive.
        int i = 0;
        int n = text.length();
        while (i < n) {
            int j = Math.min(i + 40, n);
            String part = text.substring(i, j);
            emitter.send(SseEmitter.event().name("token").data(part));
            i = j;
        }
    }
}
