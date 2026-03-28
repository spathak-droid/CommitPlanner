package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.*;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
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
class ReconciliationTest {

    @Autowired private WeeklyPlanService planService;
    @Autowired private OutcomeRepository outcomeRepo;
    @Autowired private WeeklyPlanRepository planRepo;
    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("ic-product", "Avery Brooks", UserRole.IC));
        outcomeId = outcomeRepo.findAll().stream().filter(o -> o.isActive()).findFirst().orElseThrow().getId();
    }

    private WeeklyPlanResponse createReconcilingPlan(LocalDate weekStart) {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(weekStart));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Task A", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("4.0")));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Task B", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");
        return planService.transition(plan.id(), "START_RECONCILIATION");
    }

    @Test
    void reconcileCommitSetsActuals() {
        var plan = createReconcilingPlan(LocalDate.of(2026, 5, 11));
        var commitId = plan.commits().get(0).id();
        var updated = planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("3.5"), 90, "Almost done", false));
        var commit = updated.commits().stream().filter(c -> c.id().equals(commitId)).findFirst().orElseThrow();
        assertEquals(new BigDecimal("3.5"), commit.actualHours());
        assertEquals(90, commit.completionPct());
        assertEquals("Almost done", commit.reconciliationNotes());
        assertFalse(commit.carryForward());
    }

    @Test
    void cannotReconcileInDraftState() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 5, 18)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "Draft commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")));
        var commitId = withCommit.commits().get(0).id();
        assertThrows(Exception.class, () -> planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("1.0"), 50, "notes", false)));
    }

    @Test
    void carryForwardCreatesNextWeekPlan() {
        var weekStart = LocalDate.of(2026, 7, 6);
        var plan = createReconcilingPlan(weekStart);

        planService.reconcileCommit(plan.commits().get(0).id(), new ReconcileCommitRequest(
                new BigDecimal("4.0"), 100, "Done", false));
        planService.reconcileCommit(plan.commits().get(1).id(), new ReconcileCommitRequest(
                new BigDecimal("1.0"), 30, "Incomplete", true));

        planService.transition(plan.id(), "RECONCILE");
        planService.transition(plan.id(), "CARRY_FORWARD");

        var nextWeek = weekStart.plusWeeks(1);
        var nextPlanEntity = planRepo.findByUserIdAndWeekStartDate("ic-product", nextWeek);
        assertTrue(nextPlanEntity.isPresent());
        assertEquals(PlanStatus.DRAFT, nextPlanEntity.get().getStatus());
        var nextPlan = planService.getPlan(nextPlanEntity.get().getId());
        assertEquals(1, nextPlan.commits().size());
        assertTrue(nextPlan.commits().get(0).title().contains("[CF]"));
    }

    @Test
    void carryForwardWithNoItemsMarked() {
        var plan = createReconcilingPlan(LocalDate.of(2026, 6, 1));
        for (var commit : plan.commits()) {
            planService.reconcileCommit(commit.id(), new ReconcileCommitRequest(
                    new BigDecimal("3.0"), 100, "Complete", false));
        }
        planService.transition(plan.id(), "RECONCILE");
        var cf = planService.transition(plan.id(), "CARRY_FORWARD");
        assertEquals(PlanStatus.CARRY_FORWARD, cf.status());

        var nextWeek = LocalDate.of(2026, 6, 8);
        var nextPlan = planRepo.findByUserIdAndWeekStartDate("ic-product", nextWeek);
        assertFalse(nextPlan.isPresent());
    }
}
