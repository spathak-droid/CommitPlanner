package com.weeklycommit.dto.analytics;

import java.math.BigDecimal;
import java.util.Map;

public record CapacityEntry(String userId, String fullName, BigDecimal totalPlannedHours, BigDecimal capacityHours, Map<String, BigDecimal> priorityBreakdown) {}
