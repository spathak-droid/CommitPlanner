package com.weeklycommit.dto;

import com.weeklycommit.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ManagerReviewRequest(
    @NotNull UUID weeklyPlanId,
    @NotNull ReviewStatus status,
    @Size(max = 2000) String feedback
) {}
