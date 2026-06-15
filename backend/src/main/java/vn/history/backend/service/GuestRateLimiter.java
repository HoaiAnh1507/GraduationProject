package vn.history.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class GuestRateLimiter {

    private final RedisRateLimiter redisRateLimiter;
    private final int ipLimit;
    private final int sessionLimit;
    private final Duration window = Duration.ofMinutes(1);

    public GuestRateLimiter(
            RedisRateLimiter redisRateLimiter,
            @Value("${app.guest.rate-limit.ip-per-minute:10}") int ipLimit,
            @Value("${app.guest.rate-limit.session-per-minute:4}") int sessionLimit
    ) {
        this.redisRateLimiter = redisRateLimiter;
        this.ipLimit = ipLimit;
        this.sessionLimit = sessionLimit;
    }

    public void check(String clientIp, String sessionId) {
        redisRateLimiter.check(
                "rate:chat:guest:ip:" + safeKey(clientIp),
                ipLimit,
                window,
                "Guest IP rate limit exceeded. Please try again later."
        );
        redisRateLimiter.check(
                "rate:chat:guest:session:" + safeKey(sessionId),
                sessionLimit,
                window,
                "Guest session rate limit exceeded. Please try again later."
        );
    }

    private String safeKey(String value) {
        return value == null || value.isBlank() ? "unknown" : value.trim();
    }
}
