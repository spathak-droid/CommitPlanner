package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.ReviewStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record WeeklyPlanResponse(
    UUID id,
    String userId,
    LocalDate weekStartDate,
    PlanStatus status,
    ReviewStatus reviewStatus,
    String reviewFeedback,
    int version,
    List<CommitResponse> commits,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CommitResponse(
        UUID id,
        String title,
        String description,
        ChessPriority chessPriority,
        UUID outcomeId,
        String outcomeName,
        String rallyCryName,
        String definingObjectiveName,
        BigDecimal plannedHours,
        BigDecimal actualHours,
        Integer completionPct,
        String reconciliationNotes,
        boolean carryForward,
        int sortOrder,
        String carriedFromWeek
    ) {}
}
