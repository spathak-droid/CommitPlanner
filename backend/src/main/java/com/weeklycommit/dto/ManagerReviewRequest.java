package com.weeklycommit.dto;

import com.weeklycommit.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ManagerReviewRequest(
    @NotNull UUID weeklyPlanId,
    @NotNull ReviewStatus status,
    String feedback
) {}
