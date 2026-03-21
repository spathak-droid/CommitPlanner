package com.weeklycommit.service;

import com.weeklycommit.dto.RcdoTreeResponse;
import com.weeklycommit.entity.DefiningObjective;
import com.weeklycommit.entity.Outcome;
import com.weeklycommit.entity.RallyCry;
import com.weeklycommit.repository.DefiningObjectiveRepository;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.repository.RallyCryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RcdoService {

    private final RallyCryRepository rallyCryRepo;
    private final DefiningObjectiveRepository doRepo;
    private final OutcomeRepository outcomeRepo;
    private final AuthorizationService authorizationService;

    public RcdoService(
        RallyCryRepository rallyCryRepo,
        DefiningObjectiveRepository doRepo,
        OutcomeRepository outcomeRepo,
        AuthorizationService authorizationService
    ) {
        this.rallyCryRepo = rallyCryRepo;
        this.doRepo = doRepo;
        this.outcomeRepo = outcomeRepo;
        this.authorizationService = authorizationService;
    }

    @Transactional(readOnly = true)
    public List<RcdoTreeResponse> getTree() {
        return rallyCryRepo.findByActiveTrue().stream()
            .map(rc -> new RcdoTreeResponse(
                rc.getId(),
                rc.getName(),
                rc.getDescription(),
                rc.getDefiningObjectives().stream()
                    .filter(DefiningObjective::isActive)
                    .map(dobj -> new RcdoTreeResponse.DefiningObjectiveNode(
                        dobj.getId(),
                        dobj.getName(),
                        dobj.getDescription(),
                        dobj.getOutcomes().stream()
                            .filter(Outcome::isActive)
                            .map(o -> new RcdoTreeResponse.OutcomeNode(
                                o.getId(),
                                o.getName(),
                                o.getDescription(),
                                o.getMeasurableTarget()
                            )).toList()
                    )).toList()
            )).toList();
    }

    // Rally Cry CRUD
    public RallyCry createRallyCry(String name, String description) {
        authorizationService.requireManager();
        var rc = new RallyCry();
        rc.setName(name);
        rc.setDescription(description);
        return rallyCryRepo.save(rc);
    }

    @Transactional(readOnly = true)
    public List<RallyCry> getAllRallyCries() {
        return rallyCryRepo.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public RallyCry getRallyCry(UUID id) {
        return rallyCryRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Rally Cry not found: " + id));
    }

    public RallyCry updateRallyCry(UUID id, String name, String description) {
        authorizationService.requireManager();
        var rc = getRallyCry(id);
        if (name != null) rc.setName(name);
        if (description != null) rc.setDescription(description);
        return rallyCryRepo.save(rc);
    }

    public void deleteRallyCry(UUID id) {
        authorizationService.requireManager();
        var rc = getRallyCry(id);
        rc.setActive(false);
        rallyCryRepo.save(rc);
    }

    // Defining Objective CRUD
    public DefiningObjective createDefiningObjective(UUID rallyCryId, String name, String description) {
        authorizationService.requireManager();
        var rc = getRallyCry(rallyCryId);
        var dobj = new DefiningObjective();
        dobj.setRallyCry(rc);
        dobj.setName(name);
        dobj.setDescription(description);
        return doRepo.save(dobj);
    }

    @Transactional(readOnly = true)
    public List<DefiningObjective> getDefiningObjectives(UUID rallyCryId) {
        return doRepo.findByRallyCryId(rallyCryId);
    }

    public DefiningObjective updateDefiningObjective(UUID id, String name, String description) {
        authorizationService.requireManager();
        var dobj = doRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Defining Objective not found: " + id));
        if (name != null) dobj.setName(name);
        if (description != null) dobj.setDescription(description);
        return doRepo.save(dobj);
    }

    public void deleteDefiningObjective(UUID id) {
        authorizationService.requireManager();
        var dobj = doRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Defining Objective not found: " + id));
        dobj.setActive(false);
        doRepo.save(dobj);
    }

    // Outcome CRUD
    public Outcome createOutcome(UUID dobjId, String name, String description, String measurableTarget) {
        authorizationService.requireManager();
        var dobj = doRepo.findById(dobjId)
            .orElseThrow(() -> new EntityNotFoundException("Defining Objective not found: " + dobjId));
        var outcome = new Outcome();
        outcome.setDefiningObjective(dobj);
        outcome.setName(name);
        outcome.setDescription(description);
        outcome.setMeasurableTarget(measurableTarget);
        return outcomeRepo.save(outcome);
    }

    @Transactional(readOnly = true)
    public List<Outcome> getOutcomes(UUID dobjId) {
        return outcomeRepo.findByDefiningObjectiveId(dobjId);
    }

    public Outcome updateOutcome(UUID id, String name, String description, String measurableTarget) {
        authorizationService.requireManager();
        var outcome = outcomeRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Outcome not found: " + id));
        if (name != null) outcome.setName(name);
        if (description != null) outcome.setDescription(description);
        if (measurableTarget != null) outcome.setMeasurableTarget(measurableTarget);
        return outcomeRepo.save(outcome);
    }

    public void deleteOutcome(UUID id) {
        authorizationService.requireManager();
        var outcome = outcomeRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Outcome not found: " + id));
        outcome.setActive(false);
        outcomeRepo.save(outcome);
    }
}
