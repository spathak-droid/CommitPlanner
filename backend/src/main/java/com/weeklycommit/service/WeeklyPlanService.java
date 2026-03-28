package com.weeklycommit.service;

import com.weeklycommit.dto.*;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.repository.ManagerReviewRepository;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.repository.WeeklyCommitRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class WeeklyPlanService {

    private final WeeklyPlanRepository planRepo;
    private final WeeklyCommitRepository commitRepo;
    private final OutcomeRepository outcomeRepo;
    private final AppUserRepository userRepo;
    private final ManagerReviewRepository reviewRepo;
    private final AuthorizationService authorizationService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final ManagerAssignmentRepository assignmentRepo;

    public WeeklyPlanService(
        WeeklyPlanRepository planRepo,
        WeeklyCommitRepository commitRepo,
        OutcomeRepository outcomeRepo,
        AppUserRepository userRepo,
        ManagerReviewRepository reviewRepo,
        AuthorizationService authorizationService,
        AuditService auditService,
        NotificationService notificationService,
        ManagerAssignmentRepository assignmentRepo
    ) {
        this.planRepo = planRepo;
        this.commitRepo = commitRepo;
        this.outcomeRepo = outcomeRepo;
        this.userRepo = userRepo;
        this.reviewRepo = reviewRepo;
        this.authorizationService = authorizationService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.assignmentRepo = assignmentRepo;
    }

    public WeeklyPlanResponse createPlan(CreateWeeklyPlanRequest req) {
        var weekStart = req.weekStartDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var userId = authorizationService.currentUserId();

        userRepo.findByUserIdAndActiveTrue(userId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown or inactive user: " + userId));

        var existing = planRepo.findByUserIdAndWeekStartDate(userId, weekStart);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        var plan = new WeeklyPlan();
        plan.setUserId(userId);
        plan.setWeekStartDate(weekStart);
        plan = planRepo.save(plan);
        auditService.log("WEEKLY_PLAN", plan.getId(), "CREATE", Map.of("weekStartDate", plan.getWeekStartDate().toString(), "userId", plan.getUserId()));
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public WeeklyPlanResponse getPlan(UUID planId) {
        var plan = findPlan(planId);
        authorizationService.requireCanAccessUser(plan.getUserId());
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public WeeklyPlanResponse getCurrentPlan() {
        var userId = authorizationService.currentUserId();
        var weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var plan = planRepo.findByUserIdAndWeekStartDate(userId, weekStart)
            .orElseThrow(() -> new EntityNotFoundException("No plan found for current week"));
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public List<WeeklyPlanResponse> getUserPlans() {
        var userId = authorizationService.currentUserId();
        return planRepo.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    // Commit CRUD
    public WeeklyPlanResponse addCommit(UUID planId, CreateCommitRequest req) {
        var plan = findPlan(planId);
        authorizationService.requireCanAccessUser(plan.getUserId());
        if (plan.getStatus() != PlanStatus.DRAFT) {
            throw new IllegalStateException("Can only add commits to DRAFT plans");
        }

        var outcome = outcomeRepo.findById(req.outcomeId())
            .orElseThrow(() -> new EntityNotFoundException("Outcome not found: " + req.outcomeId()));
        if (!outcome.isActive()) {
            throw new IllegalArgumentException("Cannot link commits to inactive outcomes");
        }
        if (req.plannedHours() != null && req.plannedHours().signum() < 0) {
            throw new IllegalArgumentException("Planned hours must be non-negative");
        }

        var commit = new WeeklyCommit();
        commit.setWeeklyPlan(plan);
        commit.setTitle(req.title());
        commit.setDescription(req.description());
        commit.setChessPriority(req.chessPriority());
        commit.setOutcome(outcome);
        commit.setPlannedHours(req.plannedHours());
        commit.setSortOrder(plan.getCommits().size());

        plan.getCommits().add(commit);
        plan = planRepo.save(plan);
        var savedCommit = plan.getCommits().stream()
            .filter(c -> c.getTitle().equals(req.title()))
            .reduce((first, second) -> second)
            .orElse(commit);
        auditService.log("COMMIT", savedCommit.getId(), "CREATE", Map.of("title", savedCommit.getTitle()));
        return toResponse(plan);
    }

    public WeeklyPlanResponse updateCommit(UUID commitId, UpdateCommitRequest req) {
        var commit = commitRepo.findById(commitId)
            .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));
        authorizationService.requireCanAccessUser(commit.getWeeklyPlan().getUserId());

        if (commit.getWeeklyPlan().getStatus() != PlanStatus.DRAFT) {
            throw new IllegalStateException("Can only edit commits in DRAFT plans");
        }

        if (req.title() != null) commit.setTitle(req.title());
        if (req.description() != null) commit.setDescription(req.description());
        if (req.chessPriority() != null) commit.setChessPriority(req.chessPriority());
        if (req.outcomeId() != null) {
            var outcome = outcomeRepo.findById(req.outcomeId())
                .orElseThrow(() -> new EntityNotFoundException("Outcome not found: " + req.outcomeId()));
            if (!outcome.isActive()) {
                throw new IllegalArgumentException("Cannot link commits to inactive outcomes");
            }
            commit.setOutcome(outcome);
        }
        if (req.plannedHours() != null) {
            if (req.plannedHours().signum() < 0) {
                throw new IllegalArgumentException("Planned hours must be non-negative");
            }
            commit.setPlannedHours(req.plannedHours());
        }
        if (req.sortOrder() != null) commit.setSortOrder(req.sortOrder());

        commitRepo.save(commit);
        return toResponse(commit.getWeeklyPlan());
    }

    public void deleteCommit(UUID commitId) {
        var commit = commitRepo.findById(commitId)
            .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));
        authorizationService.requireCanAccessUser(commit.getWeeklyPlan().getUserId());

        if (commit.getWeeklyPlan().getStatus() != PlanStatus.DRAFT) {
            throw new IllegalStateException("Can only delete commits from DRAFT plans");
        }

        auditService.log("COMMIT", commit.getId(), "DELETE", Map.of("title", commit.getTitle()));
        commitRepo.delete(commit);
    }

    // Reconciliation
    public WeeklyPlanResponse reconcileCommit(UUID commitId, ReconcileCommitRequest req) {
        var commit = commitRepo.findById(commitId)
            .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));
        authorizationService.requireCanAccessUser(commit.getWeeklyPlan().getUserId());

        if (commit.getWeeklyPlan().getStatus() != PlanStatus.RECONCILING) {
            throw new IllegalStateException("Can only reconcile commits in RECONCILING plans");
        }

        commit.setActualHours(req.actualHours());
        commit.setCompletionPct(req.completionPct());
        commit.setReconciliationNotes(req.reconciliationNotes());
        commit.setCarryForward(req.carryForward());
        commitRepo.save(commit);
        auditService.log("COMMIT", commit.getId(), "RECONCILE", Map.of("actualHours", req.actualHours().toString(), "completionPct", req.completionPct().toString()));

        return toResponse(commit.getWeeklyPlan());
    }

    // State Machine Transitions
    public WeeklyPlanResponse transition(UUID planId, String action) {
        var plan = findPlan(planId);
        authorizationService.requireCanAccessUser(plan.getUserId());
        var oldStatus = plan.getStatus().name();
        var targetStatus = switch (action.toUpperCase()) {
            case "LOCK" -> PlanStatus.LOCKED;
            case "UNLOCK" -> {
                authorizationService.requireManager();
                yield PlanStatus.DRAFT;
            }
            case "START_RECONCILIATION" -> PlanStatus.RECONCILING;
            case "RECONCILE" -> PlanStatus.RECONCILED;
            case "CARRY_FORWARD" -> PlanStatus.CARRY_FORWARD;
            default -> throw new IllegalArgumentException("Unknown action: " + action);
        };

        if (!plan.getStatus().canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                "Cannot transition from " + plan.getStatus() + " to " + targetStatus);
        }

        // Validate transition preconditions
        switch (targetStatus) {
            case LOCKED -> {
                if (plan.getCommits().isEmpty()) {
                    throw new IllegalStateException("Cannot lock a plan with no commits");
                }
            }
            case RECONCILED -> {
                var unreconciled = plan.getCommits().stream()
                    .anyMatch(c -> c.getActualHours() == null || c.getCompletionPct() == null);
                if (unreconciled) {
                    throw new IllegalStateException("All commits must have actual hours and completion % before reconciling");
                }
            }
            default -> {}
        }

        plan.setStatus(targetStatus);

        // On unlock: clear existing review so it can be re-reviewed after re-reconciliation
        if (targetStatus == PlanStatus.DRAFT) {
            reviewRepo.findByWeeklyPlanId(planId).ifPresent(r -> {
                reviewRepo.delete(r);
                reviewRepo.flush();
            });
            // Also clear reconciliation data so contributor starts fresh
            plan.getCommits().forEach(c -> {
                c.setActualHours(null);
                c.setCompletionPct(null);
                c.setReconciliationNotes(null);
                c.setCarryForward(false);
            });
        }

        plan = planRepo.save(plan);
        auditService.log("WEEKLY_PLAN", plan.getId(), "TRANSITION", Map.of("from", oldStatus, "to", plan.getStatus().name()));

        // Auto-trigger notifications on state transitions
        if (targetStatus == PlanStatus.LOCKED) {
            // Notify manager that IC locked their plan
            var assignments = assignmentRepo.findByMemberUserId(plan.getUserId());
            var userName = userRepo.findByUserIdAndActiveTrue(plan.getUserId())
                .map(u -> u.getFullName())
                .orElse(plan.getUserId());
            for (var assignment : assignments) {
                notificationService.send(assignment.getManager().getUserId(), "PLAN_LOCKED",
                    userName + " locked their week of " + plan.getWeekStartDate(),
                    "Plan is ready for review");
            }
        }

        // Handle carry forward: create next week's plan with incomplete items
        if (targetStatus == PlanStatus.CARRY_FORWARD) {
            long cfCount = plan.getCommits().stream().filter(WeeklyCommit::isCarryForward).count();
            if (cfCount > 0) {
                notificationService.sendSystem(plan.getUserId(), "SYSTEM",
                    cfCount + " items carried forward to " + plan.getWeekStartDate().plusWeeks(1),
                    "Items marked for carry-forward have been moved to next week");
            }
            createCarryForwardPlan(plan);
        }

        return toResponse(plan);
    }

    private void createCarryForwardPlan(WeeklyPlan sourcePlan) {
        var nextWeekStart = sourcePlan.getWeekStartDate().plusWeeks(1);

        // Only create if next week plan doesn't exist
        if (planRepo.findByUserIdAndWeekStartDate(sourcePlan.getUserId(), nextWeekStart).isPresent()) {
            return;
        }

        var carriedCommits = sourcePlan.getCommits().stream()
            .filter(WeeklyCommit::isCarryForward)
            .toList();

        if (carriedCommits.isEmpty()) return;

        var newPlan = new WeeklyPlan();
        newPlan.setUserId(sourcePlan.getUserId());
        newPlan.setWeekStartDate(nextWeekStart);
        newPlan = planRepo.save(newPlan);

        for (int i = 0; i < carriedCommits.size(); i++) {
            var src = carriedCommits.get(i);
            var newCommit = new WeeklyCommit();
            newCommit.setWeeklyPlan(newPlan);
            newCommit.setTitle(src.getTitle());
            newCommit.setDescription(src.getDescription());
            newCommit.setCarriedFromCommitId(src.getId());
            newCommit.setChessPriority(src.getChessPriority());
            newCommit.setOutcome(src.getOutcome());
            newCommit.setPlannedHours(src.getPlannedHours());
            newCommit.setSortOrder(i);
            newPlan.getCommits().add(newCommit);
        }

        planRepo.save(newPlan);
    }

    private WeeklyPlan findPlan(UUID planId) {
        return planRepo.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Weekly plan not found: " + planId));
    }

    private WeeklyPlanResponse toResponse(WeeklyPlan plan) {
        var commits = plan.getCommits().stream().map(c -> {
            var outcome = c.getOutcome();
            var dobj = outcome.getDefiningObjective();
            var rc = dobj.getRallyCry();
            String carriedFromWeek = null;
            if (c.getCarriedFromCommitId() != null) {
                carriedFromWeek = commitRepo.findById(c.getCarriedFromCommitId())
                    .map(orig -> orig.getWeeklyPlan().getWeekStartDate().toString())
                    .orElse(null);
            }
            return new WeeklyPlanResponse.CommitResponse(
                c.getId(),
                c.getTitle(),
                c.getDescription(),
                c.getChessPriority(),
                outcome.getId(),
                outcome.getName(),
                rc.getName(),
                dobj.getName(),
                c.getPlannedHours(),
                c.getActualHours(),
                c.getCompletionPct(),
                c.getReconciliationNotes(),
                c.isCarryForward(),
                c.getSortOrder(),
                carriedFromWeek
            );
        }).toList();

        // Only show review for plans that have been through reconciliation — never for DRAFT/LOCKED
        var showReview = plan.getStatus() == PlanStatus.RECONCILED
            || plan.getStatus() == PlanStatus.CARRY_FORWARD;
        var review = showReview ? reviewRepo.findByWeeklyPlanId(plan.getId()).orElse(null) : null;

        return new WeeklyPlanResponse(
            plan.getId(),
            plan.getUserId(),
            plan.getWeekStartDate(),
            plan.getStatus(),
            review != null ? review.getStatus() : null,
            review != null ? review.getFeedback() : null,
            plan.getVersion(),
            commits,
            plan.getCreatedAt(),
            plan.getUpdatedAt()
        );
    }
}
