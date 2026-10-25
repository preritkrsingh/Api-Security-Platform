package com.platform.gateway.service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);
    private static final Duration REDIS_OP_TIMEOUT = Duration.ofMillis(300);

    private final ReactiveStringRedisTemplate redisTemplate;
    private final boolean preferRedis;
    private final ConcurrentHashMap<String, TokenBucket> inMemoryBuckets = new ConcurrentHashMap<>();

    public RateLimiterService(
            @Autowired(required = false) ReactiveStringRedisTemplate redisTemplate,
            @Value("${platform.security.rate-limiter.prefer-redis:true}") boolean preferRedis) {
        this.redisTemplate = redisTemplate;
        this.preferRedis = preferRedis;
    }

    public record RateLimitResult(
            boolean allowed,
            int limit,
            long remaining,
            long resetSeconds
    ) {}

    public Mono<RateLimitResult> tryAcquire(String apiId, int rps) {
        if (rps <= 0) {
            return Mono.just(new RateLimitResult(true, 0, 0, 0));
        }

        if (preferRedis && redisTemplate != null) {
            return tryAcquireRedis(apiId, rps)
                    .onErrorResume(e -> {
                        log.debug("[RATE_LIMIT_REDIS_FALLBACK] Redis rate limiting unavailable for '{}': {}. Falling back to in-memory.",
                                apiId, e.getMessage());
                        return Mono.just(tryAcquireInMemory(apiId, rps));
                    });
        }

        return Mono.just(tryAcquireInMemory(apiId, rps));
    }

    private Mono<RateLimitResult> tryAcquireRedis(String apiId, int rps) {
        long currentWindowSeconds = System.currentTimeMillis() / 1000L;
        String redisKey = "ratelimit:" + apiId + ":" + currentWindowSeconds;

        return redisTemplate.opsForValue().increment(redisKey)
                .flatMap(currentCount -> {
                    // Set expiration on first increment in this window
                    Mono<Boolean> expireMono = currentCount == 1L
                            ? redisTemplate.expire(redisKey, Duration.ofSeconds(2))
                            : Mono.just(true);

                    return expireMono.map(ignored -> {
                        boolean allowed = currentCount <= rps;
                        long remaining = Math.max(0, rps - currentCount);
                        long resetSeconds = 1L;
                        return new RateLimitResult(allowed, rps, remaining, resetSeconds);
                    });
                })
                .timeout(REDIS_OP_TIMEOUT);
    }

    public RateLimitResult tryAcquireInMemory(String apiId, int rps) {
        TokenBucket bucket = inMemoryBuckets.computeIfAbsent(apiId, k -> new TokenBucket(rps));
        return bucket.tryConsume(rps);
    }

    private static class TokenBucket {
        private final int capacity;
        private final double refillTokensPerMs;
        private double availableTokens;
        private long lastRefillTimestamp;

        public TokenBucket(int rps) {
            this.capacity = Math.max(rps, 5);
            this.refillTokensPerMs = (double) rps / 1000.0;
            this.availableTokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized RateLimitResult tryConsume(int rps) {
            refill();
            if (availableTokens >= 1.0) {
                availableTokens -= 1.0;
                long remaining = (long) Math.floor(availableTokens);
                return new RateLimitResult(true, rps, remaining, 1L);
            }
            return new RateLimitResult(false, rps, 0L, 1L);
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTimestamp;
            if (elapsed > 0) {
                availableTokens = Math.min(capacity, availableTokens + (elapsed * refillTokensPerMs));
                lastRefillTimestamp = now;
            }
        }
    }
}
