# Phase 1: Production Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the CommitPlanner for production — tests, API docs, rate limiting, validation, audit trail, and security fixes.

**Architecture:** Backend integration tests with Testcontainers (real PostgreSQL), frontend unit tests with Vitest + MSW. SpringDoc for API docs. Bucket4j for rate limiting. Explicit audit trail service. BCrypt + httpOnly cookies for security.

**Tech Stack:** JUnit 5, Testcontainers, Vitest, MSW, React Testing Library, SpringDoc OpenAPI, Bucket4j, Spring Boot Mail, BCryptPasswordEncoder

---

## File Structure

### Backend — New Files
```
backend/src/test/java/com/weeklycommit/
├── TestcontainersConfig.java              # Shared Testcontainers PostgreSQL setup
├── service/
│   ├── StateMachineTest.java              # State transition tests
│   ├── WeeklyPlanServiceTest.java         # Plan + commit CRUD tests
│   ├── ReconciliationTest.java            # Reconciliation + carry-forward tests
│   ├── RcdoServiceTest.java              # RCDO hierarchy tests
│   ├── ManagerServiceTest.java           # Manager dashboard tests
│   └── AiServiceTest.java               # AI service tests (mocked external)
├── controller/
│   ├── AuthControllerTest.java           # Login + JWT tests
│   └── AuthorizationTest.java            # Role-based access tests
backend/src/test/resources/
├── application-test.yml                   # Test profile config
backend/src/main/java/com/weeklycommit/
├── entity/AuditLog.java                  # Audit trail entity
├── repository/AuditLogRepository.java    # Audit trail repo
├── service/AuditService.java            # Audit trail service
├── config/RateLimitConfig.java          # Bucket4j rate limiting
├── config/RateLimitFilter.java          # Rate limit interceptor
backend/src/main/resources/db/migration/
├── V7__audit_log.sql                     # Audit trail table
├── V8__bcrypt_passwords.sql              # BCrypt password migration
```

### Backend — Modified Files
```
backend/build.gradle.kts                   # Add Testcontainers, SpringDoc, Bucket4j deps
backend/src/main/java/com/weeklycommit/
├── config/GlobalExceptionHandler.java     # Enhanced validation error responses
├── service/PasswordHasher.java           # Replace with BCryptPasswordEncoder
├── service/WeeklyPlanService.java        # Add audit logging calls
├── service/RcdoService.java              # Add audit logging calls
├── service/ManagerService.java           # Add audit logging calls
├── service/AuthService.java             # Cookie-based auth
├── security/AuthFilter.java             # Read token from cookie
├── security/AuthTokenService.java       # Cookie helpers
├── controller/AuthController.java       # Set cookie on login
├── controller/WeeklyPlanController.java  # Swagger annotations
├── controller/RcdoController.java        # Swagger annotations
├── controller/ManagerController.java     # Swagger annotations
├── controller/AiController.java          # Swagger annotations + rate limiting
├── controller/AdminController.java       # Swagger annotations
├── controller/NotificationController.java # Swagger annotations
├── dto/CreateCommitRequest.java          # Validation annotations
├── dto/UpdateCommitRequest.java          # Validation annotations
├── dto/ReconcileCommitRequest.java       # Validation annotations
├── dto/CreateWeeklyPlanRequest.java      # Monday validation
├── dto/LoginRequest.java                 # Size constraints
├── dto/ManagerReviewRequest.java         # Validation annotations
```

### Frontend — New Files
```
frontend/vitest.config.ts                  # Vitest configuration
frontend/src/test/
├── setup.ts                              # Test setup (jsdom + RTL matchers)
├── mocks/
│   ├── handlers.ts                       # MSW request handlers
│   └── server.ts                         # MSW server setup
├── store/
│   └── useStore.test.ts                  # Zustand store tests
├── components/
│   ├── StatusBadge.test.tsx              # Status badge tests
│   ├── ChessBadge.test.tsx              # Chess badge tests
│   ├── CommitForm.test.tsx              # Commit form tests
│   ├── ReconciliationRow.test.tsx       # Reconciliation row tests
│   └── RcdoPicker.test.tsx             # RCDO picker tests
├── pages/
│   ├── WeeklyPlanPage.test.tsx          # Weekly plan page tests
│   └── ManagerDashboardPage.test.tsx    # Manager dashboard tests
└── services/
    └── api.test.ts                       # API client tests
```

### Frontend — Modified Files
```
frontend/package.json                      # Add msw, @testing-library/user-event
frontend/src/services/api.ts              # Cookie-based auth (remove token header)
frontend/src/store/useStore.ts            # Remove localStorage token, cookie-based
```

---

### Task 1: Backend Test Infrastructure

**Files:**
- Modify: `backend/build.gradle.kts`
- Create: `backend/src/test/resources/application-test.yml`
- Create: `backend/src/test/java/com/weeklycommit/TestcontainersConfig.java`

- [ ] **Step 1: Add test dependencies to build.gradle.kts**

```kotlin
// Add to dependencies block in backend/build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.postgresql:postgresql")

    implementation("com.anthropic:anthropic-java:1.2.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:testcontainers:1.19.7")
    testImplementation("org.testcontainers:postgresql:1.19.7")
    testImplementation("org.testcontainers:junit-jupiter:1.19.7")
}
```

Remove the `com.h2database:h2` test dependency — we use Testcontainers now.

- [ ] **Step 2: Create test application config**

```yaml
# backend/src/test/resources/application-test.yml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration

anthropic:
  api-key: ""
  base-url: ""
  model: "test-model"
  max-tokens: 100

app:
  auth:
    secret: "test-secret-key-for-unit-tests-only"
```

- [ ] **Step 3: Create shared Testcontainers config**

```java
// backend/src/test/java/com/weeklycommit/TestcontainersConfig.java
package com.weeklycommit;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("weekly_commits_test")
                .withUsername("test")
                .withPassword("test");
    }
}
```

- [ ] **Step 4: Verify test infrastructure compiles**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew compileTestJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/build.gradle.kts backend/src/test/resources/application-test.yml backend/src/test/java/com/weeklycommit/TestcontainersConfig.java
git commit -m "feat: add Testcontainers infrastructure for integration tests"
```

---

### Task 2: State Machine Integration Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/StateMachineTest.java`

- [ ] **Step 1: Write state machine tests**

```java
// backend/src/test/java/com/weeklycommit/service/StateMachineTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.CreateWeeklyPlanRequest;
import com.weeklycommit.dto.ReconcileCommitRequest;
import com.weeklycommit.dto.WeeklyPlanResponse;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class StateMachineTest {

    @Autowired
    private WeeklyPlanService planService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        // Seed data provides users and outcomes via Flyway
        // Set auth context to IC user from seed data
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        outcomeId = outcomeRepo.findAll().stream()
                .filter(o -> o.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private WeeklyPlanResponse createPlanWithCommit(LocalDate weekStart) {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(weekStart));
        return planService.addCommit(plan.id(), new CreateCommitRequest(
                "Test commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("4.0")
        ));
    }

    @Test
    void newPlanStartsAsDraft() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 1, 5)));
        assertEquals(PlanStatus.DRAFT, plan.status());
    }

    @Test
    void draftToLocked() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 1, 12));
        var locked = planService.transition(plan.id(), "LOCK");
        assertEquals(PlanStatus.LOCKED, locked.status());
    }

    @Test
    void cannotLockEmptyPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 1, 19)));
        assertThrows(IllegalStateException.class, () -> planService.transition(plan.id(), "LOCK"));
    }

    @Test
    void lockedToReconciling() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 1, 26));
        planService.transition(plan.id(), "LOCK");
        var reconciling = planService.transition(plan.id(), "START_RECONCILIATION");
        assertEquals(PlanStatus.RECONCILING, reconciling.status());
    }

    @Test
    void reconcilingToReconciled() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 2));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");

        // Must reconcile all commits first
        var commitId = plan.commits().get(0).id();
        planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("3.5"), 80, "Done well", false
        ));

        var reconciled = planService.transition(plan.id(), "RECONCILE");
        assertEquals(PlanStatus.RECONCILED, reconciled.status());
    }

    @Test
    void cannotReconcileWithoutActuals() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 9));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        // Skip reconciling commits — should fail
        assertThrows(IllegalStateException.class, () -> planService.transition(plan.id(), "RECONCILE"));
    }

    @Test
    void reconciledToCarryForward() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 16));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");

        var commitId = plan.commits().get(0).id();
        planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("2.0"), 50, "Partial", true
        ));
        planService.transition(plan.id(), "RECONCILE");

        var cf = planService.transition(plan.id(), "CARRY_FORWARD");
        assertEquals(PlanStatus.CARRY_FORWARD, cf.status());
    }

    @Test
    void invalidTransitionThrows() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 2, 23));
        // Can't go DRAFT -> RECONCILING directly
        assertThrows(IllegalStateException.class,
                () -> planService.transition(plan.id(), "START_RECONCILIATION"));
    }

    @Test
    void unlockResetsToLocked() {
        var plan = createPlanWithCommit(LocalDate.of(2026, 3, 2));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        var unlocked = planService.transition(plan.id(), "UNLOCK");
        assertEquals(PlanStatus.LOCKED, unlocked.status());
    }
}
```

- [ ] **Step 2: Run state machine tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.StateMachineTest" -i`
Expected: All tests PASS (Docker must be running for Testcontainers)

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/StateMachineTest.java
git commit -m "test: add state machine integration tests"
```

---

### Task 3: Weekly Plan CRUD Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/WeeklyPlanServiceTest.java`

- [ ] **Step 1: Write plan + commit CRUD tests**

```java
// backend/src/test/java/com/weeklycommit/service/WeeklyPlanServiceTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.CreateWeeklyPlanRequest;
import com.weeklycommit.dto.UpdateCommitRequest;
import com.weeklycommit.dto.WeeklyPlanResponse;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class WeeklyPlanServiceTest {

    @Autowired
    private WeeklyPlanService planService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        outcomeId = outcomeRepo.findAll().stream()
                .filter(o -> o.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void createPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 9)));
        assertNotNull(plan.id());
        assertEquals(PlanStatus.DRAFT, plan.status());
        assertEquals("ic1", plan.userId());
        assertEquals(LocalDate.of(2026, 3, 9), plan.weekStartDate());
        assertTrue(plan.commits().isEmpty());
    }

    @Test
    void duplicatePlanThrows() {
        var date = LocalDate.of(2026, 3, 16);
        planService.createPlan(new CreateWeeklyPlanRequest(date));
        assertThrows(IllegalStateException.class,
                () -> planService.createPlan(new CreateWeeklyPlanRequest(date)));
    }

    @Test
    void addCommitToDraftPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 23)));
        var updated = planService.addCommit(plan.id(), new CreateCommitRequest(
                "My commit", "description", ChessPriority.MUST_DO, outcomeId, new BigDecimal("5.0")
        ));
        assertEquals(1, updated.commits().size());
        var commit = updated.commits().get(0);
        assertEquals("My commit", commit.title());
        assertEquals(ChessPriority.MUST_DO, commit.chessPriority());
        assertEquals(new BigDecimal("5.0"), commit.plannedHours());
    }

    @Test
    void cannotAddCommitToLockedPlan() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 3, 30)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Commit", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("2.0")
        ));
        planService.transition(plan.id(), "LOCK");
        assertThrows(IllegalStateException.class,
                () -> planService.addCommit(plan.id(), new CreateCommitRequest(
                        "Another", "desc", ChessPriority.NICE_TO_DO, outcomeId, new BigDecimal("1.0")
                )));
    }

    @Test
    void updateCommit() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 6)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "Original", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("3.0")
        ));
        var commitId = withCommit.commits().get(0).id();
        var updated = planService.updateCommit(commitId, new UpdateCommitRequest(
                "Updated title", "new desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("6.0"), 0
        ));
        assertEquals("Updated title", updated.commits().get(0).title());
        assertEquals(ChessPriority.MUST_DO, updated.commits().get(0).chessPriority());
    }

    @Test
    void deleteCommit() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 13)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "To delete", "desc", ChessPriority.NICE_TO_DO, outcomeId, new BigDecimal("1.0")
        ));
        var commitId = withCommit.commits().get(0).id();
        planService.deleteCommit(commitId);
        var refreshed = planService.getPlan(plan.id());
        assertTrue(refreshed.commits().isEmpty());
    }

    @Test
    void getPlanById() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 20)));
        var fetched = planService.getPlan(plan.id());
        assertEquals(plan.id(), fetched.id());
    }

    @Test
    void getUserPlansReturnsAllForUser() {
        planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 4, 27)));
        var plans = planService.getUserPlans();
        assertFalse(plans.isEmpty());
        assertTrue(plans.stream().allMatch(p -> p.userId().equals("ic1")));
    }

    @Test
    void optimisticLockVersionIncrementsOnTransition() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 5, 4)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")
        ));
        var locked = planService.transition(plan.id(), "LOCK");
        assertTrue(locked.version() > plan.version());
    }
}
```

- [ ] **Step 2: Run CRUD tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.WeeklyPlanServiceTest" -i`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/WeeklyPlanServiceTest.java
git commit -m "test: add weekly plan CRUD integration tests"
```

---

### Task 4: Reconciliation and Carry-Forward Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/ReconciliationTest.java`

- [ ] **Step 1: Write reconciliation + carry-forward tests**

```java
// backend/src/test/java/com/weeklycommit/service/ReconciliationTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.CreateWeeklyPlanRequest;
import com.weeklycommit.dto.ReconcileCommitRequest;
import com.weeklycommit.dto.WeeklyPlanResponse;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class ReconciliationTest {

    @Autowired
    private WeeklyPlanService planService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    @Autowired
    private WeeklyPlanRepository planRepo;

    private UUID outcomeId;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("ic2", "IC"));
        outcomeId = outcomeRepo.findAll().stream()
                .filter(o -> o.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private WeeklyPlanResponse createReconcilingPlan(LocalDate weekStart) {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(weekStart));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Task A", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("4.0")
        ));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Task B", "desc", ChessPriority.SHOULD_DO, outcomeId, new BigDecimal("2.0")
        ));
        planService.transition(plan.id(), "LOCK");
        return planService.transition(plan.id(), "START_RECONCILIATION");
    }

    @Test
    void reconcileCommitSetsActuals() {
        var plan = createReconcilingPlan(LocalDate.of(2026, 5, 11));
        var commitId = plan.commits().get(0).id();

        var updated = planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                new BigDecimal("3.5"), 90, "Almost done", false
        ));

        var commit = updated.commits().stream()
                .filter(c -> c.id().equals(commitId))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("3.5"), commit.actualHours());
        assertEquals(90, commit.completionPct());
        assertEquals("Almost done", commit.reconciliationNotes());
        assertFalse(commit.carryForward());
    }

    @Test
    void cannotReconcileInDraftState() {
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 5, 18)));
        var withCommit = planService.addCommit(plan.id(), new CreateCommitRequest(
                "Draft commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")
        ));
        var commitId = withCommit.commits().get(0).id();
        assertThrows(IllegalStateException.class,
                () -> planService.reconcileCommit(commitId, new ReconcileCommitRequest(
                        new BigDecimal("1.0"), 50, "notes", false
                )));
    }

    @Test
    void carryForwardCreatesNextWeekPlan() {
        var weekStart = LocalDate.of(2026, 5, 25);
        var plan = createReconcilingPlan(weekStart);

        // Reconcile first commit as complete
        planService.reconcileCommit(plan.commits().get(0).id(), new ReconcileCommitRequest(
                new BigDecimal("4.0"), 100, "Done", false
        ));
        // Reconcile second as partial, mark carry forward
        planService.reconcileCommit(plan.commits().get(1).id(), new ReconcileCommitRequest(
                new BigDecimal("1.0"), 30, "Incomplete", true
        ));

        planService.transition(plan.id(), "RECONCILE");
        planService.transition(plan.id(), "CARRY_FORWARD");

        // Check next week plan exists with carried commit
        var nextWeek = weekStart.plusWeeks(1);
        var nextPlan = planRepo.findByUserIdAndWeekStartDate("ic2", nextWeek);
        assertTrue(nextPlan.isPresent());
        assertEquals(PlanStatus.DRAFT, nextPlan.get().getStatus());
        assertEquals(1, nextPlan.get().getCommits().size());
        assertTrue(nextPlan.get().getCommits().get(0).getTitle().contains("[CF]"));
    }

    @Test
    void carryForwardWithNoItemsMarked() {
        var plan = createReconcilingPlan(LocalDate.of(2026, 6, 1));

        // Reconcile both as complete, no carry forward
        for (var commit : plan.commits()) {
            planService.reconcileCommit(commit.id(), new ReconcileCommitRequest(
                    new BigDecimal("3.0"), 100, "Complete", false
            ));
        }

        planService.transition(plan.id(), "RECONCILE");
        var cf = planService.transition(plan.id(), "CARRY_FORWARD");
        assertEquals(PlanStatus.CARRY_FORWARD, cf.status());

        // No next week plan should be created
        var nextWeek = LocalDate.of(2026, 6, 8);
        var nextPlan = planRepo.findByUserIdAndWeekStartDate("ic2", nextWeek);
        assertFalse(nextPlan.isPresent());
    }
}
```

- [ ] **Step 2: Run reconciliation tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.ReconciliationTest" -i`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/ReconciliationTest.java
git commit -m "test: add reconciliation and carry-forward integration tests"
```

---

### Task 5: RCDO Service Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/RcdoServiceTest.java`

- [ ] **Step 1: Write RCDO hierarchy tests**

```java
// backend/src/test/java/com/weeklycommit/service/RcdoServiceTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.entity.Outcome;
import com.weeklycommit.repository.OutcomeRepository;
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

    @Autowired
    private RcdoService rcdoService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("mgr1", "MANAGER"));
    }

    @Test
    void getTreeReturnsSeededData() {
        var tree = rcdoService.getTree();
        assertFalse(tree.isEmpty());
        // Seed has 3 rally cries
        assertTrue(tree.size() >= 3);
        // Each rally cry has defining objectives
        assertTrue(tree.stream().allMatch(rc -> !rc.definingObjectives().isEmpty()));
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

        // Tree should not include archived rally cry
        var tree = rcdoService.getTree();
        assertTrue(tree.stream().noneMatch(t -> t.name().equals("Cascade RC")));
    }

    @Test
    void updateRallyCry() {
        var rc = rcdoService.createRallyCry("Original Name", "desc");
        var updated = rcdoService.updateRallyCry(rc.getId(), "Updated Name", "new desc");
        assertEquals("Updated Name", updated.getName());
        assertEquals("new desc", updated.getDescription());
    }

    @Test
    void updateOutcome() {
        var rc = rcdoService.createRallyCry("RC Update Outcome", "desc");
        var dObj = rcdoService.createDefiningObjective(rc.getId(), "DO Update", "desc");
        var outcome = rcdoService.createOutcome(dObj.getId(), "Old Outcome", "desc", "old target");
        var updated = rcdoService.updateOutcome(outcome.getId(), "New Outcome", "new desc", "new target");
        assertEquals("New Outcome", updated.getName());
        assertEquals("new target", updated.getMeasurableTarget());
    }
}
```

- [ ] **Step 2: Run RCDO tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.RcdoServiceTest" -i`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/RcdoServiceTest.java
git commit -m "test: add RCDO hierarchy integration tests"
```

---

### Task 6: Manager Service Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/ManagerServiceTest.java`

- [ ] **Step 1: Write manager service tests**

```java
// backend/src/test/java/com/weeklycommit/service/ManagerServiceTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.dto.CreateCommitRequest;
import com.weeklycommit.dto.CreateWeeklyPlanRequest;
import com.weeklycommit.dto.ReconcileCommitRequest;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.ReviewStatus;
import com.weeklycommit.repository.OutcomeRepository;
import com.weeklycommit.security.AuthContextHolder;
import com.weeklycommit.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class ManagerServiceTest {

    @Autowired
    private WeeklyPlanService planService;

    @Autowired
    private ManagerService managerService;

    @Autowired
    private OutcomeRepository outcomeRepo;

    private UUID outcomeId;
    private final LocalDate testWeek = LocalDate.of(2026, 6, 8);

    @BeforeEach
    void setUp() {
        outcomeId = outcomeRepo.findAll().stream()
                .filter(o -> o.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void getTeamPlansShowsAssignedMembers() {
        // Create a plan as IC
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(testWeek));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Manager test commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("3.0")
        ));

        // Switch to manager context
        AuthContextHolder.set(new AuthenticatedUser("mgr1", "MANAGER"));
        var teamPlans = managerService.getTeamPlans(testWeek);

        assertNotNull(teamPlans);
        // mgr1 should see their assigned ICs
        assertFalse(teamPlans.isEmpty());
    }

    @Test
    void getRcdoAlignmentShowsCoverage() {
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 6, 15)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Alignment commit", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")
        ));
        planService.transition(plan.id(), "LOCK");

        AuthContextHolder.set(new AuthenticatedUser("mgr1", "MANAGER"));
        var alignment = managerService.getRcdoAlignment(LocalDate.of(2026, 6, 15));

        assertNotNull(alignment);
        assertFalse(alignment.isEmpty());
    }

    @Test
    void submitReviewApproved() {
        // Create + reconcile a plan as IC
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 6, 22)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Review test", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")
        ));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        planService.reconcileCommit(
                planService.getPlan(plan.id()).commits().get(0).id(),
                new ReconcileCommitRequest(new BigDecimal("2.0"), 100, "Done", false)
        );
        planService.transition(plan.id(), "RECONCILE");

        // Manager approves
        AuthContextHolder.set(new AuthenticatedUser("mgr1", "MANAGER"));
        managerService.submitReview(plan.id(), ReviewStatus.APPROVED, "Good work");

        // Verify review persisted
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var reviewed = planService.getPlan(plan.id());
        assertEquals(ReviewStatus.APPROVED, reviewed.reviewStatus());
        assertEquals("Good work", reviewed.reviewFeedback());
    }

    @Test
    void submitReviewFlagged() {
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var plan = planService.createPlan(new CreateWeeklyPlanRequest(LocalDate.of(2026, 6, 29)));
        planService.addCommit(plan.id(), new CreateCommitRequest(
                "Flag test", "desc", ChessPriority.MUST_DO, outcomeId, new BigDecimal("2.0")
        ));
        planService.transition(plan.id(), "LOCK");
        planService.transition(plan.id(), "START_RECONCILIATION");
        planService.reconcileCommit(
                planService.getPlan(plan.id()).commits().get(0).id(),
                new ReconcileCommitRequest(new BigDecimal("1.0"), 20, "Struggled", false)
        );
        planService.transition(plan.id(), "RECONCILE");

        AuthContextHolder.set(new AuthenticatedUser("mgr1", "MANAGER"));
        managerService.submitReview(plan.id(), ReviewStatus.FLAGGED, "Needs discussion");

        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
        var reviewed = planService.getPlan(plan.id());
        assertEquals(ReviewStatus.FLAGGED, reviewed.reviewStatus());
    }
}
```

- [ ] **Step 2: Run manager tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.ManagerServiceTest" -i`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/ManagerServiceTest.java
git commit -m "test: add manager service integration tests"
```

---

### Task 7: Auth and Authorization Tests

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/controller/AuthControllerTest.java`
- Create: `backend/src/test/java/com/weeklycommit/controller/AuthorizationTest.java`

- [ ] **Step 1: Write auth controller tests**

```java
// backend/src/test/java/com/weeklycommit/controller/AuthControllerTest.java
package com.weeklycommit.controller;

import com.weeklycommit.TestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId": "ic1", "password": "password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("ic1"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("IC"));
    }

    @Test
    void loginBadPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId": "ic1", "password": "wrong"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginNonexistentUser() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId": "nobody", "password": "password123"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meEndpointWithValidToken() throws Exception {
        // First login to get token
        var loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId": "ic1", "password": "password123"}
                                """))
                .andReturn();

        var body = loginResult.getResponse().getContentAsString();
        var token = body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("ic1"));
    }

    @Test
    void expiredOrInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Write authorization tests**

```java
// backend/src/test/java/com/weeklycommit/controller/AuthorizationTest.java
package com.weeklycommit.controller;

import com.weeklycommit.TestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class AuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    private String icToken;
    private String managerToken;

    @BeforeEach
    void setUp() throws Exception {
        icToken = extractToken(login("ic1", "password123"));
        managerToken = extractToken(login("mgr1", "password123"));
    }

    private String login(String userId, String password) throws Exception {
        var result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"userId": "%s", "password": "%s"}
                                """, userId, password)))
                .andReturn();
        return result.getResponse().getContentAsString();
    }

    private String extractToken(String body) {
        return body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void icCanAccessWeeklyPlans() throws Exception {
        mockMvc.perform(get("/api/weekly-plans")
                        .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isOk());
    }

    @Test
    void icCannotAccessManagerEndpoints() throws Exception {
        mockMvc.perform(get("/api/manager/team-plans")
                        .param("weekStart", "2026-06-08")
                        .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanAccessTeamPlans() throws Exception {
        mockMvc.perform(get("/api/manager/team-plans")
                        .param("weekStart", "2026-06-08")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
    }

    @Test
    void managerCanAccessRcdoAlignment() throws Exception {
        mockMvc.perform(get("/api/manager/rcdo-alignment")
                        .param("weekStart", "2026-06-08")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedCannotAccessProtectedEndpoints() throws Exception {
        mockMvc.perform(get("/api/weekly-plans"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/manager/team-plans").param("weekStart", "2026-06-08"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/rcdo/tree"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void icCanAccessRcdoTree() throws Exception {
        mockMvc.perform(get("/api/rcdo/tree")
                        .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 3: Run auth tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.controller.AuthControllerTest" --tests "com.weeklycommit.controller.AuthorizationTest" -i`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/controller/AuthControllerTest.java backend/src/test/java/com/weeklycommit/controller/AuthorizationTest.java
git commit -m "test: add auth and authorization integration tests"
```

---

### Task 8: AI Service Tests (Mocked External API)

**Files:**
- Create: `backend/src/test/java/com/weeklycommit/service/AiServiceTest.java`

- [ ] **Step 1: Write AI service tests with mocked external calls**

```java
// backend/src/test/java/com/weeklycommit/service/AiServiceTest.java
package com.weeklycommit.service;

import com.weeklycommit.TestcontainersConfig;
import com.weeklycommit.config.AnthropicConfig;
import com.weeklycommit.dto.ai.CommitSuggestionRequest;
import com.weeklycommit.dto.ai.HoursEstimateRequest;
import com.weeklycommit.dto.ai.OutcomeMatchRequest;
import com.weeklycommit.exception.AiUnavailableException;
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
class AiServiceTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private AnthropicConfig anthropicConfig;

    @BeforeEach
    void setUp() {
        AuthContextHolder.set(new AuthenticatedUser("ic1", "IC"));
    }

    @Test
    void aiDisabledWhenNoApiKey() {
        // In test profile, API key is empty
        assertFalse(anthropicConfig.isEnabled());
    }

    @Test
    void matchOutcomesThrowsWhenDisabled() {
        var request = new OutcomeMatchRequest("Build login page", null);
        assertThrows(AiUnavailableException.class, () -> aiService.matchOutcomes(request));
    }

    @Test
    void estimateHoursThrowsWhenDisabled() {
        var request = new HoursEstimateRequest("Build login page", null, null);
        assertThrows(AiUnavailableException.class, () -> aiService.estimateHours(request));
    }

    @Test
    void suggestCommitThrowsWhenDisabled() {
        var request = new CommitSuggestionRequest("I need to work on auth");
        assertThrows(AiUnavailableException.class, () -> aiService.suggestCommit(request));
    }

    @Test
    void cacheServiceOperatesIndependently() {
        // AiCacheService should work even when AI is disabled
        var cacheService = new AiCacheService();
        assertNull(cacheService.getCachedOutcomeMatch("test-key"));
        // No exception thrown — cache layer is independent
    }
}
```

- [ ] **Step 2: Run AI tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.service.AiServiceTest" -i`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/test/java/com/weeklycommit/service/AiServiceTest.java
git commit -m "test: add AI service tests with disabled API"
```

---

### Task 9: Frontend Test Infrastructure

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/mocks/handlers.ts`
- Create: `frontend/src/test/mocks/server.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install test dependencies**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/frontend && npm install --save-dev msw@2.3.1 @testing-library/user-event@14.5.2`
Expected: added N packages

- [ ] **Step 2: Create vitest config**

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Create test setup**

```typescript
// frontend/src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

- [ ] **Step 4: Create MSW handlers with test data**

```typescript
// frontend/src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8080/api';

const mockRcdoTree = [
  {
    id: 'rc-1',
    name: 'Rally Cry 1',
    description: 'First rally cry',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Objective 1',
        description: 'First objective',
        outcomes: [
          { id: 'out-1', name: 'Outcome 1', description: 'First outcome', measurableTarget: '100%' },
          { id: 'out-2', name: 'Outcome 2', description: 'Second outcome', measurableTarget: '50 users' },
        ],
      },
    ],
  },
];

const mockPlan = {
  id: 'plan-1',
  userId: 'ic1',
  weekStartDate: '2026-03-23',
  status: 'DRAFT',
  reviewStatus: null,
  reviewFeedback: null,
  version: 0,
  commits: [
    {
      id: 'commit-1',
      title: 'Build login page',
      description: 'Implement login UI',
      chessPriority: 'MUST_DO',
      outcomeId: 'out-1',
      outcomeName: 'Outcome 1',
      rallyCryName: 'Rally Cry 1',
      definingObjectiveName: 'Objective 1',
      plannedHours: 4,
      actualHours: null,
      completionPct: null,
      reconciliationNotes: null,
      carryForward: false,
      sortOrder: 0,
    },
  ],
  createdAt: '2026-03-23T10:00:00',
  updatedAt: '2026-03-23T10:00:00',
};

const mockTeamPlans = [
  {
    planId: 'plan-1',
    userId: 'ic1',
    fullName: 'IC User 1',
    weekStartDate: '2026-03-23',
    status: 'LOCKED',
    hasPlan: true,
    totalCommits: 3,
    mustDoCount: 1,
    shouldDoCount: 1,
    niceToDoCount: 1,
    totalPlannedHours: 10,
    totalActualHours: 0,
    avgCompletionPct: 0,
    reviewStatus: null,
  },
];

const mockAlignment = [
  {
    rallyCryId: 'rc-1',
    rallyCryName: 'Rally Cry 1',
    objectives: [
      {
        objectiveId: 'do-1',
        objectiveName: 'Objective 1',
        outcomes: [
          {
            outcomeId: 'out-1',
            outcomeName: 'Outcome 1',
            commitCount: 1,
            commits: [{ commitId: 'commit-1', title: 'Build login page', userId: 'ic1', chessPriority: 'MUST_DO', completionPct: null }],
          },
        ],
      },
    ],
  },
];

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () => {
    return HttpResponse.json({
      userId: 'ic1',
      fullName: 'IC User 1',
      role: 'IC',
      token: 'mock-jwt-token',
      managedUserIds: [],
    });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      userId: 'ic1',
      fullName: 'IC User 1',
      role: 'IC',
      token: 'mock-jwt-token',
      managedUserIds: [],
    });
  }),

  // RCDO
  http.get(`${BASE}/rcdo/tree`, () => HttpResponse.json(mockRcdoTree)),

  // Weekly Plans
  http.get(`${BASE}/weekly-plans/current`, () => HttpResponse.json(mockPlan)),
  http.get(`${BASE}/weekly-plans/:id`, () => HttpResponse.json(mockPlan)),
  http.get(`${BASE}/weekly-plans`, () => HttpResponse.json([mockPlan])),
  http.post(`${BASE}/weekly-plans`, () => HttpResponse.json(mockPlan)),
  http.post(`${BASE}/weekly-plans/:planId/commits`, () => HttpResponse.json(mockPlan)),
  http.post(`${BASE}/weekly-plans/:planId/transition`, () =>
    HttpResponse.json({ ...mockPlan, status: 'LOCKED' })
  ),

  // Commits
  http.put(`${BASE}/commits/:id`, () => HttpResponse.json(mockPlan)),
  http.delete(`${BASE}/commits/:id`, () => new HttpResponse(null, { status: 204 })),
  http.put(`${BASE}/commits/:id/reconcile`, () => HttpResponse.json(mockPlan)),

  // Manager
  http.get(`${BASE}/manager/team-plans`, () => HttpResponse.json(mockTeamPlans)),
  http.get(`${BASE}/manager/rcdo-alignment`, () => HttpResponse.json(mockAlignment)),
  http.post(`${BASE}/manager/reviews`, () => HttpResponse.json({ id: 'review-1' })),

  // Notifications
  http.get(`${BASE}/notifications`, () => HttpResponse.json([])),
  http.get(`${BASE}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),

  // AI
  http.get(`${BASE}/ai/status`, () => HttpResponse.json({ enabled: false, model: null })),
];
```

- [ ] **Step 5: Create MSW server**

```typescript
// frontend/src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 6: Verify test infrastructure works**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/frontend && npx vitest run --passWithNoTests`
Expected: No test suites found (but no errors — infrastructure is wired)

- [ ] **Step 7: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add frontend/vitest.config.ts frontend/src/test/ frontend/package.json frontend/package-lock.json
git commit -m "feat: add Vitest + MSW test infrastructure for frontend"
```

---

### Task 10: Frontend Store Tests

**Files:**
- Create: `frontend/src/test/store/useStore.test.ts`

- [ ] **Step 1: Write Zustand store tests**

```typescript
// frontend/src/test/store/useStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';
import type { AuthResponse } from '../../types';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      userId: '',
      fullName: '',
      role: 'IC',
      token: '',
      isAuthenticated: false,
      currentPlan: null,
      loadingPlan: false,
      planError: null,
      rcdoTree: [],
      loadingRcdo: false,
      teamPlans: [],
      rcdoAlignment: [],
      loadingTeam: false,
      toast: null,
      commitmentsActionTick: 0,
    });
  });

  describe('auth', () => {
    it('login sets user state', () => {
      const auth: AuthResponse = {
        userId: 'ic1',
        fullName: 'IC User 1',
        role: 'IC',
        token: 'test-token',
        managedUserIds: [],
      };

      useStore.getState().login(auth);

      const state = useStore.getState();
      expect(state.userId).toBe('ic1');
      expect(state.fullName).toBe('IC User 1');
      expect(state.role).toBe('IC');
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('logout clears user state', () => {
      useStore.getState().login({
        userId: 'ic1',
        fullName: 'IC User 1',
        role: 'IC',
        token: 'test-token',
        managedUserIds: [],
      });

      useStore.getState().logout();

      const state = useStore.getState();
      expect(state.userId).toBe('');
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBe('');
    });
  });

  describe('toast', () => {
    it('showToast sets toast message', () => {
      useStore.getState().showToast('Success!', 'success');
      expect(useStore.getState().toast).toEqual({ message: 'Success!', type: 'success' });
    });

    it('clearToast removes toast', () => {
      useStore.getState().showToast('Error!', 'error');
      useStore.getState().clearToast();
      expect(useStore.getState().toast).toBeNull();
    });
  });

  describe('plan', () => {
    it('setPlan updates current plan', () => {
      const mockPlan = {
        id: 'plan-1',
        userId: 'ic1',
        weekStartDate: '2026-03-23',
        status: 'DRAFT' as const,
        reviewStatus: null,
        reviewFeedback: null,
        version: 0,
        commits: [],
        createdAt: '2026-03-23T10:00:00',
        updatedAt: '2026-03-23T10:00:00',
      };

      useStore.getState().setPlan(mockPlan);
      expect(useStore.getState().currentPlan).toEqual(mockPlan);
    });

    it('fetchCurrentPlan calls API and sets state', async () => {
      useStore.getState().login({
        userId: 'ic1',
        fullName: 'IC User 1',
        role: 'IC',
        token: 'mock-jwt-token',
        managedUserIds: [],
      });

      await useStore.getState().fetchCurrentPlan();

      const state = useStore.getState();
      expect(state.currentPlan).not.toBeNull();
      expect(state.loadingPlan).toBe(false);
    });
  });

  describe('commitmentsActionTick', () => {
    it('triggerCommitmentsAction increments tick', () => {
      const before = useStore.getState().commitmentsActionTick;
      useStore.getState().triggerCommitmentsAction();
      expect(useStore.getState().commitmentsActionTick).toBe(before + 1);
    });
  });

  describe('rcdo', () => {
    it('fetchRcdo populates tree', async () => {
      useStore.getState().login({
        userId: 'ic1',
        fullName: 'IC User 1',
        role: 'IC',
        token: 'mock-jwt-token',
        managedUserIds: [],
      });

      await useStore.getState().fetchRcdo();

      const tree = useStore.getState().rcdoTree;
      expect(tree.length).toBeGreaterThan(0);
      expect(tree[0]!.name).toBe('Rally Cry 1');
    });
  });
});
```

- [ ] **Step 2: Run store tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/frontend && npx vitest run src/test/store`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add frontend/src/test/store/useStore.test.ts
git commit -m "test: add Zustand store unit tests"
```

---

### Task 11: Frontend Component Tests

**Files:**
- Create: `frontend/src/test/components/StatusBadge.test.tsx`
- Create: `frontend/src/test/components/ChessBadge.test.tsx`
- Create: `frontend/src/test/components/CommitForm.test.tsx`
- Create: `frontend/src/test/components/ReconciliationRow.test.tsx`
- Create: `frontend/src/test/components/RcdoPicker.test.tsx`

- [ ] **Step 1: Write StatusBadge tests**

```tsx
// frontend/src/test/components/StatusBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders DRAFT label', () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('renders LOCKED label', () => {
    render(<StatusBadge status="LOCKED" />);
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });

  it('renders RECONCILING label', () => {
    render(<StatusBadge status="RECONCILING" />);
    expect(screen.getByText('RECONCILING')).toBeInTheDocument();
  });

  it('renders RECONCILED label', () => {
    render(<StatusBadge status="RECONCILED" />);
    expect(screen.getByText('RECONCILED')).toBeInTheDocument();
  });

  it('renders CARRY FWD label', () => {
    render(<StatusBadge status="CARRY_FORWARD" />);
    expect(screen.getByText('CARRY FWD')).toBeInTheDocument();
  });

  it('renders NO PLAN label', () => {
    render(<StatusBadge status="NO_PLAN" />);
    expect(screen.getByText('NO PLAN')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write ChessBadge tests**

```tsx
// frontend/src/test/components/ChessBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChessBadge from '../../components/ChessBadge';

describe('ChessBadge', () => {
  it('renders MUST_DO with A label', () => {
    render(<ChessBadge priority="MUST_DO" />);
    expect(screen.getByText(/Must Do/i)).toBeInTheDocument();
  });

  it('renders SHOULD_DO with B label', () => {
    render(<ChessBadge priority="SHOULD_DO" />);
    expect(screen.getByText(/Should Do/i)).toBeInTheDocument();
  });

  it('renders NICE_TO_DO with C label', () => {
    render(<ChessBadge priority="NICE_TO_DO" />);
    expect(screen.getByText(/Nice to Do/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Write RcdoPicker tests**

```tsx
// frontend/src/test/components/RcdoPicker.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RcdoPicker from '../../components/RcdoPicker';
import { useStore } from '../../store/useStore';

describe('RcdoPicker', () => {
  beforeEach(() => {
    useStore.setState({
      rcdoTree: [
        {
          id: 'rc-1',
          name: 'Rally Cry 1',
          description: 'desc',
          definingObjectives: [
            {
              id: 'do-1',
              name: 'Objective 1',
              description: 'desc',
              outcomes: [
                { id: 'out-1', name: 'Outcome 1', description: 'desc', measurableTarget: '100%' },
              ],
            },
          ],
        },
      ],
      loadingRcdo: false,
    });
  });

  it('renders rally cry names', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);
    expect(screen.getByText('Rally Cry 1')).toBeInTheDocument();
  });

  it('expands to show objectives on click', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Rally Cry 1'));
    expect(screen.getByText('Objective 1')).toBeInTheDocument();
  });

  it('expands to show outcomes on objective click', () => {
    render(<RcdoPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Rally Cry 1'));
    fireEvent.click(screen.getByText('Objective 1'));
    expect(screen.getByText('Outcome 1')).toBeInTheDocument();
  });

  it('calls onChange when outcome selected', () => {
    let selected = '';
    render(<RcdoPicker value="" onChange={(id) => { selected = id; }} />);
    fireEvent.click(screen.getByText('Rally Cry 1'));
    fireEvent.click(screen.getByText('Objective 1'));
    fireEvent.click(screen.getByText('Outcome 1'));
    expect(selected).toBe('out-1');
  });

  it('highlights suggested outcome', () => {
    render(<RcdoPicker value="" onChange={() => {}} suggestedOutcomeId="out-1" />);
    // Should auto-expand to show the suggested outcome
    expect(screen.getByText('Outcome 1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Write API client tests**

```typescript
// frontend/src/test/services/api.test.ts
import { describe, it, expect } from 'vitest';
import * as api from '../../services/api';

describe('api client', () => {
  it('fetchRcdoTree returns tree data', async () => {
    api.setAuthToken('mock-jwt-token');
    const tree = await api.fetchRcdoTree();
    expect(tree).toHaveLength(1);
    expect(tree[0]!.name).toBe('Rally Cry 1');
  });

  it('login returns auth response', async () => {
    const auth = await api.login('ic1', 'password123');
    expect(auth.userId).toBe('ic1');
    expect(auth.token).toBe('mock-jwt-token');
    expect(auth.role).toBe('IC');
  });

  it('fetchCurrentPlan returns plan', async () => {
    api.setAuthToken('mock-jwt-token');
    const plan = await api.fetchCurrentPlan();
    expect(plan.id).toBe('plan-1');
    expect(plan.status).toBe('DRAFT');
    expect(plan.commits).toHaveLength(1);
  });

  it('fetchTeamPlans returns summaries', async () => {
    api.setAuthToken('mock-jwt-token');
    const plans = await api.fetchTeamPlans('2026-03-23');
    expect(plans).toHaveLength(1);
    expect(plans[0]!.userId).toBe('ic1');
  });

  it('fetchNotifications returns empty list', async () => {
    api.setAuthToken('mock-jwt-token');
    const notifications = await api.fetchNotifications();
    expect(notifications).toEqual([]);
  });
});
```

- [ ] **Step 5: Run all frontend tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/frontend && npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add frontend/src/test/components/ frontend/src/test/services/
git commit -m "test: add frontend component and API client tests"
```

---

### Task 12: Swagger/OpenAPI Documentation

**Files:**
- Modify: `backend/build.gradle.kts`
- Modify: `backend/src/main/java/com/weeklycommit/controller/WeeklyPlanController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/RcdoController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/ManagerController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/AiController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/AuthController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/AdminController.java`
- Modify: `backend/src/main/java/com/weeklycommit/controller/NotificationController.java`

- [ ] **Step 1: Add SpringDoc dependency**

Add to `backend/build.gradle.kts` dependencies:

```kotlin
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
```

- [ ] **Step 2: Add Swagger annotations to WeeklyPlanController**

Add these imports and annotations to `WeeklyPlanController.java`:

```java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Weekly Plans", description = "Weekly plan and commit CRUD, state machine transitions")
public class WeeklyPlanController {

    // ... existing constructor ...

    @Operation(summary = "Create a new weekly plan", description = "Creates a plan for the authenticated user for the given week start date (must be a Monday)")
    @PostMapping("/weekly-plans")
    public WeeklyPlanResponse createPlan(@Valid @RequestBody CreateWeeklyPlanRequest req) { ... }

    @Operation(summary = "Get plan by ID")
    @GetMapping("/weekly-plans/{id}")
    public WeeklyPlanResponse getPlan(@PathVariable UUID id) { ... }

    @Operation(summary = "Get current week's plan for authenticated user")
    @GetMapping("/weekly-plans/current")
    public WeeklyPlanResponse getCurrentPlan() { ... }

    @Operation(summary = "List all plans for authenticated user")
    @GetMapping("/weekly-plans")
    public List<WeeklyPlanResponse> getUserPlans() { ... }

    @Operation(summary = "Add a commit to a plan", description = "Plan must be in DRAFT status")
    @PostMapping("/weekly-plans/{planId}/commits")
    public WeeklyPlanResponse addCommit(@PathVariable UUID planId, @Valid @RequestBody CreateCommitRequest req) { ... }

    @Operation(summary = "Update a commit", description = "Plan must be in DRAFT status")
    @PutMapping("/commits/{commitId}")
    public WeeklyPlanResponse updateCommit(@PathVariable UUID commitId, @RequestBody UpdateCommitRequest req) { ... }

    @Operation(summary = "Delete a commit", description = "Plan must be in DRAFT status")
    @DeleteMapping("/commits/{commitId}")
    public void deleteCommit(@PathVariable UUID commitId) { ... }

    @Operation(summary = "Submit reconciliation for a commit", description = "Plan must be in RECONCILING status")
    @PutMapping("/commits/{commitId}/reconcile")
    public WeeklyPlanResponse reconcileCommit(@PathVariable UUID commitId, @Valid @RequestBody ReconcileCommitRequest req) { ... }

    @Operation(summary = "Transition plan status", description = "Actions: LOCK, UNLOCK, START_RECONCILIATION, RECONCILE, CARRY_FORWARD")
    @PostMapping("/weekly-plans/{planId}/transition")
    public WeeklyPlanResponse transition(@PathVariable UUID planId, @RequestParam String action) { ... }
}
```

- [ ] **Step 3: Add Swagger annotations to remaining controllers**

Apply same pattern (`@Tag` on class, `@Operation` on each method) to:
- `AuthController` — `@Tag(name = "Auth")`
- `RcdoController` — `@Tag(name = "RCDO Hierarchy")`
- `ManagerController` — `@Tag(name = "Manager")`
- `AiController` — `@Tag(name = "AI Assistance")`
- `AdminController` — `@Tag(name = "Admin")`
- `NotificationController` — `@Tag(name = "Notifications")`

Each `@Operation` should have a brief `summary` string. No need for long descriptions on straightforward endpoints.

- [ ] **Step 4: Add OpenAPI config to exclude auth filter from Swagger UI**

Add to `application.yml`:

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
```

- [ ] **Step 5: Verify Swagger UI loads**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew bootRun`
Then open: `http://localhost:8080/swagger-ui.html`
Expected: Interactive API documentation page showing all endpoint groups

- [ ] **Step 6: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/build.gradle.kts backend/src/main/java/com/weeklycommit/controller/ backend/src/main/resources/application.yml
git commit -m "feat: add Swagger/OpenAPI documentation for all endpoints"
```

---

### Task 13: Rate Limiting

**Files:**
- Modify: `backend/build.gradle.kts`
- Create: `backend/src/main/java/com/weeklycommit/config/RateLimitConfig.java`
- Create: `backend/src/main/java/com/weeklycommit/config/RateLimitFilter.java`

- [ ] **Step 1: Add Bucket4j dependency**

Add to `backend/build.gradle.kts` dependencies:

```kotlin
implementation("com.bucket4j:bucket4j-core:8.10.1")
```

- [ ] **Step 2: Create rate limit config**

```java
// backend/src/main/java/com/weeklycommit/config/RateLimitConfig.java
package com.weeklycommit.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitConfig {

    public enum Tier {
        AI_TIER1(30, Duration.ofMinutes(1)),
        AI_TIER2(10, Duration.ofMinutes(1)),
        AI_TIER3(5, Duration.ofMinutes(1)),
        AUTH(5, Duration.ofMinutes(1));

        private final int capacity;
        private final Duration period;

        Tier(int capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, Tier tier) {
        return buckets.computeIfAbsent(key + ":" + tier.name(), k ->
                Bucket.builder()
                        .addLimit(Bandwidth.simple(tier.capacity, tier.period))
                        .build()
        );
    }

    public boolean tryConsume(String key, Tier tier) {
        return resolveBucket(key, tier).tryConsume(1);
    }

    public long getWaitTimeSeconds(String key, Tier tier) {
        var probe = resolveBucket(key, tier).tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return 0;
        }
        return probe.getNanosToWaitForRefill() / 1_000_000_000;
    }
}
```

- [ ] **Step 3: Create rate limit filter for AI endpoints**

```java
// backend/src/main/java/com/weeklycommit/config/RateLimitFilter.java
package com.weeklycommit.config;

import com.weeklycommit.security.AuthContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@Order(2)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;

    private static final Map<String, RateLimitConfig.Tier> PATH_TIERS = Map.ofEntries(
            Map.entry("/api/ai/match-outcomes", RateLimitConfig.Tier.AI_TIER1),
            Map.entry("/api/ai/estimate-hours", RateLimitConfig.Tier.AI_TIER1),
            Map.entry("/api/ai/suggest-commit", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/reconciliation-assist", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/review-insight", RateLimitConfig.Tier.AI_TIER2),
            Map.entry("/api/ai/alignment-suggestions", RateLimitConfig.Tier.AI_TIER3),
            Map.entry("/api/ai/weekly-digest", RateLimitConfig.Tier.AI_TIER3),
            Map.entry("/api/auth/login", RateLimitConfig.Tier.AUTH)
    );

    public RateLimitFilter(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Check if path matches a rate-limited endpoint (handle path params)
        RateLimitConfig.Tier tier = null;
        for (var entry : PATH_TIERS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                tier = entry.getValue();
                break;
            }
        }

        if (tier == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Use userId for authenticated endpoints, IP for auth/login
        String key;
        if (tier == RateLimitConfig.Tier.AUTH) {
            key = request.getRemoteAddr();
        } else {
            var user = AuthContextHolder.get();
            key = user != null ? user.userId() : request.getRemoteAddr();
        }

        if (!rateLimitConfig.tryConsume(key, tier)) {
            long waitSeconds = rateLimitConfig.getWaitTimeSeconds(key, tier);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, waitSeconds)));
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Rate limit exceeded\",\"code\":\"RATE_LIMITED\",\"retryAfterSeconds\":" + Math.max(1, waitSeconds) + "}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 4: Verify rate limiting compiles**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/build.gradle.kts backend/src/main/java/com/weeklycommit/config/RateLimitConfig.java backend/src/main/java/com/weeklycommit/config/RateLimitFilter.java
git commit -m "feat: add per-user rate limiting on AI and auth endpoints"
```

---

### Task 14: Input Validation Hardening

**Files:**
- Modify: `backend/src/main/java/com/weeklycommit/dto/CreateCommitRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/UpdateCommitRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/ReconcileCommitRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/CreateWeeklyPlanRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/LoginRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/ManagerReviewRequest.java`
- Modify: `backend/src/main/java/com/weeklycommit/config/GlobalExceptionHandler.java`

- [ ] **Step 1: Add validation constraints to CreateCommitRequest**

Replace the record:

```java
// backend/src/main/java/com/weeklycommit/dto/CreateCommitRequest.java
package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateCommitRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull ChessPriority chessPriority,
        @NotNull UUID outcomeId,
        @Positive @DecimalMax("40.0") BigDecimal plannedHours
) {}
```

- [ ] **Step 2: Add validation constraints to UpdateCommitRequest**

```java
// backend/src/main/java/com/weeklycommit/dto/UpdateCommitRequest.java
package com.weeklycommit.dto;

import com.weeklycommit.enums.ChessPriority;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateCommitRequest(
        @Size(max = 200) String title,
        @Size(max = 2000) String description,
        ChessPriority chessPriority,
        UUID outcomeId,
        @Positive @DecimalMax("40.0") BigDecimal plannedHours,
        @Min(0) Integer sortOrder
) {}
```

- [ ] **Step 3: Add validation constraints to ReconcileCommitRequest**

```java
// backend/src/main/java/com/weeklycommit/dto/ReconcileCommitRequest.java
package com.weeklycommit.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ReconcileCommitRequest(
        @NotNull @Positive BigDecimal actualHours,
        @NotNull @Min(0) @Max(100) Integer completionPct,
        @Size(max = 2000) String reconciliationNotes,
        boolean carryForward
) {}
```

- [ ] **Step 4: Add Monday validation to CreateWeeklyPlanRequest**

```java
// backend/src/main/java/com/weeklycommit/dto/CreateWeeklyPlanRequest.java
package com.weeklycommit.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateWeeklyPlanRequest(
        @NotNull LocalDate weekStartDate
) {
    public CreateWeeklyPlanRequest {
        if (weekStartDate != null && weekStartDate.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            throw new IllegalArgumentException("weekStartDate must be a Monday");
        }
    }
}
```

- [ ] **Step 5: Add size constraints to LoginRequest**

```java
// backend/src/main/java/com/weeklycommit/dto/LoginRequest.java
package com.weeklycommit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 50) String userId,
        @NotBlank @Size(max = 100) String password
) {}
```

- [ ] **Step 6: Enhance GlobalExceptionHandler**

```java
// backend/src/main/java/com/weeklycommit/config/GlobalExceptionHandler.java
package com.weeklycommit.config;

import com.weeklycommit.exception.AiUnavailableException;
import com.weeklycommit.exception.InvalidCredentialsException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        var firstError = ex.getBindingResult().getFieldErrors().stream().findFirst();
        String field = firstError.map(e -> e.getField()).orElse("unknown");
        String message = firstError.map(e -> e.getDefaultMessage()).orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of(
                "error", message,
                "field", field,
                "code", "VALIDATION_ERROR"
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex) {
        var firstViolation = ex.getConstraintViolations().stream().findFirst();
        String message = firstViolation.map(v -> v.getMessage()).orElse("Constraint violation");
        return ResponseEntity.badRequest().body(Map.of(
                "error", message,
                "code", "VALIDATION_ERROR"
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", ex.getMessage(),
                "code", "INVALID_ARGUMENT"
        ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", ex.getMessage(),
                "code", "INVALID_STATE"
        ));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "This resource was modified by another request. Please refresh and try again.",
                "code", "OPTIMISTIC_LOCK_CONFLICT"
        ));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Invalid credentials",
                "code", "INVALID_CREDENTIALS"
        ));
    }

    @ExceptionHandler(AiUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleAiUnavailable(AiUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "AI service is currently unavailable",
                "code", "AI_UNAVAILABLE"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        // Never expose stack traces or internal details
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "An unexpected error occurred",
                "code", "INTERNAL_ERROR"
        ));
    }
}
```

- [ ] **Step 7: Verify validation compiles and existing tests pass**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 8: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/main/java/com/weeklycommit/dto/ backend/src/main/java/com/weeklycommit/config/GlobalExceptionHandler.java
git commit -m "feat: harden input validation with DTO constraints and global error handler"
```

---

### Task 15: Audit Trail

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__audit_log.sql`
- Create: `backend/src/main/java/com/weeklycommit/entity/AuditLog.java`
- Create: `backend/src/main/java/com/weeklycommit/repository/AuditLogRepository.java`
- Create: `backend/src/main/java/com/weeklycommit/service/AuditService.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/WeeklyPlanService.java`

- [ ] **Step 1: Create audit log migration**

```sql
-- backend/src/main/resources/db/migration/V7__audit_log.sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_user_id VARCHAR(255) NOT NULL,
    changes JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

- [ ] **Step 2: Create AuditLog entity**

```java
// backend/src/main/java/com/weeklycommit/entity/AuditLog.java
package com.weeklycommit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "actor_user_id", nullable = false)
    private String actorUserId;

    @Column(columnDefinition = "jsonb")
    private String changes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String entityType, UUID entityId, String action, String actorUserId, String changes) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.actorUserId = actorUserId;
        this.changes = changes;
    }

    public UUID getId() { return id; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getAction() { return action; }
    public String getActorUserId() { return actorUserId; }
    public String getChanges() { return changes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
```

- [ ] **Step 3: Create AuditLogRepository**

```java
// backend/src/main/java/com/weeklycommit/repository/AuditLogRepository.java
package com.weeklycommit.repository;

import com.weeklycommit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);
}
```

- [ ] **Step 4: Create AuditService**

```java
// backend/src/main/java/com/weeklycommit/service/AuditService.java
package com.weeklycommit.service;

import com.weeklycommit.entity.AuditLog;
import com.weeklycommit.repository.AuditLogRepository;
import com.weeklycommit.security.AuthContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, String action, Map<String, Object> changes) {
        var user = AuthContextHolder.get();
        String actorId = user != null ? user.userId() : "system";
        String changesJson = changes != null ? toJson(changes) : null;
        auditLogRepository.save(new AuditLog(entityType, entityId, action, actorId, changesJson));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, String action) {
        log(entityType, entityId, action, null);
    }

    private String toJson(Map<String, Object> map) {
        return "{" + map.entrySet().stream()
                .map(e -> "\"" + e.getKey() + "\":" + formatValue(e.getValue()))
                .collect(Collectors.joining(",")) + "}";
    }

    private String formatValue(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return "\"" + value.toString().replace("\"", "\\\"") + "\"";
        if (value instanceof Map) return toJson((Map<String, Object>) value);
        return value.toString();
    }
}
```

- [ ] **Step 5: Add audit calls to WeeklyPlanService**

Add `AuditService` to the constructor and add audit calls at key points:

```java
// Add to WeeklyPlanService constructor
private final AuditService auditService;

public WeeklyPlanService(
    WeeklyPlanRepository planRepo,
    WeeklyCommitRepository commitRepo,
    OutcomeRepository outcomeRepo,
    AppUserRepository userRepo,
    ManagerReviewRepository reviewRepo,
    AuthorizationService authorizationService,
    AuditService auditService
) {
    // ... existing assignments ...
    this.auditService = auditService;
}
```

Add audit calls after key operations:

In `createPlan()` after save:
```java
auditService.log("WEEKLY_PLAN", plan.getId(), "CREATE",
    Map.of("weekStartDate", plan.getWeekStartDate().toString(), "userId", plan.getUserId()));
```

In `transition()` after status change:
```java
auditService.log("WEEKLY_PLAN", plan.getId(), "TRANSITION",
    Map.of("from", oldStatus.name(), "to", plan.getStatus().name()));
```

In `addCommit()` after save:
```java
auditService.log("COMMIT", commit.getId(), "CREATE",
    Map.of("title", commit.getTitle(), "chessPriority", commit.getChessPriority().name()));
```

In `deleteCommit()` before delete:
```java
auditService.log("COMMIT", commit.getId(), "DELETE",
    Map.of("title", commit.getTitle()));
```

In `reconcileCommit()` after update:
```java
auditService.log("COMMIT", commit.getId(), "RECONCILE",
    Map.of("actualHours", req.actualHours().toString(), "completionPct", req.completionPct().toString(), "carryForward", String.valueOf(req.carryForward())));
```

- [ ] **Step 6: Verify audit trail compiles and tests pass**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew compileJava && ./gradlew test -i`
Expected: BUILD SUCCESSFUL, all tests PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/main/resources/db/migration/V7__audit_log.sql backend/src/main/java/com/weeklycommit/entity/AuditLog.java backend/src/main/java/com/weeklycommit/repository/AuditLogRepository.java backend/src/main/java/com/weeklycommit/service/AuditService.java backend/src/main/java/com/weeklycommit/service/WeeklyPlanService.java
git commit -m "feat: add audit trail for plan, commit, and reconciliation events"
```

---

### Task 16: Security — BCrypt Passwords

**Files:**
- Modify: `backend/src/main/java/com/weeklycommit/service/PasswordHasher.java`
- Create: `backend/src/main/resources/db/migration/V8__bcrypt_passwords.sql`

- [ ] **Step 1: Replace PasswordHasher with BCrypt**

```java
// backend/src/main/java/com/weeklycommit/service/PasswordHasher.java
package com.weeklycommit.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    /**
     * @deprecated Salt is now embedded in bcrypt hash. Returns empty string for compatibility.
     */
    public String generateSalt() {
        return "";
    }

    /**
     * Hash password using BCrypt. The salt parameter is ignored (BCrypt generates its own).
     */
    public String hashPassword(String password, String saltHex) {
        return encoder.encode(password);
    }

    /**
     * Verify password against BCrypt hash. Salt parameter is ignored.
     */
    public boolean matches(String rawPassword, String saltHex, String expectedHash) {
        return encoder.matches(rawPassword, expectedHash);
    }
}
```

- [ ] **Step 2: Add Spring Security Crypto dependency**

Add to `backend/build.gradle.kts` dependencies:

```kotlin
implementation("org.springframework.security:spring-security-crypto:6.2.4")
```

- [ ] **Step 3: Create BCrypt password migration**

```sql
-- backend/src/main/resources/db/migration/V8__bcrypt_passwords.sql
-- Re-hash seed user passwords with BCrypt
-- BCrypt hash for 'password123' with cost factor 12
-- Generated via: new BCryptPasswordEncoder(12).encode("password123")

UPDATE app_users SET
    password_hash = '$2a$12$LJ3m4ys3Gzl4gHBKMH3z3OQX3K5b3W8xMfN7vK9cZ6wR8yP2mS4q',
    password_salt = ''
WHERE user_id IN ('ic1', 'ic2', 'ic3', 'mgr1', 'mgr2', 'mgr3');
```

Note: The actual BCrypt hash will be generated at migration time. The hash above is a placeholder — you must generate the real hash. Add a Java class to generate it:

Actually, since Flyway runs SQL only, we need to pre-compute the hash. Use this approach instead — generate the hash in the migration using a DO block is not possible in plain SQL for BCrypt. Instead, update the `AdminService` or add a migration runner.

Simpler approach: Keep the migration as-is but generate the correct hash. Run this Java snippet once to get the hash:

```java
System.out.println(new BCryptPasswordEncoder(12).encode("password123"));
```

Then paste the output into the SQL migration. The hash will look like `$2a$12$...` (60 chars).

- [ ] **Step 4: Verify password hashing works**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test --tests "com.weeklycommit.controller.AuthControllerTest.loginSuccess" -i`
Expected: PASS (login with password123 works with BCrypt)

- [ ] **Step 5: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/build.gradle.kts backend/src/main/java/com/weeklycommit/service/PasswordHasher.java backend/src/main/resources/db/migration/V8__bcrypt_passwords.sql
git commit -m "feat: replace custom password hashing with BCrypt"
```

---

### Task 17: Security — httpOnly Cookie for JWT

**Files:**
- Modify: `backend/src/main/java/com/weeklycommit/controller/AuthController.java`
- Modify: `backend/src/main/java/com/weeklycommit/security/AuthFilter.java`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/store/useStore.ts`

- [ ] **Step 1: Update AuthController to set cookie on login**

```java
// Modify AuthController.java login method
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@PostMapping("/login")
public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    var authResponse = authService.login(request);

    Cookie cookie = new Cookie("auth_token", authResponse.token());
    cookie.setHttpOnly(true);
    cookie.setSecure(false); // Set to true in production with HTTPS
    cookie.setPath("/api");
    cookie.setMaxAge(12 * 60 * 60); // 12 hours, matches JWT TTL
    cookie.setAttribute("SameSite", "Strict");
    response.addCookie(cookie);

    return authResponse;
}
```

Add a logout endpoint:

```java
@PostMapping("/logout")
public void logout(HttpServletResponse response) {
    Cookie cookie = new Cookie("auth_token", "");
    cookie.setHttpOnly(true);
    cookie.setSecure(false);
    cookie.setPath("/api");
    cookie.setMaxAge(0); // Delete cookie
    cookie.setAttribute("SameSite", "Strict");
    response.addCookie(cookie);
}
```

- [ ] **Step 2: Update AuthFilter to read from cookie**

In `AuthFilter.java`, modify the token extraction logic:

```java
// In the doFilterInternal method, replace the token extraction:
private String extractToken(HttpServletRequest request) {
    // First try Authorization header (for API clients)
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }

    // Then try httpOnly cookie
    if (request.getCookies() != null) {
        for (Cookie cookie : request.getCookies()) {
            if ("auth_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
    }

    return null;
}
```

- [ ] **Step 3: Update frontend API client for cookie-based auth**

In `frontend/src/services/api.ts`, update the `request` function to include credentials:

```typescript
// Replace the request function's fetch call to include credentials
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Keep Bearer token as fallback for non-cookie scenarios (Module Federation host)
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies
  });

  // ... rest of error handling stays the same
}
```

- [ ] **Step 4: Add logout API call**

Add to `frontend/src/services/api.ts`:

```typescript
export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}
```

- [ ] **Step 5: Update store logout to call API**

In `frontend/src/store/useStore.ts`, update the logout action:

```typescript
logout: () => {
  api.logout().catch(() => {}); // Best-effort cookie clear
  set({
    userId: '',
    fullName: '',
    role: 'IC',
    token: '',
    isAuthenticated: false,
    currentPlan: null,
    teamPlans: [],
    rcdoAlignment: [],
  });
  sessionStorage.removeItem('weekly-commit-session');
},
```

- [ ] **Step 6: Verify cookie auth works end-to-end**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test -i`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add backend/src/main/java/com/weeklycommit/controller/AuthController.java backend/src/main/java/com/weeklycommit/security/AuthFilter.java frontend/src/services/api.ts frontend/src/store/useStore.ts
git commit -m "feat: add httpOnly cookie auth with Bearer token fallback"
```

---

### Task 18: Run All Tests — Final Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/backend && ./gradlew test -i`
Expected: All tests PASS

- [ ] **Step 2: Run all frontend tests**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner/frontend && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Verify application starts**

Run: `cd /Users/san/Desktop/Gauntlet/CommitPlanner && docker-compose up -d && cd backend && ./gradlew bootRun`
Expected: Application starts on port 8080, Swagger UI accessible at `/swagger-ui.html`

- [ ] **Step 4: Commit any remaining fixes**

```bash
cd /Users/san/Desktop/Gauntlet/CommitPlanner
git add -A
git commit -m "fix: resolve any remaining issues from Phase 1 hardening"
```
