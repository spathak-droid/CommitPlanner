package com.weeklycommit.dto.analytics;

import java.time.LocalDate;

public record CoverageTrendPoint(LocalDate weekStart, double alignmentRatePct) {}
