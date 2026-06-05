package vn.history.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import vn.history.backend.dto.chat.ChatAskRequest;
import vn.history.backend.dto.chat.ChatAskResponse;
import vn.history.backend.exception.NotFoundException;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.AnswerCitationsRepository;
import vn.history.backend.repository.ChatMessagesRepository;
import vn.history.backend.repository.ConversationsRepository;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.GuestRateLimiter;
import vn.history.backend.service.RagService;
import vn.history.backend.service.auth.JwtService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RagService ragService;
    private final TaskExecutor taskExecutor;
    private final JwtService jwtService;
    private final UsersRepository usersRepository;
    private final ConversationsRepository conversationsRepository;
    private final ChatMessagesRepository chatMessagesRepository;
    private final AnswerCitationsRepository answerCitationsRepository;
    private final GuestRateLimiter guestRateLimiter;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    private static final String ACCESS_COOKIE = "access_token";
    private static final String GUEST_COOKIE = "guest_session";

    public ChatController(
        RagService ragService,
        TaskExecutor taskExecutor,
        JwtService jwtService,
        UsersRepository usersRepository,
        ConversationsRepository conversationsRepository,
        ChatMessagesRepository chatMessagesRepository,
        AnswerCitationsRepository answerCitationsRepository,
        GuestRateLimiter guestRateLimiter,
        @Value("${app.auth.cookie-secure:false}") boolean cookieSecure,
        @Value("${app.auth.cookie-same-site:Lax}") String cookieSameSite
    ) {
        this.ragService = ragService;
        this.taskExecutor = taskExecutor;
    this.jwtService = jwtService;
    this.usersRepository = usersRepository;
    this.conversationsRepository = conversationsRepository;
    this.chatMessagesRepository = chatMessagesRepository;
    this.answerCitationsRepository = answerCitationsRepository;
    this.guestRateLimiter = guestRateLimiter;
    this.cookieSecure = cookieSecure;
    this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/ask")
    public ChatAskResponse ask(
        @Valid @RequestBody ChatAskRequest req,
        @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken,
        @CookieValue(value = GUEST_COOKIE, required = false) String guestSession,
        HttpServletRequest httpReq,
        HttpServletResponse httpResp
    ) {
    if (req.conversationId() == null) {
        return askAsGuest(req, guestSession, httpReq, httpResp);
    }

    long userId = requireUserId(accessToken);
    long conversationId = req.conversationId();

    conversationsRepository.findById(userId, conversationId)
        .orElseThrow(() -> new NotFoundException("Conversation not found: " + conversationId));

    chatMessagesRepository.insertMessage(
        conversationId,
        "user",
        req.query(),
        null,
        null,
        null,
        null
    );

    long start = System.currentTimeMillis();
    try {
        ChatAskResponse resp = ragService.ask(req);
        int latency = (int) Math.max(0L, System.currentTimeMillis() - start);

        long assistantId = chatMessagesRepository.insertMessage(
            conversationId,
            "assistant",
            resp.answer(),
            null,
            null,
            null,
            latency
        );

            if (resp.citations() != null && !resp.citations().isEmpty()) {
            List<AnswerCitationsRepository.CitationRow> rows = new java.util.ArrayList<>();
            for (int i = 0; i < resp.citations().size(); i++) {
                var c = resp.citations().get(i);
                rows.add(new AnswerCitationsRepository.CitationRow(
                    c.chunkId(),
                    i + 1,
                    c.quote(),
                    null,
                    null
                ));
            }
            answerCitationsRepository.insertMany(assistantId, rows);
            }

        return resp;
    } catch (Exception e) {
        int latency = (int) Math.max(0L, System.currentTimeMillis() - start);
        String errorAnswer = "Xin lỗi, hệ thống gặp lỗi khi xử lý yêu cầu.";
        chatMessagesRepository.insertMessage(
            conversationId,
            "assistant",
            errorAnswer,
            "error",
            null,
            null,
            latency
        );
        return new ChatAskResponse(errorAnswer, List.of());
    }
    }

    private ChatAskResponse askAsGuest(
            ChatAskRequest req,
            String guestSession,
            HttpServletRequest httpReq,
            HttpServletResponse httpResp
    ) {
        String sessionId = guestSession;
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = UUID.randomUUID().toString();
            httpResp.addHeader(HttpHeaders.SET_COOKIE, guestCookie(sessionId));
        }

        guestRateLimiter.check(clientIp(httpReq), sessionId);
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
                ChatAskResponse resp = ragService.ask(new ChatAskRequest(query, topK, null, null, null));

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

    private long requireUserId(String accessToken) {
        try {
            var claims = jwtService.parseAccessToken(accessToken, java.time.Instant.now());
            return usersRepository.findById(claims.userId())
                    .orElseThrow(() -> new UnauthorizedException("User not found"))
                    .id();
        } catch (IllegalStateException e) {
            throw new UnauthorizedException("Invalid access token");
        }
    }

    private String guestCookie(String sessionId) {
        return ResponseCookie.from(GUEST_COOKIE, sessionId)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/chat")
                .sameSite(cookieSameSite)
                .build()
                .toString();
    }

    private String clientIp(HttpServletRequest req) {
        String forwardedFor = req.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int comma = forwardedFor.indexOf(',');
            return comma >= 0 ? forwardedFor.substring(0, comma).trim() : forwardedFor.trim();
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return req.getRemoteAddr();
    }
}
