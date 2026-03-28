package com.weeklycommit.controller;

import com.weeklycommit.dto.analytics.*;
import com.weeklycommit.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Operation(summary = "Team velocity over time")
    @GetMapping("/velocity")
    public List<VelocityPoint> getVelocity(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return analyticsService.getVelocity(from, to);
    }

    @Operation(summary = "Completion rate trend")
    @GetMapping("/completion")
    public List<CompletionPoint> getCompletion(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return analyticsService.getCompletion(from, to);
    }

    @Operation(summary = "Hours estimation accuracy")
    @GetMapping("/hours-accuracy")
    public List<HoursAccuracyPoint> getHoursAccuracy(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return analyticsService.getHoursAccuracy(from, to);
    }

    @Operation(summary = "Carry-forward rate trend")
    @GetMapping("/carry-forward-rate")
    public List<CarryForwardPoint> getCarryForwardRate(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return analyticsService.getCarryForwardRate(from, to);
    }

    @Operation(summary = "RCDO coverage trend")
    @GetMapping("/rcdo-coverage")
    public List<CoverageTrendPoint> getRcdoCoverage(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        return analyticsService.getCoverageTrend(from, to);
    }

    @Operation(summary = "Team capacity for a week")
    @GetMapping("/capacity")
    public List<CapacityEntry> getCapacity(@RequestParam LocalDate weekStart) {
        return analyticsService.getCapacity(weekStart);
    }
}
