package vn.history.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.conversations.ConversationCreateRequest;
import vn.history.backend.dto.conversations.ConversationDetailDto;
import vn.history.backend.dto.conversations.ConversationMessageDto;
import vn.history.backend.dto.conversations.ConversationSummaryDto;
import vn.history.backend.dto.conversations.ConversationUpdateRequest;
import vn.history.backend.dto.conversations.ImportGuestConversationRequest;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.ConversationsService;
import vn.history.backend.service.auth.JwtService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationsController {

    private static final String ACCESS_COOKIE = "access_token";

    private final ConversationsService conversationsService;
    private final JwtService jwtService;
    private final UsersRepository usersRepository;

    public ConversationsController(
            ConversationsService conversationsService,
            JwtService jwtService,
            UsersRepository usersRepository
    ) {
        this.conversationsService = conversationsService;
        this.jwtService = jwtService;
        this.usersRepository = usersRepository;
    }

    @PostMapping
    public ConversationDetailDto create(
            @Valid @RequestBody ConversationCreateRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return conversationsService.create(userId, req);
    }

    @PostMapping("/import-guest")
    public ConversationDetailDto importGuest(
            @Valid @RequestBody ImportGuestConversationRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return conversationsService.importGuest(userId, req);
    }

    @GetMapping
    public List<ConversationSummaryDto> list(
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return conversationsService.list(userId);
    }

    @GetMapping("/{id}")
    public ConversationDetailDto get(
            @PathVariable long id,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return conversationsService.get(userId, id);
    }

    @GetMapping("/{id}/messages")
    public List<ConversationMessageDto> listMessages(
            @PathVariable long id,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "before", required = false) String before,
            @RequestParam(value = "after", required = false) String after,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        int safeLimit = Math.max(1, Math.min(200, limit == null ? 50 : limit));
        Instant beforeInstant = parseInstant(before, "before");
        Instant afterInstant = parseInstant(after, "after");
        return conversationsService.listMessages(userId, id, afterInstant, beforeInstant, safeLimit);
    }

    @PatchMapping("/{id}")
    public ConversationDetailDto update(
            @PathVariable long id,
            @RequestBody ConversationUpdateRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return conversationsService.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable long id,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        conversationsService.delete(userId, id);
    }

    private long requireUserId(String accessToken) {
        try {
            var claims = jwtService.parseAccessToken(accessToken, Instant.now());
            return usersRepository.findById(claims.userId())
                    .orElseThrow(() -> new UnauthorizedException("User not found"))
                    .id();
        } catch (IllegalStateException e) {
            throw new UnauthorizedException("Invalid access token");
        }
    }

    private Instant parseInstant(String value, String name) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid " + name + " timestamp");
        }
    }
}
