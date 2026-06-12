package vn.history.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.history.backend.dto.flashcards.FlashcardBulkCreateRequest;
import vn.history.backend.dto.flashcards.FlashcardCardRequest;
import vn.history.backend.dto.flashcards.FlashcardDeckCreateRequest;
import vn.history.backend.dto.flashcards.FlashcardDeckDto;
import vn.history.backend.dto.flashcards.FlashcardDto;
import vn.history.backend.dto.flashcards.FlashcardStatusUpdateRequest;
import vn.history.backend.exception.NotFoundException;
import vn.history.backend.repository.FlashcardsRepository;

import java.util.List;
import java.util.Set;

@Service
public class FlashcardsService {

    private static final Set<String> VALID_STATUS = Set.of("new", "learning", "mastered");
    private static final Set<String> VALID_SOURCE = Set.of("manual", "suggested", "conversation_rule");

    private final FlashcardsRepository flashcardsRepository;

    public FlashcardsService(FlashcardsRepository flashcardsRepository) {
        this.flashcardsRepository = flashcardsRepository;
    }

    public List<FlashcardDeckDto> listDecks(long userId) {
        return flashcardsRepository.listDecks(userId).stream()
                .map(deck -> toDeckDto(deck, flashcardsRepository.listCards(userId, deck.id())))
                .toList();
    }

    @Transactional
    public FlashcardDeckDto createDeck(long userId, FlashcardDeckCreateRequest req) {
        List<FlashcardsRepository.CardInsert> cards = normalizeCards(req.cards());
        if (cards.isEmpty()) {
            throw new IllegalArgumentException("No valid flashcards to save");
        }

        String topic = normalizeOptional(req.topic());
        long deckId = flashcardsRepository.insertDeck(
                userId,
                req.title().trim(),
                topic == null ? "Lịch sử Việt Nam" : topic,
                normalizeOptional(req.description()),
                normalizeOptional(req.color())
        );
        cards.forEach(card -> flashcardsRepository.insertCard(userId, deckId, card));
        return getDeck(userId, deckId);
    }

    @Transactional
    public FlashcardDeckDto addCards(long userId, long deckId, FlashcardBulkCreateRequest req) {
        flashcardsRepository.findDeck(userId, deckId)
                .orElseThrow(() -> new NotFoundException("Flashcard deck not found: " + deckId));

        List<FlashcardsRepository.CardInsert> cards = normalizeCards(req.cards());
        if (cards.isEmpty()) {
            throw new IllegalArgumentException("No valid flashcards to save");
        }

        cards.forEach(card -> flashcardsRepository.insertCard(userId, deckId, card));
        return getDeck(userId, deckId);
    }

    public FlashcardDeckDto getDeck(long userId, long deckId) {
        var deck = flashcardsRepository.findDeck(userId, deckId)
                .orElseThrow(() -> new NotFoundException("Flashcard deck not found: " + deckId));
        return toDeckDto(deck, flashcardsRepository.listCards(userId, deckId));
    }

    @Transactional
    public FlashcardDto updateCardStatus(long userId, long cardId, FlashcardStatusUpdateRequest req) {
        String status = normalizeStatus(req.status());
        int updated = flashcardsRepository.updateCardStatus(userId, cardId, status);
        if (updated == 0) {
            throw new NotFoundException("Flashcard not found: " + cardId);
        }
        return flashcardsRepository.findCard(userId, cardId)
                .map(this::toCardDto)
                .orElseThrow(() -> new NotFoundException("Flashcard not found: " + cardId));
    }

    private List<FlashcardsRepository.CardInsert> normalizeCards(List<FlashcardCardRequest> cards) {
        if (cards == null) return List.of();
        return cards.stream()
                .filter(card -> card.question() != null && card.answer() != null)
                .map(card -> new FlashcardsRepository.CardInsert(
                        card.question().trim(),
                        card.answer().trim(),
                        normalizeStatus(card.status()),
                        normalizeSource(card.source()),
                        card.sourceConversationId(),
                        card.sourceMessageId()
                ))
                .filter(card -> !card.question().isBlank() && !card.answer().isBlank())
                .toList();
    }

    private String normalizeStatus(String value) {
        String status = value == null || value.isBlank() ? "new" : value.trim();
        if (!VALID_STATUS.contains(status)) {
            throw new IllegalArgumentException("Invalid flashcard status: " + value);
        }
        return status;
    }

    private String normalizeSource(String value) {
        String source = value == null || value.isBlank() ? "manual" : value.trim();
        if (!VALID_SOURCE.contains(source)) {
            throw new IllegalArgumentException("Invalid flashcard source: " + value);
        }
        return source;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private FlashcardDeckDto toDeckDto(FlashcardsRepository.DeckRow deck, List<FlashcardsRepository.CardRow> cards) {
        return new FlashcardDeckDto(
                deck.id(),
                deck.title(),
                deck.topic(),
                deck.description(),
                deck.color(),
                deck.createdAt(),
                deck.updatedAt(),
                cards.stream().map(this::toCardDto).toList()
        );
    }

    private FlashcardDto toCardDto(FlashcardsRepository.CardRow card) {
        return new FlashcardDto(
                card.id(),
                card.question(),
                card.answer(),
                card.status(),
                card.source(),
                card.sourceConversationId(),
                card.sourceMessageId(),
                card.createdAt(),
                card.updatedAt()
        );
    }
}
