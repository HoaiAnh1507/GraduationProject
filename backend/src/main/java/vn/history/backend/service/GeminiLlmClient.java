package vn.history.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Google AI Studio (Gemini API) client using the Generative Language REST API.
 *
 * Properties:
 * - app.llm.enabled=true
 * - app.llm.provider=gemini
 * - app.llm.base-url=https://generativelanguage.googleapis.com
 * - app.llm.api-key=... (AI Studio API key)
 * - app.llm.model=gemini-1.5-flash (or any model you enabled)
 */
@Component
@ConditionalOnProperty(name = "app.llm.provider", havingValue = "gemini")
public class GeminiLlmClient implements LlmClient {

    private final boolean enabled;
    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final Double temperature;

    private final RestClient restClient;

    public GeminiLlmClient(
            @Value("${app.llm.enabled:${APP_LLM_ENABLED:false}}") boolean enabled,
            @Value("${app.llm.base-url:${APP_LLM_BASE_URL:https://generativelanguage.googleapis.com}}") String baseUrl,
            @Value("${app.llm.api-key:${APP_LLM_API_KEY:}}") String apiKey,
            @Value("${app.llm.model:${APP_LLM_MODEL:}}") String model,
            @Value("${app.llm.temperature:${APP_LLM_TEMPERATURE:0.2}}") Double temperature
    ) {
        this.enabled = enabled;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
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
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing app.llm.api-key (Google AI Studio API key)");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalStateException("Missing app.llm.model (e.g. gemini-1.5-flash)");
        }

        // POST /v1beta/models/{model}:generateContent?key=...
        String path = "/v1beta/models/{model}:generateContent";
        String uri = UriComponentsBuilder.fromPath(path)
                .queryParam("key", apiKey)
                .buildAndExpand(Map.of("model", model))
                .toUriString();

        Map<String, Object> req = new LinkedHashMap<>();

        // system_instruction is supported in the Gemini API.
        req.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt == null ? "" : systemPrompt))
        ));

        req.put("contents", List.of(
                Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userPrompt == null ? "" : userPrompt))
                )
        ));

        req.put("generationConfig", Map.of(
                "temperature", temperature
        ));

        JsonNode root = restClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            throw new IllegalStateException("Empty Gemini response");
        }

        if (root.has("error")) {
            String msg = root.path("error").path("message").asText("Gemini API error");
            throw new IllegalStateException(msg);
        }

        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (JsonNode p : parts) {
            String t = p.path("text").asText("");
            if (!t.isBlank()) {
                if (!sb.isEmpty()) sb.append("\n");
                sb.append(t);
            }
        }
        return sb.toString().trim();
    }
}
