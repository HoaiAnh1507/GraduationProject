package vn.history.backend.service.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final ObjectMapper objectMapper;
    private final String issuer;
    private final byte[] secretBytes;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.auth.jwt-secret:}") String secret,
            @Value("${app.auth.jwt-issuer:backend}") String issuer
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("APP_AUTH_JWT_SECRET is required for auth tokens");
        }
        this.objectMapper = objectMapper;
        this.issuer = issuer == null || issuer.isBlank() ? "backend" : issuer;
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createAccessToken(long userId, String email, Instant now, Duration ttl) {
        Instant expiresAt = now.plus(ttl);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", String.valueOf(userId));
        payload.put("email", email);
        payload.put("jti", UUID.randomUUID().toString());
        payload.put("iss", issuer);
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());
        payload.put("typ", "access");

        String headerPart = base64Url(jsonBytes(header));
        String payloadPart = base64Url(jsonBytes(payload));
        String signature = sign(headerPart + "." + payloadPart);
        return headerPart + "." + payloadPart + "." + signature;
    }

    public AccessTokenClaims parseAccessToken(String token, Instant now) {
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Missing access token");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalStateException("Invalid access token format");
        }

        String headerPart = parts[0];
        String payloadPart = parts[1];
        String signaturePart = parts[2];

        String expectedSig = sign(headerPart + "." + payloadPart);
        if (!constantTimeEquals(signaturePart, expectedSig)) {
            throw new IllegalStateException("Invalid access token signature");
        }

        Map<?, ?> payload = readJson(payloadPart);
        Object typ = payload.get("typ");
        Object iss = payload.get("iss");
        Object sub = payload.get("sub");
        Object email = payload.get("email");
        Object exp = payload.get("exp");
        Object jti = payload.get("jti");

        if (typ == null || !"access".equals(typ.toString())) {
            throw new IllegalStateException("Invalid access token type");
        }
        if (iss == null || !issuer.equals(iss.toString())) {
            throw new IllegalStateException("Invalid access token issuer");
        }
        if (exp == null) {
            throw new IllegalStateException("Invalid access token expiry");
        }

        long expEpoch = Long.parseLong(exp.toString());
        if (now.getEpochSecond() >= expEpoch) {
            throw new IllegalStateException("Access token expired");
        }
        if (sub == null) {
            throw new IllegalStateException("Missing user id in access token");
        }

        long userId = Long.parseLong(sub.toString());
        String emailStr = email == null ? null : email.toString();
        String jtiStr = jti == null ? null : jti.toString();
        return new AccessTokenClaims(userId, emailStr, Instant.ofEpochSecond(expEpoch), jtiStr);
    }

    private byte[] jsonBytes(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsBytes(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to build JWT payload", e);
        }
    }

    private Map<?, ?> readJson(String base64Url) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(base64Url);
            return objectMapper.readValue(decoded, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid access token payload", e);
        }
    }

    private String base64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64Url(sig);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    public record AccessTokenClaims(long userId, String email, Instant expiresAt, String jti) {
    }
}
