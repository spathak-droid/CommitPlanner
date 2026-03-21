package com.weeklycommit.service;

import com.weeklycommit.dto.*;
import com.weeklycommit.entity.AppUser;
import com.weeklycommit.entity.ManagerReview;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.ReviewStatus;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.repository.ManagerReviewRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ManagerService {

    private final WeeklyPlanRepository planRepo;
    private final ManagerReviewRepository reviewRepo;
    private final RcdoService rcdoService;
    private final AppUserRepository userRepo;
    private final ManagerAssignmentRepository assignmentRepo;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;

    public ManagerService(
        WeeklyPlanRepository planRepo,
        ManagerReviewRepository reviewRepo,
        RcdoService rcdoService,
        AppUserRepository userRepo,
        ManagerAssignmentRepository assignmentRepo,
        AuthorizationService authorizationService,
        NotificationService notificationService
    ) {
        this.planRepo = planRepo;
        this.reviewRepo = reviewRepo;
        this.rcdoService = rcdoService;
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.authorizationService = authorizationService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<TeamPlanSummary> getTeamPlans(LocalDate weekStart) {
        authorizationService.requireManager();
        var managerId = authorizationService.currentUserId();
        var monday = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var teamMembers = assignmentRepo.findByManagerUserId(managerId).stream()
            .map(assignment -> assignment.getMember())
            .filter(AppUser::isActive)
            .toList();
        var userIds = teamMembers.stream().map(AppUser::getUserId).toList();
        var plans = userIds.isEmpty() ? List.<WeeklyPlan>of() : planRepo.findByUserIdInAndWeekStartDate(userIds, monday);

        return teamMembers.stream().map(member -> {
            var plan = plans.stream().filter(candidate -> candidate.getUserId().equals(member.getUserId())).findFirst().orElse(null);
            return toSummary(member, plan, monday);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<RcdoAlignmentResponse> getRcdoAlignment(LocalDate weekStart) {
        authorizationService.requireManager();
        var managerId = authorizationService.currentUserId();
        var monday = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var userIds = assignmentRepo.findByManagerUserId(managerId).stream()
            .map(assignment -> assignment.getMember().getUserId())
            .toList();
        List<WeeklyPlan> plans = userIds.isEmpty() ? List.of() : planRepo.findByUserIdInAndWeekStartDate(userIds, monday);

        var tree = rcdoService.getTree();
        return tree.stream().map(rc -> {
            var objectives = rc.definingObjectives().stream().map(dobj -> {
                var outcomes = dobj.outcomes().stream().map(outcome -> {
                    var commits = new ArrayList<RcdoAlignmentResponse.CommitSummary>();
                    for (var plan : plans) {
                        for (var commit : plan.getCommits()) {
                            if (commit.getOutcome().getId().equals(outcome.id())) {
                                commits.add(new RcdoAlignmentResponse.CommitSummary(
                                    commit.getId(),
                                    commit.getTitle(),
                                    plan.getUserId(),
                                    commit.getChessPriority().name(),
                                    commit.getCompletionPct()
                                ));
                            }
                        }
                    }
                    return new RcdoAlignmentResponse.OutcomeAlignment(
                        outcome.id(), outcome.name(), commits.size(), commits
                    );
                }).toList();
                return new RcdoAlignmentResponse.ObjectiveAlignment(dobj.id(), dobj.name(), outcomes);
            }).toList();
            return new RcdoAlignmentResponse(rc.id(), rc.name(), objectives);
        }).toList();
    }

    public ManagerReview submitReview(ManagerReviewRequest req) {
        var reviewerId = authorizationService.currentUserId();
        var plan = planRepo.findById(req.weeklyPlanId())
            .orElseThrow(() -> new EntityNotFoundException("Weekly plan not found: " + req.weeklyPlanId()));
        var reviewer = userRepo.findByUserIdAndActiveTrue(reviewerId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown reviewer: " + reviewerId));

        if (reviewer.getRole() != UserRole.MANAGER) {
            throw new IllegalArgumentException("Only managers can submit reviews");
        }
        if (assignmentRepo.findByManagerUserIdAndMemberUserId(reviewerId, plan.getUserId()).isEmpty()) {
            throw new IllegalArgumentException("You do not have access to review this plan");
        }

        if (plan.getStatus() != PlanStatus.RECONCILED) {
            throw new IllegalStateException("Can only review plans in RECONCILED status. Current status: " + plan.getStatus());
        }

        // If plan has gone back through the lifecycle (unlock → re-lock → re-reconcile),
        // allow replacing the old review. Only block if plan is still RECONCILED with an existing review.
        var existingReview = reviewRepo.findByWeeklyPlanId(req.weeklyPlanId());
        if (existingReview.isPresent()) {
            var old = existingReview.get();
            if (plan.getStatus() == PlanStatus.RECONCILED) {
                // Same reconciliation cycle — block duplicate
                throw new IllegalStateException("This plan has already been reviewed as " + old.getStatus() + ". Unlock the plan to allow re-review.");
            }
            // Stale review from a previous cycle — clean it up
            reviewRepo.delete(old);
            reviewRepo.flush();
        }

        var review = new ManagerReview();
        review.setWeeklyPlan(plan);
        review.setReviewerId(reviewerId);
        review.setStatus(req.status());
        review.setFeedback(req.feedback());
        review.setReviewedAt(java.time.LocalDateTime.now());

        var savedReview = reviewRepo.save(review);

        // Notify the plan owner
        if (req.status() == ReviewStatus.FLAGGED) {
            var title = "Your weekly plan was flagged for discussion";
            var message = req.feedback() != null && !req.feedback().isBlank()
                ? "Feedback: " + req.feedback()
                : "Your manager has flagged your plan. Please review and discuss.";
            notificationService.send(plan.getUserId(), "REVIEW_FLAGGED", title, message);
        } else if (req.status() == ReviewStatus.APPROVED) {
            notificationService.send(plan.getUserId(), "REVIEW_APPROVED",
                "Your weekly plan was approved",
                req.feedback() != null && !req.feedback().isBlank() ? "Note: " + req.feedback() : "Great work this week!");
        }

        return savedReview;
    }

    private TeamPlanSummary toSummary(AppUser user, WeeklyPlan plan, LocalDate monday) {
        if (plan == null) {
            return new TeamPlanSummary(
                null,
                user.getUserId(),
                user.getFullName(),
                monday,
                null,
                false,
                0,
                0,
                0,
                0,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0.0,
                null
            );
        }
        var commits = plan.getCommits();
        var totalPlanned = commits.stream()
            .map(WeeklyCommit::getPlannedHours)
            .filter(h -> h != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        var totalActual = commits.stream()
            .map(WeeklyCommit::getActualHours)
            .filter(h -> h != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        var avgCompletion = commits.stream()
            .map(WeeklyCommit::getCompletionPct)
            .filter(p -> p != null)
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);

        // Only show review for RECONCILED/CARRY_FORWARD plans
        var showReview = plan.getStatus() == PlanStatus.RECONCILED
            || plan.getStatus() == PlanStatus.CARRY_FORWARD;
        var reviewStatus = showReview
            ? reviewRepo.findByWeeklyPlanId(plan.getId()).map(ManagerReview::getStatus).orElse(null)
            : null;

        return new TeamPlanSummary(
            plan.getId(),
            plan.getUserId(),
            user.getFullName(),
            plan.getWeekStartDate(),
            plan.getStatus(),
            true,
            commits.size(),
            (int) commits.stream().filter(c -> c.getChessPriority() == ChessPriority.MUST_DO).count(),
            (int) commits.stream().filter(c -> c.getChessPriority() == ChessPriority.SHOULD_DO).count(),
            (int) commits.stream().filter(c -> c.getChessPriority() == ChessPriority.NICE_TO_DO).count(),
            totalPlanned,
            totalActual,
            avgCompletion,
            reviewStatus
        );
    }
}
