package com.weeklycommit.controller;

import com.weeklycommit.dto.ai.*;
import com.weeklycommit.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> getStatus() {
        return ResponseEntity.ok(aiService.getStatus());
    }

    // Tier 1
    @PostMapping("/match-outcomes")
    public ResponseEntity<List<OutcomeMatchResult>> matchOutcomes(@Valid @RequestBody OutcomeMatchRequest request) {
        return ResponseEntity.ok(aiService.matchOutcomes(request));
    }

    @PostMapping("/estimate-hours")
    public ResponseEntity<HoursEstimate> estimateHours(@Valid @RequestBody HoursEstimateRequest request) {
        return ResponseEntity.ok(aiService.estimateHours(request));
    }

    // Tier 2
    @PostMapping("/suggest-commit")
    public ResponseEntity<CommitSuggestionResponse> suggestCommit(@Valid @RequestBody CommitSuggestionRequest request) {
        return ResponseEntity.ok(aiService.suggestCommit(request));
    }

    @GetMapping("/reconciliation-assist/{commitId}")
    public ResponseEntity<ReconciliationAssist> getReconciliationAssist(@PathVariable UUID commitId) {
        return ResponseEntity.ok(aiService.getReconciliationAssist(commitId));
    }

    @GetMapping("/review-insight/{planId}")
    public ResponseEntity<ReviewInsight> getReviewInsight(@PathVariable UUID planId) {
        return ResponseEntity.ok(aiService.getReviewInsight(planId));
    }

    // Tier 3
    @GetMapping("/alignment-suggestions")
    public ResponseEntity<List<AlignmentSuggestion>> getAlignmentSuggestions(
            @RequestParam(required = false) String weekStart) {
        return ResponseEntity.ok(aiService.getAlignmentSuggestions(weekStart));
    }

    @GetMapping("/weekly-digest")
    public ResponseEntity<WeeklyDigest> getWeeklyDigest(@RequestParam String weekStart) {
        return ResponseEntity.ok(aiService.getWeeklyDigest(weekStart));
    }
}
