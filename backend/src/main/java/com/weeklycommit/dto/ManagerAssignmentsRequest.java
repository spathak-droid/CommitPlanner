package com.weeklycommit.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ManagerAssignmentsRequest(
    @NotNull List<String> memberIds
) {}
