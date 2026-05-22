package vn.history.backend.service.embedding;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import vn.history.backend.exception.UpstreamServiceException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class HuggingFaceEmbeddingClient implements EmbeddingClient {

    private final RestClient restClient;
    private final String token;
    private final String embeddingUrl;
    private final int embeddingDim;
    private final boolean waitForModel;

    public HuggingFaceEmbeddingClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.hf.token:}") String token,
            @Value("${app.hf.embedding-url:}") String embeddingUrl,
            @Value("${app.hf.embedding-dim:1024}") int embeddingDim,
            @Value("${app.hf.wait-for-model:true}") boolean waitForModel
    ) {
        this.restClient = restClientBuilder.build();
        this.token = token;
        this.embeddingUrl = embeddingUrl;
        this.embeddingDim = embeddingDim;
        this.waitForModel = waitForModel;
    }

    @Override
    public List<Double> embed(String text) {
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("Query text is empty");
        }
        if (!StringUtils.hasText(embeddingUrl)) {
            throw new IllegalStateException("Missing config: app.hf.embedding-url");
        }
        if (!StringUtils.hasText(token)) {
            throw new IllegalStateException("Missing config: app.hf.token (set HF_TOKEN in .env or environment)");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("inputs", text);
        if (waitForModel) {
            body.put("options", Map.of("wait_for_model", true));
        }

        try {
            JsonNode root = restClient.post()
                    .uri(embeddingUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String payload;
                        try {
                            payload = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                        } catch (IOException ex) {
                            payload = "";
                        }
                        throw new UpstreamServiceException("HuggingFace embedding failed: HTTP " + res.getStatusCode().value() + " " + payload);
                    })
                    .body(JsonNode.class);

            if (root == null) {
                throw new UpstreamServiceException("HuggingFace embedding failed: empty response body");
            }

            List<Double> embedding = parseEmbedding(root);
            if (embedding.size() != embeddingDim) {
                throw new UpstreamServiceException("HuggingFace embedding dimension mismatch: expected " + embeddingDim + ", got " + embedding.size());
            }
            return embedding;
        } catch (UpstreamServiceException e) {
            throw e;
        } catch (RestClientResponseException e) {
            String bodyText = "";
            try {
                bodyText = e.getResponseBodyAsString(StandardCharsets.UTF_8);
            } catch (Exception ignored) {
            }
            if (bodyText == null) bodyText = "";
            if (bodyText.length() > 2000) {
                bodyText = bodyText.substring(0, 2000) + "...";
            }
            throw new UpstreamServiceException(
                    "HuggingFace embedding failed: HTTP " + e.getStatusCode().value() + " " + bodyText,
                    e
            );
        } catch (ResourceAccessException e) {
            throw new UpstreamServiceException(
                    "HuggingFace embedding failed: network error: " + safeMsg(e),
                    e
            );
        } catch (RestClientException e) {
            throw new UpstreamServiceException(
                    "HuggingFace embedding failed: client error: " + safeMsg(e),
                    e
            );
        } catch (Exception e) {
            throw new UpstreamServiceException(
                    "HuggingFace embedding call failed: " + e.getClass().getSimpleName() + ": " + safeMsg(e),
                    e
            );
        }
    }

    private List<Double> parseEmbedding(JsonNode root) {
        if (root.isObject() && root.hasNonNull("error")) {
            throw new UpstreamServiceException("HuggingFace embedding failed: " + root.get("error").asText(""));
        }
        if (root.isObject() && root.hasNonNull("detail")) {
            throw new UpstreamServiceException("HuggingFace embedding failed: " + root.get("detail").asText(""));
        }
        if (!root.isArray()) {
            throw new UpstreamServiceException("HuggingFace embedding returned unexpected JSON shape");
        }
        if (root.isEmpty()) {
            throw new UpstreamServiceException("HuggingFace embedding returned empty array");
        }

        JsonNode first = root.get(0);
        if (first != null && first.isNumber()) {
            return parse1d(root);
        }
        if (first != null && first.isArray()) {
            // HF feature-extraction can return:
            // - 2D: [tokens][dim]
            // - 3D: [batch][tokens][dim]
            JsonNode firstInner = first.size() > 0 ? first.get(0) : null;
            if (firstInner != null && firstInner.isNumber()) {
                return meanPool2d(root);
            }
            if (firstInner != null && firstInner.isArray()) {
                return meanPool2d(first);
            }
            throw new UpstreamServiceException("HuggingFace embedding returned unexpected nested array shape");
        }

        throw new UpstreamServiceException("HuggingFace embedding returned unexpected array elements");
    }

    private List<Double> parse1d(JsonNode arr) {
        List<Double> out = new ArrayList<>(arr.size());
        for (JsonNode v : arr) {
            if (!v.isNumber()) {
                throw new UpstreamServiceException("HuggingFace embedding 1D array contains non-number element");
            }
            out.add(v.doubleValue());
        }
        return out;
    }

    private List<Double> meanPool2d(JsonNode tokenVectors) {
        int tokenCount = tokenVectors.size();
        if (tokenCount == 0) {
            throw new UpstreamServiceException("HuggingFace embedding returned empty token vectors");
        }

        JsonNode firstToken = tokenVectors.get(0);
        if (firstToken == null || !firstToken.isArray() || firstToken.size() == 0) {
            throw new UpstreamServiceException("HuggingFace embedding returned invalid token vector");
        }

        int dim = firstToken.size();
        double[] sum = new double[dim];

        for (JsonNode tokenVec : tokenVectors) {
            if (tokenVec == null || !tokenVec.isArray() || tokenVec.size() != dim) {
                throw new UpstreamServiceException("HuggingFace embedding returned inconsistent token vector dimensions");
            }
            for (int i = 0; i < dim; i++) {
                JsonNode v = tokenVec.get(i);
                if (v == null || !v.isNumber()) {
                    throw new UpstreamServiceException("HuggingFace embedding token vector contains non-number element");
                }
                sum[i] += v.doubleValue();
            }
        }

        List<Double> out = new ArrayList<>(dim);
        for (int i = 0; i < dim; i++) {
            out.add(sum[i] / tokenCount);
        }
        return out;
    }

    private String bearerToken(String token) {
        String t = token.trim();
        if (t.regionMatches(true, 0, "bearer ", 0, "bearer ".length())) {
            return token;
        }
        return "Bearer " + t;
    }

    private String safeMsg(Throwable t) {
        if (t == null) return "";

        String msg = t.getMessage();
        if (StringUtils.hasText(msg)) return msg;

        Throwable cause = t.getCause();
        while (cause != null) {
            String cmsg = cause.getMessage();
            if (StringUtils.hasText(cmsg)) return cmsg;
            cause = cause.getCause();
        }

        return "";
    }
}
