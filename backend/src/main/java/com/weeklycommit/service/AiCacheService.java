package com.weeklycommit.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiCacheService {

    private final Cache<String, Object> responseCache = Caffeine.newBuilder()
            .maximumSize(200)
            .expireAfterWrite(Duration.ofMinutes(15))
            .build();

    private final Cache<String, AtomicInteger> rateLimitCache = Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(Duration.ofMinutes(1))
            .build();

    @SuppressWarnings("unchecked")
    public <T> T getCached(String key, Class<T> type) {
        Object val = responseCache.getIfPresent(key);
        return type.isInstance(val) ? (T) val : null;
    }

    public void put(String key, Object value) {
        responseCache.put(key, value);
    }

    public boolean isRateLimited(String userId) {
        AtomicInteger counter = rateLimitCache.get(userId, k -> new AtomicInteger(0));
        return counter != null && counter.get() >= 20;
    }

    public void incrementRateLimit(String userId) {
        AtomicInteger counter = rateLimitCache.get(userId, k -> new AtomicInteger(0));
        if (counter != null) {
            counter.incrementAndGet();
        }
    }
}
