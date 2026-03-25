package com.weeklycommit.dto.ai;

import java.util.List;
import java.util.UUID;

public record AlignmentSuggestion(
    UUID outcomeId,
    String outcomeName,
    String rallyCryName,
    String reason,
    int priority
) {}
