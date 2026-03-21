package com.weeklycommit.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ReconcileCommitRequest(
    @NotNull BigDecimal actualHours,
    @NotNull @Min(0) @Max(100) Integer completionPct,
    String reconciliationNotes,
    boolean carryForward
) {}
