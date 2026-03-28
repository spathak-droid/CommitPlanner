package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.*;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class WeeklyPlanServiceTest {

    @Autowired private WeeklyPlanService planService;
    @Autowired private OutcomeRepository outcomeRepo;
    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        outcomeId = outcomeRepo.findAll().stream().filter(o -> o.isActive()).findFirst().orElseThrow().getId();
    }

    @Test
    void createPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 9)));
        assertNotNull(plan.id());
        assertEquals(PlanStatus.DRAFT, plan.status());
        assertEquals("user-1", plan.userId());
        assertEquals(LocalDate.of(2026, 3, 9), plan.weekStartDate());
        assertTrue(plan.commits().isEmpty());
    }

    @Test
    void duplicatePlanReturnsSamePlan() {
        var date = LocalDate.of(2026, 3, 16);
        var first = planService.createPlan(new CreateWeeklyPlanRequest(date));
        var second = planService.createPlan(new CreateWeeklyPlanRequest(date));
        assertEquals(first.id(), second.id());
    }

    @Test
    void addCommitToDraftPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 23)));
        var updated = planService.addCommit(plan.id(), new CreateCommitRequest(
                "My commit", "description", ChessPriority.MUST_DO, outcomeId, new BigDecimal("5.0")));
        assertEquals(1, updated.commits().size());
        var commit = updated.commits().get(0);
        assertEquals("My commit", commit.title());
        assertEquals(ChessPriority.MUST_DO, commit.chessPriority());
    }

    @Test
    void cannotAddCommitToLockedPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 30)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Commit", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");
        assertThrows(Exception.class, () -> planService.addCommit(plan.id(), new CreateCommitRequest(
                "Another", "desc", ChessPriority.NICE_TO_DO, outcomeId, new BigDecimal("1.0"))));
    }

    @Test
    void updateCommit() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 6)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "Original", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("3.0")));
        var commitId = withCommit.commits().get(0).id();
        var updated = planService.updateCommit(commitId, new UpdateCommitRequest(
                "Updated title", "new desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("6.0"), 0));
        assertEquals("Updated title", updated.commits().get(0).title());
        assertEquals(ChessPriority.MUST_DO, updated.commits().get(0).chessPriority());
    }

    @Test
    void deleteCommit() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 13)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "To delete", "desc", ChessPriority.NICE_TO_DO, outcomeId, new BigDecimal("1.0")));
        var commitId = withCommit.commits().get(0).id();
        planService.deleteCommit(commitId);
        var refreshed = planService.getPlan(plan.id());
        assertTrue(refreshed.commits().isEmpty());
    }

    @Test
    void getPlanById() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 20)));
        var fetched = planService.getPlan(plan.id());
        assertEquals(plan.id(), fetched.id());
    }

    @Test
    void getUserPlansReturnsAllForUser() {
        planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 27)));
        var plans = planService.getUserPlans();
        assertFalse(plans.isEmpty());
        assertTrue(plans.stream().allMatch(p -> p.userId().equals("user-1")));
    }

    @Test
    void optimisticLockVersionIncrementsOnTransition() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 5, 4)));
        int versionBeforeLock = plan.version();
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");
        // Read from DB in a fresh transaction to get the committed version
        var afterLock = planService.getPlan(plan.id());
        assertTrue(afterLock.version() > versionBeforeLock);
    }
}
