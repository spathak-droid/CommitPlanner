package com.weeklycommit.controller;

import com.weeklycommit.dto.CreateTemplateRequest;
import com.weeklycommit.dto.TemplateResponse;
import com.weeklycommit.service.CommitTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
@Tag(name = "Templates")
public class CommitTemplateController {

    private final CommitTemplateService templateService;

    public CommitTemplateController(CommitTemplateService templateService) {
        this.templateService = templateService;
    }

    @Operation(summary = "List all templates for the current user")
    @GetMapping
    public List<TemplateResponse> getTemplates() {
        return templateService.getTemplates();
    }

    @Operation(summary = "Save a weekly plan as a reusable template")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateResponse saveAsTemplate(@Valid @RequestBody CreateTemplateRequest req) {
        return templateService.saveAsTemplate(req.planId(), req.name());
    }

    @Operation(summary = "Apply a template to a weekly plan")
    @PostMapping("/{id}/apply")
    public void applyTemplate(@PathVariable UUID id, @RequestParam UUID planId) {
        templateService.applyTemplate(id, planId);
    }

    @Operation(summary = "Delete a template")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTemplate(@PathVariable UUID id) {
        templateService.deleteTemplate(id);
    }
}
