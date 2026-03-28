package com.weeklycommit.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health")
public class HealthController {

    @Operation(summary = "Check service health")
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "weekly-commit-api");
    }
}
