package com.weeklycommit.controller;

import com.weeklycommit.dto.RcdoTreeResponse;
import com.weeklycommit.entity.DefiningObjective;
import com.weeklycommit.entity.Outcome;
import com.weeklycommit.entity.RallyCry;
import com.weeklycommit.service.RcdoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RcdoController {

    private final RcdoService rcdoService;

    public RcdoController(RcdoService rcdoService) {
        this.rcdoService = rcdoService;
    }

    @GetMapping("/rcdo/tree")
    public List<RcdoTreeResponse> getTree() {
        return rcdoService.getTree();
    }

    // Rally Cries
    @GetMapping("/rally-cries")
    public List<RallyCry> getAllRallyCries() {
        return rcdoService.getAllRallyCries();
    }

    @PostMapping("/rally-cries")
    @ResponseStatus(HttpStatus.CREATED)
    public RallyCry createRallyCry(@RequestBody Map<String, String> body) {
        return rcdoService.createRallyCry(body.get("name"), body.get("description"));
    }

    @GetMapping("/rally-cries/{id}")
    public RallyCry getRallyCry(@PathVariable UUID id) {
        return rcdoService.getRallyCry(id);
    }

    @PutMapping("/rally-cries/{id}")
    public RallyCry updateRallyCry(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return rcdoService.updateRallyCry(id, body.get("name"), body.get("description"));
    }

    @DeleteMapping("/rally-cries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRallyCry(@PathVariable UUID id) {
        rcdoService.deleteRallyCry(id);
    }

    // Defining Objectives
    @GetMapping("/rally-cries/{rallyCryId}/defining-objectives")
    public List<DefiningObjective> getDefiningObjectives(@PathVariable UUID rallyCryId) {
        return rcdoService.getDefiningObjectives(rallyCryId);
    }

    @PostMapping("/rally-cries/{rallyCryId}/defining-objectives")
    @ResponseStatus(HttpStatus.CREATED)
    public DefiningObjective createDefiningObjective(@PathVariable UUID rallyCryId, @RequestBody Map<String, String> body) {
        return rcdoService.createDefiningObjective(rallyCryId, body.get("name"), body.get("description"));
    }

    @PutMapping("/defining-objectives/{id}")
    public DefiningObjective updateDefiningObjective(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return rcdoService.updateDefiningObjective(id, body.get("name"), body.get("description"));
    }

    @DeleteMapping("/defining-objectives/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDefiningObjective(@PathVariable UUID id) {
        rcdoService.deleteDefiningObjective(id);
    }

    // Outcomes
    @GetMapping("/defining-objectives/{dobjId}/outcomes")
    public List<Outcome> getOutcomes(@PathVariable UUID dobjId) {
        return rcdoService.getOutcomes(dobjId);
    }

    @PostMapping("/defining-objectives/{dobjId}/outcomes")
    @ResponseStatus(HttpStatus.CREATED)
    public Outcome createOutcome(@PathVariable UUID dobjId, @RequestBody Map<String, String> body) {
        return rcdoService.createOutcome(dobjId, body.get("name"), body.get("description"), body.get("measurableTarget"));
    }

    @PutMapping("/outcomes/{id}")
    public Outcome updateOutcome(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return rcdoService.updateOutcome(id, body.get("name"), body.get("description"), body.get("measurableTarget"));
    }

    @DeleteMapping("/outcomes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOutcome(@PathVariable UUID id) {
        rcdoService.deleteOutcome(id);
    }
}
