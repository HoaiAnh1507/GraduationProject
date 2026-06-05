package vn.history.backend.service;

import org.springframework.stereotype.Service;
import vn.history.backend.dto.conversations.ConversationCreateRequest;
import vn.history.backend.dto.conversations.ConversationDetailDto;
import vn.history.backend.dto.conversations.ConversationMessageDto;
import vn.history.backend.dto.conversations.ConversationSummaryDto;
import vn.history.backend.dto.conversations.ConversationUpdateRequest;
import vn.history.backend.dto.conversations.ImportGuestConversationRequest;
import vn.history.backend.exception.NotFoundException;
import vn.history.backend.repository.AnswerCitationsRepository;
import vn.history.backend.repository.ChatMessagesRepository;
import vn.history.backend.repository.ConversationsRepository;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ConversationsService {

    private final ConversationsRepository conversationsRepository;
    private final ChatMessagesRepository chatMessagesRepository;
    private final AnswerCitationsRepository answerCitationsRepository;

    public ConversationsService(
            ConversationsRepository conversationsRepository,
            ChatMessagesRepository chatMessagesRepository,
            AnswerCitationsRepository answerCitationsRepository
    ) {
        this.conversationsRepository = conversationsRepository;
        this.chatMessagesRepository = chatMessagesRepository;
        this.answerCitationsRepository = answerCitationsRepository;
    }

    public ConversationDetailDto create(long userId, ConversationCreateRequest req) {
        String title = req.title();
        if (title == null || title.isBlank()) {
            title = "Cuộc hội thoại " + DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                    .withZone(ZoneId.systemDefault())
                    .format(Instant.now());
        }

        long id = conversationsRepository.insert(userId, title.trim());
        return conversationsRepository.findById(userId, id)
                .map(r -> new ConversationDetailDto(r.id(), r.title(), r.createdAt(), r.updatedAt()))
                .orElseThrow(() -> new IllegalStateException("Conversation not found after insert"));
    }

    public ConversationDetailDto importGuest(long userId, ImportGuestConversationRequest req) {
        if (req.history() == null || req.history().isEmpty()) {
            throw new IllegalArgumentException("Guest history is empty");
        }

        String title = req.title();
        if (title == null || title.isBlank()) {
            title = req.history().stream()
                    .filter(t -> "user".equals(t.role()))
                    .map(t -> t.content() == null ? "" : t.content().trim())
                    .filter(s -> !s.isBlank())
                    .findFirst()
                    .orElse("Guest conversation");
        }
        if (title.length() > 80) {
            title = title.substring(0, 80).trim();
        }

        long conversationId = conversationsRepository.insert(userId, title);
        req.history().stream()
                .filter(t -> "user".equals(t.role()) || "assistant".equals(t.role()) || "system".equals(t.role()))
                .filter(t -> t.content() != null && !t.content().isBlank())
                .forEach(t -> chatMessagesRepository.insertMessage(
                        conversationId,
                        t.role(),
                        t.content(),
                        null,
                        null,
                        null,
                        null
                ));

        return conversationsRepository.findById(userId, conversationId)
                .map(r -> new ConversationDetailDto(r.id(), r.title(), r.createdAt(), r.updatedAt()))
                .orElseThrow(() -> new IllegalStateException("Conversation not found after import"));
    }

    public List<ConversationSummaryDto> list(long userId) {
        return conversationsRepository.listSummaries(userId).stream()
                .map(r -> new ConversationSummaryDto(
                        r.id(),
                        r.title(),
                        r.lastMessageAt(),
                        r.messageCount(),
                        r.createdAt(),
                        r.updatedAt()
                ))
                .toList();
    }

    public ConversationDetailDto get(long userId, long conversationId) {
        return conversationsRepository.findById(userId, conversationId)
                .map(r -> new ConversationDetailDto(r.id(), r.title(), r.createdAt(), r.updatedAt()))
                .orElseThrow(() -> new NotFoundException("Conversation not found: " + conversationId));
    }

    public List<ConversationMessageDto> listMessages(long userId, long conversationId, Instant after, Instant before, int limit) {
        conversationsRepository.findById(userId, conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found: " + conversationId));

        boolean newestFirst = before != null && after == null;
        List<ChatMessagesRepository.MessageRow> rows = chatMessagesRepository.listMessages(
                conversationId,
                after,
                before,
                limit,
                newestFirst
        );

        if (newestFirst) {
            List<ChatMessagesRepository.MessageRow> reversed = rows.reversed();
            rows = reversed;
        }

        List<Long> assistantIds = rows.stream()
            .filter(r -> "assistant".equals(r.role()))
            .map(ChatMessagesRepository.MessageRow::id)
            .toList();
        var citationsByMessage = answerCitationsRepository.listByMessageIds(assistantIds);

        return rows.stream()
                .map(r -> new ConversationMessageDto(
                        r.id(),
                        r.role(),
                        r.content(),
                        r.modelName(),
                        r.promptTokens(),
                        r.completionTokens(),
                        r.latencyMs(),
                r.createdAt(),
                citationsByMessage.getOrDefault(r.id(), List.of())
                ))
                .toList();
    }

    public ConversationDetailDto update(long userId, long conversationId, ConversationUpdateRequest req) {
        if (req.archived() != null || req.pinned() != null) {
            throw new IllegalArgumentException("archived/pinned are not supported yet");
        }

        if (req.title() != null) {
            int updated = conversationsRepository.updateTitle(userId, conversationId, req.title().trim());
            if (updated == 0) {
                throw new NotFoundException("Conversation not found: " + conversationId);
            }
        }
        return get(userId, conversationId);
    }

    public void delete(long userId, long conversationId) {
        int deleted = conversationsRepository.delete(userId, conversationId);
        if (deleted == 0) {
            throw new NotFoundException("Conversation not found: " + conversationId);
        }
    }
}
