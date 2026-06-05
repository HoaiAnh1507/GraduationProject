package vn.history.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.history.backend.exception.RateLimitException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GuestRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int ipLimit;
    private final int sessionLimit;
    private final Duration window;
    private final Clock clock;

    @Autowired
    public GuestRateLimiter(
            @Value("${app.guest.rate-limit.ip-per-minute:30}") int ipLimit,
            @Value("${app.guest.rate-limit.session-per-minute:12}") int sessionLimit
    ) {
        this(ipLimit, sessionLimit, Duration.ofMinutes(1), Clock.systemUTC());
    }

    GuestRateLimiter(int ipLimit, int sessionLimit, Duration window, Clock clock) {
        this.ipLimit = ipLimit;
        this.sessionLimit = sessionLimit;
        this.window = window;
        this.clock = clock;
    }

    public void check(String clientIp, String sessionId) {
        cleanupExpired();
        consume("ip:" + safeKey(clientIp), ipLimit);
        consume("session:" + safeKey(sessionId), sessionLimit);
    }

    private void consume(String key, int limit) {
        if (limit <= 0) return;
        Instant now = clock.instant();
        Bucket bucket = buckets.compute(key, (_k, existing) -> {
            if (existing == null || !existing.expiresAt.isAfter(now)) {
                return new Bucket(1, now.plus(window));
            }
            return new Bucket(existing.count + 1, existing.expiresAt);
        });
        if (bucket.count > limit) {
            throw new RateLimitException("Guest rate limit exceeded. Please try again later.");
        }
    }

    private void cleanupExpired() {
        Instant now = clock.instant();
        Iterator<Map.Entry<String, Bucket>> it = buckets.entrySet().iterator();
        while (it.hasNext()) {
            if (!it.next().getValue().expiresAt.isAfter(now)) {
                it.remove();
            }
        }
    }

    private String safeKey(String value) {
        return value == null || value.isBlank() ? "unknown" : value.trim();
    }

    private record Bucket(int count, Instant expiresAt) {
    }
}
