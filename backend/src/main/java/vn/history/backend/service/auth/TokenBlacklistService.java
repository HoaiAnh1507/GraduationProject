package vn.history.backend.service.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);

    private final StringRedisTemplate redisTemplate;
    private final JwtService jwtService;

    public TokenBlacklistService(StringRedisTemplate redisTemplate, JwtService jwtService) {
        this.redisTemplate = redisTemplate;
        this.jwtService = jwtService;
    }

    public void blacklistAccessToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return;
        }

        JwtService.AccessTokenClaims claims;
        Instant now = Instant.now();
        try {
            claims = jwtService.parseAccessToken(accessToken, now);
        } catch (RuntimeException ignored) {
            // Invalid or expired access tokens do not need to be blacklisted.
            return;
        }

        Duration ttl = Duration.between(now, claims.expiresAt());
        if (!ttl.isPositive()) {
            return;
        }

        try {
            redisTemplate.opsForValue().set(key(accessToken, claims), "1", ttl);
        } catch (RuntimeException e) {
            log.warn("Redis is unavailable; access token could not be blacklisted.", e);
        }
    }

    public boolean isBlacklisted(String accessToken, JwtService.AccessTokenClaims claims) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key(accessToken, claims)));
        } catch (RuntimeException e) {
            log.warn("Redis is unavailable; access token blacklist check is temporarily skipped.", e);
            return false;
        }
    }

    private String key(String accessToken, JwtService.AccessTokenClaims claims) {
        String id = claims.jti();
        if (id == null || id.isBlank()) {
            id = TokenHasher.sha256Hex(accessToken);
        }
        return "auth:blacklist:access:" + id;
    }
}
