package vn.history.backend.controller;

import jakarta.validation.Valid;
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
import vn.history.backend.security.SecurityUtils;
import vn.history.backend.service.FlashcardsService;

import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardsController {

    private final FlashcardsService flashcardsService;

    public FlashcardsController(FlashcardsService flashcardsService) {
        this.flashcardsService = flashcardsService;
    }

    @GetMapping("/decks")
    public List<FlashcardDeckDto> listDecks() {
        long userId = SecurityUtils.requireUserId();
        return flashcardsService.listDecks(userId);
    }

    @PostMapping("/decks")
    public FlashcardDeckDto createDeck(@Valid @RequestBody FlashcardDeckCreateRequest req) {
        long userId = SecurityUtils.requireUserId();
        return flashcardsService.createDeck(userId, req);
    }

    @PostMapping("/decks/{deckId}/cards/bulk")
    public FlashcardDeckDto addCards(
            @PathVariable long deckId,
            @Valid @RequestBody FlashcardBulkCreateRequest req
    ) {
        long userId = SecurityUtils.requireUserId();
        return flashcardsService.addCards(userId, deckId, req);
    }

    @PatchMapping("/cards/{cardId}/status")
    public FlashcardDto updateCardStatus(
            @PathVariable long cardId,
            @Valid @RequestBody FlashcardStatusUpdateRequest req
    ) {
        long userId = SecurityUtils.requireUserId();
        return flashcardsService.updateCardStatus(userId, cardId, req);
    }
}
