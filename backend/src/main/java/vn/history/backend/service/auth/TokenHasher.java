package vn.history.backend.service.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class TokenHasher {

    private TokenHasher() {
    }

    public static String sha256Hex(String value) {
        if (value == null) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to hash token", e);
        }
    }
}
