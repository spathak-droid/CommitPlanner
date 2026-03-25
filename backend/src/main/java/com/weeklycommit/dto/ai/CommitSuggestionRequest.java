package com.weeklycommit.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record CommitSuggestionRequest(
    @NotBlank String userInput
) {}
