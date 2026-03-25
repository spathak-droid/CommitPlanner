package com.weeklycommit.dto.ai;

import java.util.UUID;

public record CommitSuggestionResponse(
    String suggestedTitle,
    String suggestedDescription,
    String suggestedPriority,
    UUID suggestedOutcomeId,
    String outcomeName,
    double estimatedHours,
    String rationale
) {}
