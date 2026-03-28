package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.CreateWeeklyPlanRequest;
import com.weeklycommit.dto.ReconcileCommitRequest;
import com.weeklycommit.dto.WeeklyPlanResponse;
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
class StateMachineTest {

    @Autowired
    private WeeklyPlanService planService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        outcomeId = outcomeRepo.findAll().stream()
                .filter(o -> o.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private WeeklyPlanResponse createPlanWithCommit(LocalDate weekStart) {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(weekStart));
        return planService.addCommit(plan.id(), new CreateCommitRequest(
                "Test commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("4.0")
        ));
    }

    @Test
    void newPlanStartsAsDraft() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 1, 5)));
        assertEquals(PlanStatus.DRAFT, plan.status());
    }

    @Test
    void draftToLocked() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 1, 12));
        var locked = planService.transition(plan.id(), "LOCK");
        assertEquals(PlanStatus.LOCKED, locked.status());
    }

    @Test
    void cannotLockEmptyPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 1, 19)));
        assertThrows(IllegalStateException.class, () -> planService.transition(plan.id(), "LOCK"));
    }

    @Test
    void lockedToReconciling() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 1, 26));
        planService.transition(plan.id(), "LOCK");
        var reconciling = planService.transition(plan.id(), "START_RECONCILIATION");
        assertEquals(PlanStatus.RECONCILING, reconciling.status());
    }

    @Test
    void reconcilingToReconciled() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 2));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");

        var commitId = plan.commits().get(0).id();
        planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("3.5"), 80, "Done well", false
        ));

        var reconciled = planService.transition(plan.id(), "RECONCILE");
        assertEquals(PlanStatus.RECONCILED, reconciled.status());
    }

    @Test
    void cannotReconcileWithoutActuals() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 9));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        assertThrows(IllegalStateException.class, () -> planService.transition(plan.id(), "RECONCILE"));
    }

    @Test
    void reconciledToCarryForward() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 16));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");

        var commitId = plan.commits().get(0).id();
        planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("2.0"), 50, "Partial", true
        ));
        planService.transition(plan.id(), "RECONCILE");

        var cf = planService.transition(plan.id(), "CARRY_FORWARD");
        assertEquals(PlanStatus.CARRY_FORWARD, cf.status());
    }

    @Test
    void invalidTransitionThrows() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 23));
        assertThrows(IllegalStateException.class,
                () -> planService.transition(plan.id(), "START_RECONCILIATION"));
    }

    @Test
    void unlockResetsToLocked() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 3, 2));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        // UNLOCK requires manager role and resets to DRAFT
        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Maya Reynolds", UserRole.MANAGER));
        var unlocked = planService.transition(plan.id(), "UNLOCK");
        assertEquals(PlanStatus.DRAFT, unlocked.status());
    }
}
