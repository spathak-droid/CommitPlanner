package com.weeklycommit.dto.analytics;

import com.weeklycommit.enums.PlanStatus;

import java.time.LocalDate;
import java.util.UUID;

public record CalendarEntry(UUID planId, LocalDate weekStartDate, PlanStatus status, int commitCount, double avgCompletionPct) {}
