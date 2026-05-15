package vn.history.backend.service.llm;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.llm.provider", havingValue = "openai", matchIfMissing = true)
public class OpenAiCompatibleLlmClient implements LlmClient {

    private final boolean enabled;
    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final String chatPath;
    private final Double temperature;

    private final RestClient restClient;

    public OpenAiCompatibleLlmClient(
            @Value("${app.llm.enabled:${APP_LLM_ENABLED:false}}") boolean enabled,
            @Value("${app.llm.base-url:${APP_LLM_BASE_URL:}}") String baseUrl,
            @Value("${app.llm.api-key:${APP_LLM_API_KEY:}}") String apiKey,
            @Value("${app.llm.model:${APP_LLM_MODEL:}}") String model,
            @Value("${app.llm.chat-path:${APP_LLM_CHAT_PATH:/v1/chat/completions}}") String chatPath,
            @Value("${app.llm.temperature:${APP_LLM_TEMPERATURE:0.2}}") Double temperature
    ) {
        this.enabled = enabled;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
        this.chatPath = chatPath;
        this.temperature = temperature;

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl == null ? "" : baseUrl)
                .build();
    }

    @Override
    public String chat(String systemPrompt, String userPrompt) {
        if (!enabled) {
            throw new IllegalStateException("LLM is disabled. Set app.llm.enabled=true and configure app.llm.*");
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("Missing app.llm.base-url");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing app.llm.api-key");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalStateException("Missing app.llm.model");
        }

        Map<String, Object> req = new LinkedHashMap<>();
        req.put("model", model);
        req.put("temperature", temperature);
        req.put("stream", false);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        );
        req.put("messages", messages);

        JsonNode root = restClient.post()
                .uri(chatPath)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            throw new IllegalStateException("Empty LLM response");
        }

        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        String content = contentNode.isMissingNode() ? "" : contentNode.asText("");
        return content == null ? "" : content.trim();
    }
}
