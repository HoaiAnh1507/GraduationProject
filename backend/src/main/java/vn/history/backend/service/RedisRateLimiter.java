package vn.history.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.history.backend.exception.RateLimitException;

import java.time.Duration;

@Service
public class RedisRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimiter.class);

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void check(String key, int limit, Duration window, String message) {
        if (limit <= 0) {
            return;
        }

        long count = increment(key, window);
        if (count > limit) {
            throw new RateLimitException(message);
        }
    }

    public long increment(String key, Duration window) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            long value = count == null ? 0L : count;
            if (value == 1L) {
                redisTemplate.expire(key, window);
            }
            return value;
        } catch (RuntimeException e) {
            log.warn("Redis is unavailable; rate limit key '{}' is temporarily not enforced.", key, e);
            return 0L;
        }
    }

    public long count(String key) {
        String value;
        try {
            value = redisTemplate.opsForValue().get(key);
        } catch (RuntimeException e) {
            log.warn("Redis is unavailable; rate limit key '{}' is temporarily not enforced.", key, e);
            return 0L;
        }
        if (value == null || value.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    public void clear(String key) {
        try {
            redisTemplate.delete(key);
        } catch (RuntimeException e) {
            log.warn("Redis is unavailable; rate limit key '{}' could not be cleared.", key, e);
        }
    }
}
