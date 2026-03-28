package com.weeklycommit.dto.analytics;

import java.time.LocalDate;

public record CarryForwardPoint(LocalDate weekStart, double carryForwardPct) {}
