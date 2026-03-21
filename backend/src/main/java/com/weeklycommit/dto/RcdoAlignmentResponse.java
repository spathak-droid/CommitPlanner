package com.weeklycommit.dto;

import java.util.List;
import java.util.UUID;

public record RcdoAlignmentResponse(
    UUID rallyCryId,
    String rallyCryName,
    List<ObjectiveAlignment> objectives
) {
    public record ObjectiveAlignment(
        UUID objectiveId,
        String objectiveName,
        List<OutcomeAlignment> outcomes
    ) {}

    public record OutcomeAlignment(
        UUID outcomeId,
        String outcomeName,
        int commitCount,
        List<CommitSummary> commits
    ) {}

    public record CommitSummary(
        UUID commitId,
        String title,
        String userId,
        String chessPriority,
        Integer completionPct
    ) {}
}
