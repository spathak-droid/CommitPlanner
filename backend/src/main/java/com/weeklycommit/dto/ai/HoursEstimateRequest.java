package com.weeklycommit.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record HoursEstimateRequest(
    @NotBlank String title,
    String description,
    String chessPriority
) {}
