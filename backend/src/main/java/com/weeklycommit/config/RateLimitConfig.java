package com.weeklycommit.config;

import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitConfig {

    public enum Tier {
        AI_TIER1(30, Duration.ofMinutes(1)),
        AI_TIER2(10, Duration.ofMinutes(1)),
        AI_TIER3(5, Duration.ofMinutes(1)),
        AUTH(5, Duration.ofMinutes(1));

        private final int capacity;
        private final Duration period;

        Tier(int capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, Tier tier) {
        return buckets.computeIfAbsent(key + ":" + tier.name(), k ->
                Bucket.builder()
                        .addLimit(limit -> limit
                                .capacity(tier.capacity)
                                .refillGreedy(tier.capacity, tier.period))
                        .build()
        );
    }

    public boolean tryConsume(String key, Tier tier) {
        return resolveBucket(key, tier).tryConsume(1);
    }

    public long getWaitTimeSeconds(String key, Tier tier) {
        var probe = resolveBucket(key, tier).tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return 0;
        }
        return probe.getNanosToWaitForRefill() / 1_000_000_000;
    }
}
