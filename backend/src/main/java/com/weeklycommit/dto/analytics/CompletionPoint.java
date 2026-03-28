package com.weeklycommit.dto.analytics;

import java.time.LocalDate;

public record CompletionPoint(LocalDate weekStart, double avgCompletionPct) {}
