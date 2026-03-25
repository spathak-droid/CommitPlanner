package com.weeklycommit.dto.ai;

import java.util.UUID;

public record OutcomeMatchResult(
    UUID outcomeId,
    String outcomeName,
    String rallyCryName,
    String definingObjectiveName,
    double confidence,
    String rationale
) {}
