package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.WeeklyPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Weekly Plans")
public class WeeklyPlanController {

    private final WeeklyPlanService planService;

    public WeeklyPlanController(WeeklyPlanService planService) {
        this.planService = planService;
    }

    @Operation(summary = "Create a new weekly plan")
    @PostMapping("/weekly-plans")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyPlanResponse createPlan(@Valid @RequestBody CreateWeeklyPlanRequest req) {
        return planService.createPlan(req);
    }

    @Operation(summary = "Get a weekly plan by ID")
    @GetMapping("/weekly-plans/{id}")
    public WeeklyPlanResponse getPlan(@PathVariable UUID id) {
        return planService.getPlan(id);
    }

    @Operation(summary = "Get the current week's plan")
    @GetMapping("/weekly-plans/current")
    public WeeklyPlanResponse getCurrentPlan() {
        return planService.getCurrentPlan();
    }

    @Operation(summary = "List all plans for the current user")
    @GetMapping("/weekly-plans")
    public List<WeeklyPlanResponse> getUserPlans() {
        return planService.getUserPlans();
    }

    // Commits
    @Operation(summary = "Add a commit to a weekly plan")
    @PostMapping("/weekly-plans/{planId}/commits")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyPlanResponse addCommit(@PathVariable UUID planId, @Valid @RequestBody CreateCommitRequest req) {
        return planService.addCommit(planId, req);
    }

    @Operation(summary = "Update a commit")
    @PutMapping("/commits/{commitId}")
    public WeeklyPlanResponse updateCommit(@PathVariable UUID commitId, @RequestBody UpdateCommitRequest req) {
        return planService.updateCommit(commitId, req);
    }

    @Operation(summary = "Delete a commit")
    @DeleteMapping("/commits/{commitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommit(@PathVariable UUID commitId) {
        planService.deleteCommit(commitId);
    }

    // Reconciliation
    @Operation(summary = "Reconcile a commit at week end")
    @PutMapping("/commits/{commitId}/reconcile")
    public WeeklyPlanResponse reconcileCommit(@PathVariable UUID commitId, @Valid @RequestBody ReconcileCommitRequest req) {
        return planService.reconcileCommit(commitId, req);
    }

    // State Machine
    @Operation(summary = "Transition plan to next lifecycle state")
    @PostMapping("/weekly-plans/{planId}/transition")
    public WeeklyPlanResponse transition(@PathVariable UUID planId, @RequestParam String action) {
        return planService.transition(planId, action);
    }
}
