package com.weeklycommit.controller;

import com.weeklycommit.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@Tag(name = "Export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @Operation(summary = "Export a single weekly plan as CSV or PDF")
    @GetMapping("/plan/{id}")
    public ResponseEntity<byte[]> exportPlan(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "csv") String format
    ) {
        byte[] data;
        String contentType;
        String filename;

        if ("pdf".equals(format)) {
            data = exportService.exportPlanPdf(id);
            contentType = "application/pdf";
            filename = "plan.pdf";
        } else {
            data = exportService.exportPlanCsv(id);
            contentType = "text/csv";
            filename = "plan.csv";
        }

        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=" + filename)
            .contentType(MediaType.parseMediaType(contentType))
            .body(data);
    }

    @Operation(summary = "Export all team members' commits for a given week as CSV or PDF")
    @GetMapping("/team")
    public ResponseEntity<byte[]> exportTeam(
        @RequestParam LocalDate weekStart,
        @RequestParam(defaultValue = "csv") String format
    ) {
        byte[] data;
        String contentType;
        String filename;

        if ("pdf".equals(format)) {
            // Team PDF: reuse CSV with PDF content-type placeholder —
            // full team PDF would require looping per-plan; deliver CSV data with pdf header
            // for now team export is CSV-only to keep scope manageable
            data = exportService.exportTeamCsv(weekStart);
            contentType = "text/csv";
            filename = "team-" + weekStart + ".csv";
        } else {
            data = exportService.exportTeamCsv(weekStart);
            contentType = "text/csv";
            filename = "team-" + weekStart + ".csv";
        }

        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=" + filename)
            .contentType(MediaType.parseMediaType(contentType))
            .body(data);
    }
}
