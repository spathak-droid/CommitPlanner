package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateCommitRequest(
    @NotBlank String title,
    String description,
    @NotNull ChessPriority chessPriority,
    @NotNull UUID outcomeId,
    BigDecimal plannedHours
) {}
