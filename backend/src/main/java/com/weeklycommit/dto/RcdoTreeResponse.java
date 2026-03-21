package com.weeklycommit.dto;

import java.util.List;
import java.util.UUID;

public record RcdoTreeResponse(
    UUID id,
    String name,
    String description,
    List<DefiningObjectiveNode> definingObjectives
) {
    public record DefiningObjectiveNode(
        UUID id,
        String name,
        String description,
        List<OutcomeNode> outcomes
    ) {}

    public record OutcomeNode(
        UUID id,
        String name,
        String description,
        String measurableTarget
    ) {}
}
