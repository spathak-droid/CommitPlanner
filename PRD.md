# PRD: Weekly Commit System (15-Five Replacement)

## Overview
Production-ready micro-frontend module that replaces 15-Five with RCDO-linked weekly planning. Enforces structural connection between individual weekly commitments and organizational Rally Cries, Defining Objectives, and Outcomes.

## Phase Dependency Map
```
Phase 1 (Scaffold)
  └── Phase 2 (RCDO Hierarchy) + Phase 3 (Weekly Commits + Chess Layer) [parallel after scaffold]
       └── Phase 4 (State Machine + Lifecycle)
            └── Phase 5 (Reconciliation View)
                 └── Phase 6 (Manager Dashboard)
                      └── Phase 7 (Module Federation Wiring)
                           └── Phase 8 (Integration Tests + Polish)
```

---

## Phase 1: Project Scaffold
**Goal:** Monorepo with Spring Boot backend, React MF frontend, PostgreSQL, all wired and running.
**Estimated effort:** 1 hour

### Requirements
- [ ] Monorepo structure: `/backend` (Java 21 + Spring Boot 3.2 + Gradle) and `/frontend` (React 18 + TypeScript strict + Webpack 5)
- [ ] PostgreSQL Docker Compose setup
- [ ] Flyway migration runner configured
- [ ] Initial schema migration (all tables)
- [ ] Spring Boot app boots and connects to DB
- [ ] React app builds and renders placeholder
- [ ] Module Federation plugin configured (remote)
- [ ] CORS configured for MF integration
- [ ] API health endpoint responds

### Acceptance Criteria
- `docker-compose up` starts PostgreSQL
- `./gradlew bootRun` starts API on :8080
- `npm run dev` starts frontend on :3001
- `GET /api/health` returns 200

---

## Phase 2: RCDO Hierarchy CRUD
**Goal:** Full CRUD for Rally Cries → Defining Objectives → Outcomes hierarchy.
**Depends on:** Phase 1
**Estimated effort:** 30 minutes

### Requirements
- [ ] JPA entities: RallyCry, DefiningObjective, Outcome
- [ ] REST endpoints: CRUD for each entity with proper nesting
- [ ] Frontend: RCDO hierarchy tree view component
- [ ] Seed data migration with sample RCDO hierarchy

### Acceptance Criteria
- Can create/read/update/delete Rally Cries, Defining Objectives, Outcomes via API
- Outcomes are properly linked to Defining Objectives, which link to Rally Cries
- Frontend displays the hierarchy as a navigable tree
- Seed data loads on first boot

### API Endpoints
```
GET/POST       /api/rally-cries
GET/PUT/DELETE /api/rally-cries/{id}
GET/POST       /api/rally-cries/{id}/defining-objectives
GET/PUT/DELETE /api/defining-objectives/{id}
GET/POST       /api/defining-objectives/{id}/outcomes
GET/PUT/DELETE /api/outcomes/{id}
GET            /api/rcdo/tree  (full hierarchy)
```

---

## Phase 3: Weekly Commits CRUD + Chess Layer
**Goal:** Users can create weekly commits linked to RCDO outcomes with chess-layer prioritization.
**Depends on:** Phase 1
**Estimated effort:** 1.5 hours

### Requirements
- [ ] JPA entities: WeeklyPlan, WeeklyCommit
- [ ] REST endpoints: CRUD for plans and commits
- [ ] Chess layer enum: MUST_DO (A), SHOULD_DO (B), NICE_TO_DO (C)
- [ ] Each commit links to exactly one Outcome
- [ ] Frontend: Commit entry form with RCDO picker and chess priority selector
- [ ] Frontend: Weekly plan view grouped by chess priority
- [ ] Planned hours field per commit

### Acceptance Criteria
- Can create a weekly plan for a given week
- Can add commits with title, description, chess priority, outcome link, planned hours
- Commits display grouped by chess priority (A → B → C)
- Cannot create duplicate plan for same user + week

### API Endpoints
```
GET/POST       /api/weekly-plans
GET/PUT        /api/weekly-plans/{id}
GET            /api/weekly-plans/current  (current week for authenticated user)
GET/POST       /api/weekly-plans/{id}/commits
GET/PUT/DELETE /api/commits/{id}
```

---

## Phase 4: Weekly Lifecycle State Machine
**Goal:** Enforce DRAFT → LOCKED → RECONCILING → RECONCILED → CARRY_FORWARD lifecycle.
**Depends on:** Phase 3
**Estimated effort:** 1 hour

### Requirements
- [ ] State enum on WeeklyPlan: DRAFT, LOCKED, RECONCILING, RECONCILED, CARRY_FORWARD
- [ ] Transition endpoints with guard clauses (no invalid transitions)
- [ ] DRAFT → LOCKED: locks all commits, no more edits
- [ ] LOCKED → RECONCILING: enables reconciliation fields
- [ ] RECONCILING → RECONCILED: requires all commits reconciled
- [ ] RECONCILED → CARRY_FORWARD: flags incomplete items
- [ ] CARRY_FORWARD: auto-creates next week DRAFT with carried items
- [ ] Frontend: status badge + transition buttons per state
- [ ] Optimistic locking (version column) on WeeklyPlan

### Acceptance Criteria
- State transitions follow exact state machine — invalid transitions return 400
- Locked plan commits cannot be edited
- Reconciliation requires actual_hours and completion_pct on every commit
- Carry forward creates new plan with incomplete items pre-populated
- Version conflict returns 409

### API Endpoints
```
POST /api/weekly-plans/{id}/transition?action=LOCK
POST /api/weekly-plans/{id}/transition?action=START_RECONCILIATION
POST /api/weekly-plans/{id}/transition?action=RECONCILE
POST /api/weekly-plans/{id}/transition?action=CARRY_FORWARD
```

---

## Phase 5: Reconciliation View
**Goal:** Side-by-side view comparing planned vs. actual for each commit.
**Depends on:** Phase 4
**Estimated effort:** 1 hour

### Requirements
- [ ] Reconciliation form: actual_hours, completion_pct (0-100), reconciliation_notes, carry_forward flag
- [ ] Side-by-side layout: planned (left) vs. actual (right)
- [ ] Visual indicators: green (≥80% complete), yellow (50-79%), red (<50%)
- [ ] Summary stats: total planned hours vs actual, overall completion rate
- [ ] Chess layer breakdown in summary

### Acceptance Criteria
- Each commit shows planned hours alongside actual hours input
- Completion percentage drives color coding
- Summary shows aggregate stats
- Cannot transition to RECONCILED until all commits have actual_hours and completion_pct

---

## Phase 6: Manager Dashboard
**Goal:** Manager sees team roll-up of weekly commits mapped to RCDO hierarchy.
**Depends on:** Phase 5
**Estimated effort:** 1 hour

### Requirements
- [ ] Team view: list of direct reports with their weekly plan status
- [ ] Drill-down: click team member to see their full weekly plan
- [ ] RCDO alignment view: group all team commits by Rally Cry / Defining Objective
- [ ] Identify gaps: which Outcomes have zero commits
- [ ] Manager review: approve/flag with feedback
- [ ] Roll-up stats: team hours by RCDO, chess priority distribution

### Acceptance Criteria
- Manager sees all direct reports' plan statuses
- Can drill into any team member's plan
- RCDO alignment view shows commit distribution across hierarchy
- Can submit review with feedback text
- Uncovered Outcomes are visually flagged

### API Endpoints
```
GET /api/manager/team-plans?weekStart={date}
GET /api/manager/rcdo-alignment?weekStart={date}
POST /api/manager/reviews
```

---

## Phase 7: Module Federation Wiring
**Goal:** Frontend exposes proper MF remote entry for host app consumption.
**Depends on:** Phase 6
**Estimated effort:** 30 minutes

### Requirements
- [ ] ModuleFederationPlugin configured as remote
- [ ] Exposes: WeeklyCommitApp (root), WeeklyPlanView, ManagerDashboard
- [ ] Shared deps: react, react-dom (singleton)
- [ ] Bootstrap pattern (async import)
- [ ] Props interface for host: userId, role, apiBaseUrl, authToken
- [ ] Error boundary wrapping exposed components
- [ ] Standalone dev mode (runs independently for development)

### Acceptance Criteria
- `remoteEntry.js` generated at build time
- Host can load WeeklyCommitApp via dynamic import
- Shared React instance (no duplicate React)
- Standalone mode works for development

---

## Phase 8: Integration Tests + Polish
**Goal:** Key flows tested end-to-end, UI polished.
**Depends on:** Phase 7
**Estimated effort:** 30 minutes

### Requirements
- [ ] Backend: integration tests for state machine transitions
- [ ] Backend: integration test for carry-forward flow
- [ ] Backend: integration test for manager review flow
- [ ] Frontend: component tests for commit form, reconciliation view
- [ ] Error handling: toast notifications for failures
- [ ] Loading states on all async operations
- [ ] Responsive layout (desktop primary)

### Acceptance Criteria
- All integration tests pass
- No unhandled promise rejections
- All API errors show user-friendly messages
- App is usable on 1024px+ screens

---

## MVP Validation Checklist

| # | Requirement | Phase | Status |
|---|-------------|-------|--------|
| 1 | Weekly commit CRUD with RCDO linking | 2, 3 | [ ] |
| 2 | Chess layer categorization + prioritization | 3 | [ ] |
| 3 | Full lifecycle state machine | 4 | [ ] |
| 4 | Reconciliation view (planned vs actual) | 5 | [ ] |
| 5 | Manager dashboard with team roll-up | 6 | [ ] |
| 6 | Micro-frontend Module Federation remote | 7 | [ ] |
| 7 | TypeScript strict mode | 1 | [ ] |
| 8 | Java 21 backend | 1 | [ ] |
| 9 | SQL persistence | 1 | [ ] |

## Stretch Goals (not in scope for 1-day build)
1. Email/Slack reminders for unfilled weekly plans
2. Historical analytics (trends over weeks)
3. Drag-and-drop commit reordering
4. Dark mode
5. Offline support
