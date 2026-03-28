package com.weeklycommit.controller;

import com.weeklycommit.dto.ai.*;
import com.weeklycommit.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Assistance")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @Operation(summary = "Get AI service availability status")
    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> getStatus() {
        return ResponseEntity.ok(aiService.getStatus());
    }

    // Tier 1
    @Operation(summary = "Match commit text to RCDO outcomes")
    @PostMapping("/match-outcomes")
    public ResponseEntity<List<OutcomeMatchResult>> matchOutcomes(@Valid @RequestBody OutcomeMatchRequest request) {
        return ResponseEntity.ok(aiService.matchOutcomes(request));
    }

    @Operation(summary = "Estimate hours for a commit")
    @PostMapping("/estimate-hours")
    public ResponseEntity<HoursEstimate> estimateHours(@Valid @RequestBody HoursEstimateRequest request) {
        return ResponseEntity.ok(aiService.estimateHours(request));
    }

    // Tier 2
    @Operation(summary = "Generate AI commit text suggestions")
    @PostMapping("/suggest-commit")
    public ResponseEntity<CommitSuggestionResponse> suggestCommit(@Valid @RequestBody CommitSuggestionRequest request) {
        return ResponseEntity.ok(aiService.suggestCommit(request));
    }

    @Operation(summary = "Get AI assistance for reconciling a commit")
    @GetMapping("/reconciliation-assist/{commitId}")
    public ResponseEntity<ReconciliationAssist> getReconciliationAssist(@PathVariable UUID commitId) {
        return ResponseEntity.ok(aiService.getReconciliationAssist(commitId));
    }

    @Operation(summary = "Get AI insight for a manager review")
    @GetMapping("/review-insight/{planId}")
    public ResponseEntity<ReviewInsight> getReviewInsight(@PathVariable UUID planId) {
        return ResponseEntity.ok(aiService.getReviewInsight(planId));
    }

    // Tier 3
    @Operation(summary = "Get AI RCDO alignment suggestions")
    @GetMapping("/alignment-suggestions")
    public ResponseEntity<List<AlignmentSuggestion>> getAlignmentSuggestions(
            @RequestParam(required = false) String weekStart) {
        return ResponseEntity.ok(aiService.getAlignmentSuggestions(weekStart));
    }

    @Operation(summary = "Get AI weekly digest summary")
    @GetMapping("/weekly-digest")
    public ResponseEntity<WeeklyDigest> getWeeklyDigest(@RequestParam String weekStart) {
        return ResponseEntity.ok(aiService.getWeeklyDigest(weekStart));
    }
}
