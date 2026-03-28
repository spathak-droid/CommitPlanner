package com.weeklycommit.service;

import com.weeklycommit.dto.analytics.*;
import com.weeklycommit.entity.AppUser;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final WeeklyPlanRepository planRepo;
    private final WeeklyCommitRepository commitRepo;
    private final ManagerAssignmentRepository assignmentRepo;
    private final OutcomeRepository outcomeRepo;
    private final AppUserRepository userRepo;
    private final AuthorizationService authorizationService;

    public AnalyticsService(
        WeeklyPlanRepository planRepo,
        WeeklyCommitRepository commitRepo,
        ManagerAssignmentRepository assignmentRepo,
        OutcomeRepository outcomeRepo,
        AppUserRepository userRepo,
        AuthorizationService authorizationService
    ) {
        this.planRepo = planRepo;
        this.commitRepo = commitRepo;
        this.assignmentRepo = assignmentRepo;
        this.outcomeRepo = outcomeRepo;
        this.userRepo = userRepo;
        this.authorizationService = authorizationService;
    }

    private List<String> getTeamMemberIds() {
        var managerId = authorizationService.currentUserId();
        return assignmentRepo.findByManagerUserId(managerId).stream()
            .map(a -> a.getMember().getUserId())
            .toList();
    }

    private List<WeeklyPlan> getTeamPlans(LocalDate from, LocalDate to) {
        var memberIds = getTeamMemberIds();
        if (memberIds.isEmpty()) return List.of();
        return planRepo.findByUserIdInAndWeekStartDateBetween(memberIds, from, to);
    }

    private Map<LocalDate, List<WeeklyCommit>> groupCommitsByWeek(List<WeeklyPlan> plans) {
        return plans.stream()
            .flatMap(p -> p.getCommits().stream().map(c -> Map.entry(p.getWeekStartDate(), c)))
            .collect(Collectors.groupingBy(
                Map.Entry::getKey,
                TreeMap::new,
                Collectors.mapping(Map.Entry::getValue, Collectors.toList())
            ));
    }

    public List<VelocityPoint> getVelocity(LocalDate from, LocalDate to) {
        authorizationService.requireManager();
        var plans = getTeamPlans(from, to);
        var byWeek = groupCommitsByWeek(plans);

        return byWeek.entrySet().stream()
            .map(e -> {
                var commits = e.getValue();
                int completed = (int) commits.stream()
                    .filter(c -> c.getCompletionPct() != null && c.getCompletionPct() >= 80)
                    .count();
                return new VelocityPoint(e.getKey(), completed, commits.size());
            })
            .toList();
    }

    public List<CompletionPoint> getCompletion(LocalDate from, LocalDate to) {
        authorizationService.requireManager();
        var plans = getTeamPlans(from, to);
        var byWeek = groupCommitsByWeek(plans);

        return byWeek.entrySet().stream()
            .map(e -> {
                var commits = e.getValue();
                double avg = commits.stream()
                    .mapToInt(c -> c.getCompletionPct() != null ? c.getCompletionPct() : 0)
                    .average()
                    .orElse(0.0);
                return new CompletionPoint(e.getKey(), avg);
            })
            .toList();
    }

    public List<HoursAccuracyPoint> getHoursAccuracy(LocalDate from, LocalDate to) {
        authorizationService.requireManager();
        var plans = getTeamPlans(from, to);

        return plans.stream()
            .flatMap(p -> p.getCommits().stream())
            .filter(c -> c.getPlannedHours() != null && c.getActualHours() != null)
            .map(c -> new HoursAccuracyPoint(c.getId(), c.getTitle(), c.getPlannedHours(), c.getActualHours()))
            .toList();
    }

    public List<CarryForwardPoint> getCarryForwardRate(LocalDate from, LocalDate to) {
        authorizationService.requireManager();
        var plans = getTeamPlans(from, to);
        var byWeek = groupCommitsByWeek(plans);

        return byWeek.entrySet().stream()
            .map(e -> {
                var commits = e.getValue();
                if (commits.isEmpty()) return new CarryForwardPoint(e.getKey(), 0.0);
                long cfCount = commits.stream().filter(WeeklyCommit::isCarryForward).count();
                double pct = (double) cfCount / commits.size() * 100.0;
                return new CarryForwardPoint(e.getKey(), pct);
            })
            .toList();
    }

    public List<CoverageTrendPoint> getCoverageTrend(LocalDate from, LocalDate to) {
        authorizationService.requireManager();
        var plans = getTeamPlans(from, to);
        long totalActiveOutcomes = outcomeRepo.findAll().stream()
            .filter(o -> o.isActive())
            .count();

        if (totalActiveOutcomes == 0) return List.of();

        // Group plans by week
        var plansByWeek = plans.stream()
            .collect(Collectors.groupingBy(WeeklyPlan::getWeekStartDate, TreeMap::new, Collectors.toList()));

        return plansByWeek.entrySet().stream()
            .map(e -> {
                long distinctOutcomes = e.getValue().stream()
                    .flatMap(p -> p.getCommits().stream())
                    .map(c -> c.getOutcome().getId())
                    .distinct()
                    .count();
                double pct = (double) distinctOutcomes / totalActiveOutcomes * 100.0;
                return new CoverageTrendPoint(e.getKey(), pct);
            })
            .toList();
    }

    public List<CapacityEntry> getCapacity(LocalDate weekStart) {
        authorizationService.requireManager();
        var memberIds = getTeamMemberIds();
        if (memberIds.isEmpty()) return List.of();

        var plans = planRepo.findByUserIdInAndWeekStartDate(memberIds, weekStart);
        var planByUser = plans.stream()
            .collect(Collectors.toMap(WeeklyPlan::getUserId, p -> p, (a, b) -> a));

        return memberIds.stream()
            .map(userId -> {
                var user = userRepo.findByUserIdAndActiveTrue(userId).orElse(null);
                if (user == null) return null;
                var plan = planByUser.get(userId);
                var commits = plan != null ? plan.getCommits() : List.<WeeklyCommit>of();

                var totalPlanned = commits.stream()
                    .map(WeeklyCommit::getPlannedHours)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                var capacityHours = new BigDecimal("40");

                var priorityBreakdown = new LinkedHashMap<String, BigDecimal>();
                for (var priority : com.weeklycommit.enums.ChessPriority.values()) {
                    var sum = commits.stream()
                        .filter(c -> c.getChessPriority() == priority)
                        .map(WeeklyCommit::getPlannedHours)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    priorityBreakdown.put(priority.name(), sum);
                }

                return new CapacityEntry(userId, user.getFullName(), totalPlanned, capacityHours, priorityBreakdown);
            })
            .filter(Objects::nonNull)
            .toList();
    }
}
