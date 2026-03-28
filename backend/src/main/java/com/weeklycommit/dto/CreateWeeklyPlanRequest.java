package com.weeklycommit.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateWeeklyPlanRequest(
    @NotNull LocalDate weekStartDate
) {
    public CreateWeeklyPlanRequest {
        if (weekStartDate != null && weekStartDate.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            throw new IllegalArgumentException("weekStartDate must be a Monday");
        }
    }
}
