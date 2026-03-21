package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.WeeklyPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class WeeklyPlanController {

    private final WeeklyPlanService planService;

    public WeeklyPlanController(WeeklyPlanService planService) {
        this.planService = planService;
    }

    @PostMapping("/weekly-plans")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyPlanResponse createPlan(@Valid @RequestBody CreateWeeklyPlanRequest req) {
        return planService.createPlan(req);
    }

    @GetMapping("/weekly-plans/{id}")
    public WeeklyPlanResponse getPlan(@PathVariable UUID id) {
        return planService.getPlan(id);
    }

    @GetMapping("/weekly-plans/current")
    public WeeklyPlanResponse getCurrentPlan() {
        return planService.getCurrentPlan();
    }

    @GetMapping("/weekly-plans")
    public List<WeeklyPlanResponse> getUserPlans() {
        return planService.getUserPlans();
    }

    // Commits
    @PostMapping("/weekly-plans/{planId}/commits")
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyPlanResponse addCommit(@PathVariable UUID planId, @Valid @RequestBody CreateCommitRequest req) {
        return planService.addCommit(planId, req);
    }

    @PutMapping("/commits/{commitId}")
    public WeeklyPlanResponse updateCommit(@PathVariable UUID commitId, @RequestBody UpdateCommitRequest req) {
        return planService.updateCommit(commitId, req);
    }

    @DeleteMapping("/commits/{commitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommit(@PathVariable UUID commitId) {
        planService.deleteCommit(commitId);
    }

    // Reconciliation
    @PutMapping("/commits/{commitId}/reconcile")
    public WeeklyPlanResponse reconcileCommit(@PathVariable UUID commitId, @Valid @RequestBody ReconcileCommitRequest req) {
        return planService.reconcileCommit(commitId, req);
    }

    // State Machine
    @PostMapping("/weekly-plans/{planId}/transition")
    public WeeklyPlanResponse transition(@PathVariable UUID planId, @RequestParam String action) {
        return planService.transition(planId, action);
    }
}
