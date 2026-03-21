package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateCommitRequest(
    String title,
    String description,
    ChessPriority chessPriority,
    UUID outcomeId,
    BigDecimal plannedHours,
    Integer sortOrder
) {}
