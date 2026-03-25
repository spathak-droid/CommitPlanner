package com.weeklycommit.dto.ai;

public record HoursEstimate(
    double estimatedHours,
    double lowRange,
    double highRange,
    String rationale
) {}
