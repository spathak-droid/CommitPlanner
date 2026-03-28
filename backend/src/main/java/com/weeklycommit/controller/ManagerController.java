package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.ManagerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
@Tag(name = "Manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @Operation(summary = "Get team weekly plans for a given week")
    @GetMapping("/team-plans")
    public List<TeamPlanSummary> getTeamPlans(@RequestParam LocalDate weekStart) {
        return managerService.getTeamPlans(weekStart);
    }

    @Operation(summary = "Get RCDO alignment report for a given week")
    @GetMapping("/rcdo-alignment")
    public List<RcdoAlignmentResponse> getRcdoAlignment(@RequestParam LocalDate weekStart) {
        return managerService.getRcdoAlignment(weekStart);
    }

    @Operation(summary = "Submit a manager review for a weekly plan")
    @PostMapping("/reviews")
    public ResponseEntity<Void> submitReview(@Valid @RequestBody ManagerReviewRequest req) {
        managerService.submitReview(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
