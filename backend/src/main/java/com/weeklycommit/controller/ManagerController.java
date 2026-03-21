package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.ManagerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/team-plans")
    public List<TeamPlanSummary> getTeamPlans(@RequestParam LocalDate weekStart) {
        return managerService.getTeamPlans(weekStart);
    }

    @GetMapping("/rcdo-alignment")
    public List<RcdoAlignmentResponse> getRcdoAlignment(@RequestParam LocalDate weekStart) {
        return managerService.getRcdoAlignment(weekStart);
    }

    @PostMapping("/reviews")
    public ResponseEntity<Void> submitReview(@Valid @RequestBody ManagerReviewRequest req) {
        managerService.submitReview(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
