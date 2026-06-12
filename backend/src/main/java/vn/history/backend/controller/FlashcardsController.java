package vn.history.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.flashcards.FlashcardBulkCreateRequest;
import vn.history.backend.dto.flashcards.FlashcardDeckCreateRequest;
import vn.history.backend.dto.flashcards.FlashcardDeckDto;
import vn.history.backend.dto.flashcards.FlashcardDto;
import vn.history.backend.dto.flashcards.FlashcardStatusUpdateRequest;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.FlashcardsService;
import vn.history.backend.service.auth.JwtService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardsController {

    private static final String ACCESS_COOKIE = "access_token";

    private final FlashcardsService flashcardsService;
    private final JwtService jwtService;
    private final UsersRepository usersRepository;

    public FlashcardsController(
            FlashcardsService flashcardsService,
            JwtService jwtService,
            UsersRepository usersRepository
    ) {
        this.flashcardsService = flashcardsService;
        this.jwtService = jwtService;
        this.usersRepository = usersRepository;
    }

    @GetMapping("/decks")
    public List<FlashcardDeckDto> listDecks(
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return flashcardsService.listDecks(userId);
    }

    @PostMapping("/decks")
    public FlashcardDeckDto createDeck(
            @Valid @RequestBody FlashcardDeckCreateRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return flashcardsService.createDeck(userId, req);
    }

    @PostMapping("/decks/{deckId}/cards/bulk")
    public FlashcardDeckDto addCards(
            @PathVariable long deckId,
            @Valid @RequestBody FlashcardBulkCreateRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return flashcardsService.addCards(userId, deckId, req);
    }

    @PatchMapping("/cards/{cardId}/status")
    public FlashcardDto updateCardStatus(
            @PathVariable long cardId,
            @Valid @RequestBody FlashcardStatusUpdateRequest req,
            @CookieValue(value = ACCESS_COOKIE, required = false) String accessToken
    ) {
        long userId = requireUserId(accessToken);
        return flashcardsService.updateCardStatus(userId, cardId, req);
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
}
