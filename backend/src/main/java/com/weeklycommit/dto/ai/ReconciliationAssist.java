package com.weeklycommit.dto.ai;

public record ReconciliationAssist(
    int suggestedCompletionPct,
    String suggestedNotes,
    boolean suggestCarryForward,
    String rationale
) {}
