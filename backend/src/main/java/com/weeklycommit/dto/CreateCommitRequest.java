package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateCommitRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 2000) String description,
    @NotNull ChessPriority chessPriority,
    @NotNull UUID outcomeId,
    @Positive @DecimalMax("40.0") BigDecimal plannedHours
) {}
