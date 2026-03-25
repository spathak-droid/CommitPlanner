package com.weeklycommit.dto.ai;

import java.util.List;

public record WeeklyDigest(
    String executiveSummary,
    List<String> highlights,
    List<String> concerns,
    List<String> suggestedTalkingPoints
) {}
