package vn.history.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.history.backend.exception.RateLimitException;

import java.time.Duration;

@Service
public class LoginRateLimiter {

    private static final String MESSAGE = "Too many failed login attempts. Please try again later.";

    private final RedisRateLimiter redisRateLimiter;
    private final int maxFailedAttempts;
    private final Duration lockWindow;

    public LoginRateLimiter(
            RedisRateLimiter redisRateLimiter,
            @Value("${app.auth.login.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.auth.login.lock-minutes:15}") long lockMinutes
    ) {
        this.redisRateLimiter = redisRateLimiter;
        this.maxFailedAttempts = maxFailedAttempts;
        this.lockWindow = Duration.ofMinutes(lockMinutes);
    }

    public void assertAllowed(String clientIp) {
        if (maxFailedAttempts <= 0) {
            return;
        }
        if (redisRateLimiter.count(key(clientIp)) >= maxFailedAttempts) {
            throw new RateLimitException(MESSAGE);
        }
    }

    public void recordFailure(String clientIp) {
        if (maxFailedAttempts <= 0) {
            return;
        }
        long failures = redisRateLimiter.increment(key(clientIp), lockWindow);
        if (failures >= maxFailedAttempts) {
            throw new RateLimitException(MESSAGE);
        }
    }

    public void clear(String clientIp) {
        redisRateLimiter.clear(key(clientIp));
    }

    private String key(String clientIp) {
        String ip = clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
        return "rate:auth:login:fail:ip:" + ip;
    }
}
