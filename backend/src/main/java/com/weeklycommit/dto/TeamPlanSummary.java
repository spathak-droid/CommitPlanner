package com.weeklycommit.dto;

import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.ReviewStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TeamPlanSummary(
    UUID planId,
    String userId,
    String fullName,
    LocalDate weekStartDate,
    PlanStatus status,
    boolean hasPlan,
    int totalCommits,
    int mustDoCount,
    int shouldDoCount,
    int niceToDoCount,
    BigDecimal totalPlannedHours,
    BigDecimal totalActualHours,
    Double avgCompletionPct,
    ReviewStatus reviewStatus
) {}
