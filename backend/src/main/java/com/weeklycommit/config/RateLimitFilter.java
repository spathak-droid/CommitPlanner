package com.weeklycommit.config;

import com.weeklycommit.security.AuthContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

@Component
@Order(2)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    private final Environment environment;

    private static final Map<String, RateLimitConfig.Tier> PATH_TIERS = Map.ofEntries(
            Map.entry("/api/ai/match-outcomes", RateLimitConfig.Tier.AI_TIER1),
            Map.entry("/api/ai/estimate-hours", RateLimitConfig.Tier.AI_TIER1),
            Map.entry("/api/ai/suggest-commit", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/reconciliation-assist", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/review-insight", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/alignment-suggestions", RateLimitConfig.Tier.AI_TIER3),
            Map.entry("/api/ai/weekly-digest", RateLimitConfig.Tier.AI_TIER3),
            Map.entry("/api/auth/login", RateLimitConfig.Tier.AUTH)
    );

    public RateLimitFilter(RateLimitConfig rateLimitConfig, Environment environment) {
        this.rateLimitConfig = rateLimitConfig;
        this.environment = environment;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Disable rate limiting in test profile to avoid interference with integration tests
        if (Arrays.asList(environment.getActiveProfiles()).contains("test")) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        RateLimitConfig.Tier tier = null;
        for (var entry : PATH_TIERS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                tier = entry.getValue();
                break;
            }
        }

        if (tier == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key;
        if (tier == RateLimitConfig.Tier.AUTH) {
            key = request.getRemoteAddr();
        } else {
            var user = AuthContextHolder.get();
            key = user != null ? user.userId() : request.getRemoteAddr();
        }

        if (!rateLimitConfig.tryConsume(key, tier)) {
            long waitSeconds = rateLimitConfig.getWaitTimeSeconds(key, tier);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, waitSeconds)));
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Rate limit exceeded\",\"code\":\"RATE_LIMITED\",\"retryAfterSeconds\":" + Math.max(1, waitSeconds) + "}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
