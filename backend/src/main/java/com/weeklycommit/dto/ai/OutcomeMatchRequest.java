package com.weeklycommit.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record OutcomeMatchRequest(
    @NotBlank String title,
    String description
) {}
