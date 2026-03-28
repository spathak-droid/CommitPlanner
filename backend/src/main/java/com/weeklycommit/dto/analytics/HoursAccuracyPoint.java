package com.weeklycommit.dto.analytics;

import java.math.BigDecimal;
import java.util.UUID;

public record HoursAccuracyPoint(UUID commitId, String title, BigDecimal plannedHours, BigDecimal actualHours) {}
