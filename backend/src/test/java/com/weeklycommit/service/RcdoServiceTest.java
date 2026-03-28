package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class RcdoServiceTest {

    @Autowired private RcdoService rcdoService;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("manager-1", "Taylor Smith", UserRole.MANAGER));
    }

    @Test
    void getTreeReturnsSeededData() {
        var tree = rcdoService.getTree();
        assertFalse(tree.isEmpty());
    }

    @Test
    void createRallyCry() {
        var rc = rcdoService.createRallyCry("Test Rally Cry", "Test description");
        assertNotNull(rc.getId());
        assertEquals("Test Rally Cry", rc.getName());
        assertTrue(rc.isActive());
    }

    @Test
    void createDefiningObjective() {
        var rc = rcdoService.createRallyCry("RC for DO test", "desc");
        var dObj = rcdoService.createDefiningObjective(rc.getId(), "Test DO", "DO desc");
        assertNotNull(dObj.getId());
        assertEquals("Test DO", dObj.getName());
    }

    @Test
    void createOutcome() {
        var rc = rcdoService.createRallyCry("RC for Outcome test", "desc");
        var dObj = rcdoService.createDefiningObjective(rc.getId(), "DO for Outcome", "desc");
        var outcome = rcdoService.createOutcome(dObj.getId(), "Test Outcome", "desc", "100% target");
        assertNotNull(outcome.getId());
        assertEquals("Test Outcome", outcome.getName());
        assertEquals("100% target", outcome.getMeasurableTarget());
    }

    @Test
    void softDeleteRallyCry() {
        var rc = rcdoService.createRallyCry("To Archive", "desc");
        rcdoService.deleteRallyCry(rc.getId());
        var fetched = rcdoService.getRallyCry(rc.getId());
        assertFalse(fetched.isActive());
    }

    @Test
    void softDeleteCascadesToTree() {
        var rc = rcdoService.createRallyCry("Cascade RC", "desc");
        var dObj = rcdoService.createDefiningObjective(rc.getId(), "Cascade DO", "desc");
        rcdoService.createOutcome(dObj.getId(), "Cascade Outcome", "desc", "target");
        rcdoService.deleteRallyCry(rc.getId());
        var tree = rcdoService.getTree();
        assertTrue(tree.stream().noneMatch(t -> t.name().equals("Cascade RC")));
    }

    @Test
    void updateRallyCry() {
        var rc = rcdoService.createRallyCry("Original Name", "desc");
        var updated = rcdoService.updateRallyCry(rc.getId(), "Updated Name", "new desc");
        assertEquals("Updated Name", updated.getName());
    }

    @Test
    void updateOutcome() {
        var rc = rcdoService.createRallyCry("RC Update Outcome", "desc");
        var dObj = rcdoService.createDefiningObjective(rc.getId(), "DO Update", "desc");
        var outcome = rcdoService.createOutcome(dObj.getId(), "Old Outcome", "desc", "old target");
        var updated = rcdoService.updateOutcome(outcome.getId(), "New Outcome", "new desc", "new target");
        assertEquals("New Outcome", updated.getName());
    }
}
