package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.config.AnthropicConfig;
import com.weeklycommit.dto.ai.HoursEstimateRequest;
import com.weeklycommit.dto.ai.OutcomeMatchRequest;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.exception.AiUnavailableException;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class AiServiceTest {

    @Autowired private AiService aiService;
    @Autowired private AnthropicConfig anthropicConfig;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
    }

    @Test
    void aiDisabledWhenNoApiKey() {
        assertFalse(anthropicConfig.isEnabled());
    }

    @Test
    void getStatusReflectsDisabledState() {
        var status = aiService.getStatus();
        assertFalse(status.enabled());
        assertNull(status.model());
    }

    @Test
    void matchOutcomesThrowsWhenAiDisabled() {
        var request = new OutcomeMatchRequest("Complete quarterly review", null);
        assertThrows(AiUnavailableException.class, () -> aiService.matchOutcomes(request));
    }

    @Test
    void estimateHoursThrowsWhenAiDisabled() {
        var request = new HoursEstimateRequest("Write unit tests", "Cover all service methods", "MUST_DO");
        assertThrows(AiUnavailableException.class, () -> aiService.estimateHours(request));
    }

    @Test
    void cacheServiceOperatesIndependently() {
        var cacheService = new AiCacheService();
        assertNull(cacheService.getCached("test-key", Object.class));
    }

    @Test
    void cacheServiceStoresAndRetrievesValues() {
        var cacheService = new AiCacheService();
        String value = "cached-value";
        cacheService.put("my-key", value);
        assertEquals(value, cacheService.getCached("my-key", String.class));
    }

    @Test
    void cacheServiceRateLimitStartsNotLimited() {
        var cacheService = new AiCacheService();
        assertFalse(cacheService.isRateLimited("new-user-id"));
    }

    @Test
    void cacheServiceRateLimitTriggersAfterThreshold() {
        var cacheService = new AiCacheService();
        String userId = "rate-limit-test-user";
        for (int i = 0; i < 20; i++) {
            assertFalse(cacheService.isRateLimited(userId));
            cacheService.incrementRateLimit(userId);
        }
        assertTrue(cacheService.isRateLimited(userId));
    }
}
