package com.weeklycommit.dto.ai;

import java.util.List;

public record ReviewInsight(
    List<String> patterns,
    List<String> riskSignals,
    String suggestedFeedback,
    String overallAssessment
) {}
