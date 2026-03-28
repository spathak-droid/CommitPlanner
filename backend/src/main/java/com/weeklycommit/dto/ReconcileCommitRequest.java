package com.weeklycommit.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ReconcileCommitRequest(
    @NotNull @Positive BigDecimal actualHours,
    @NotNull @Min(0) @Max(100) Integer completionPct,
    @Size(max = 2000) String reconciliationNotes,
    boolean carryForward
) {}
