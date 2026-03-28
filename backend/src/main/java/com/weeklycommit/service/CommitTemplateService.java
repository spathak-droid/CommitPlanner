package com.weeklycommit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.TemplateResponse;
import com.weeklycommit.entity.CommitTemplate;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.repository.CommitTemplateRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class CommitTemplateService {

    private final CommitTemplateRepository templateRepo;
    private final WeeklyPlanRepository planRepo;
    private final WeeklyPlanService weeklyPlanService;
    private final AuthorizationService authorizationService;
    private final ObjectMapper objectMapper;

    public CommitTemplateService(
        CommitTemplateRepository templateRepo,
        WeeklyPlanRepository planRepo,
        WeeklyPlanService weeklyPlanService,
        AuthorizationService authorizationService,
        ObjectMapper objectMapper
    ) {
        this.templateRepo = templateRepo;
        this.planRepo = planRepo;
        this.weeklyPlanService = weeklyPlanService;
        this.authorizationService = authorizationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> getTemplates() {
        var userId = authorizationService.currentUserId();
        return templateRepo.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(t -> new TemplateResponse(t.getId(), t.getName(), t.getCommits(), t.getCreatedAt()))
            .toList();
    }

    public TemplateResponse saveAsTemplate(UUID planId, String name) {
        var plan = planRepo.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Weekly plan not found: " + planId));
        authorizationService.requireCanAccessUser(plan.getUserId());

        var commitsJson = serializeCommits(plan.getCommits());

        var template = new CommitTemplate();
        template.setUserId(authorizationService.currentUserId());
        template.setName(name);
        template.setCommits(commitsJson);
        template = templateRepo.save(template);

        return new TemplateResponse(template.getId(), template.getName(), template.getCommits(), template.getCreatedAt());
    }

    public void applyTemplate(UUID templateId, UUID planId) {
        var userId = authorizationService.currentUserId();
        var template = templateRepo.findById(templateId)
            .orElseThrow(() -> new EntityNotFoundException("Template not found: " + templateId));

        if (!template.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You do not have access to this template");
        }

        var commitEntries = deserializeCommits(template.getCommits());
        for (var entry : commitEntries) {
            var title = (String) entry.get("title");
            var description = (String) entry.get("description");
            var chessPriorityStr = (String) entry.get("chessPriority");
            var outcomeIdStr = (String) entry.get("outcomeId");
            var plannedHoursVal = entry.get("plannedHours");

            if (title == null || outcomeIdStr == null || chessPriorityStr == null) {
                continue; // skip malformed entries
            }

            var outcomeId = UUID.fromString(outcomeIdStr);
            var chessPriority = ChessPriority.valueOf(chessPriorityStr);
            BigDecimal plannedHours = null;
            if (plannedHoursVal != null) {
                plannedHours = new BigDecimal(plannedHoursVal.toString());
            }

            var req = new CreateCommitRequest(title, description, chessPriority, outcomeId, plannedHours);
            weeklyPlanService.addCommit(planId, req);
        }
    }

    public void deleteTemplate(UUID templateId) {
        var userId = authorizationService.currentUserId();
        var template = templateRepo.findById(templateId)
            .orElseThrow(() -> new EntityNotFoundException("Template not found: " + templateId));

        if (!template.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You do not have access to this template");
        }

        templateRepo.delete(template);
    }

    private String serializeCommits(List<WeeklyCommit> commits) {
        try {
            var list = commits.stream().map(c -> Map.of(
                "title", c.getTitle() != null ? c.getTitle() : "",
                "description", c.getDescription() != null ? c.getDescription() : "",
                "chessPriority", c.getChessPriority().name(),
                "outcomeId", c.getOutcome().getId().toString(),
                "plannedHours", c.getPlannedHours() != null ? c.getPlannedHours().toString() : ""
            )).toList();
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize commits", e);
        }
    }

    private List<Map<String, Object>> deserializeCommits(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize template commits", e);
        }
    }
}
