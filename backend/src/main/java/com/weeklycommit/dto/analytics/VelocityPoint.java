package com.weeklycommit.dto.analytics;

import java.time.LocalDate;

public record VelocityPoint(LocalDate weekStart, int completedCount, int totalCount) {}
