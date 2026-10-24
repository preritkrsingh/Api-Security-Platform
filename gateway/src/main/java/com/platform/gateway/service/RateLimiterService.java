package com.platform.gateway.service;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RateLimiterService {

    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public boolean tryAcquire(String apiId, int rps) {
        if (rps <= 0) {
            return true;
        }
        TokenBucket bucket = buckets.computeIfAbsent(apiId, k -> new TokenBucket(rps));
        return bucket.tryConsume();
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

        public synchronized boolean tryConsume() {
            refill();
            if (availableTokens >= 1.0) {
                availableTokens -= 1.0;
                return true;
            }
            return false;
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
