package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.*;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.ReviewStatus;
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
class ManagerServiceTest {

    @Autowired private WeeklyPlanService planService;
    @Autowired private ManagerService managerService;
    @Autowired private OutcomeRepository outcomeRepo;
    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        outcomeId = outcomeRepo.findAll().stream().filter(o -> o.isActive()).findFirst().orElseThrow().getId();
    }

    @Test
    void getTeamPlansShowsAssignedMembers() {
        var testWeek = LocalDate.of(2026, 7, 6);
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(testWeek));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Manager test commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("3.0")));

        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Taylor Smith", UserRole.MANAGER));
        var teamPlans = managerService.getTeamPlans(testWeek);
        assertNotNull(teamPlans);
        assertFalse(teamPlans.isEmpty());
    }

    @Test
    void getRcdoAlignmentShowsCoverage() {
        var testWeek = LocalDate.of(2026, 7, 13);
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(testWeek));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Alignment commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");

        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Taylor Smith", UserRole.MANAGER));
        var alignment = managerService.getRcdoAlignment(testWeek);
        assertNotNull(alignment);
        assertFalse(alignment.isEmpty());
    }

    @Test
    void submitReviewApproved() {
        var testWeek = LocalDate.of(2026, 7, 20);
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(testWeek));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Review test", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        var refreshed = planService.getPlan(plan.id());
        planService.reconcileCommit(refreshed.commits().get(0).id(), new ReconcileCommitRequest(
                new BigDecimal("2.0"), 100, "Done", false));
        planService.transition(plan.id(), "RECONCILE");

        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Taylor Smith", UserRole.MANAGER));
        managerService.submitReview(new ManagerReviewRequest(plan.id(), ReviewStatus.APPROVED, "Good work"));

        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var reviewed = planService.getPlan(plan.id());
        assertEquals(ReviewStatus.APPROVED, reviewed.reviewStatus());
    }

    @Test
    void submitReviewFlagged() {
        var testWeek = LocalDate.of(2026, 7, 27);
        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(testWeek));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Flag test", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        var refreshed = planService.getPlan(plan.id());
        planService.reconcileCommit(refreshed.commits().get(0).id(), new ReconcileCommitRequest(
                new BigDecimal("1.0"), 20, "Struggled", false));
        planService.transition(plan.id(), "RECONCILE");

        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Taylor Smith", UserRole.MANAGER));
        managerService.submitReview(new ManagerReviewRequest(plan.id(), ReviewStatus.FLAGGED, "Needs discussion"));

        AuthContextHolder.set(new AuthenticatedUser("user-1", "Jordan Kim", UserRole.IC));
        var reviewed = planService.getPlan(plan.id());
        assertEquals(ReviewStatus.FLAGGED, reviewed.reviewStatus());
    }
}
