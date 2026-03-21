# Presearch: Weekly Commit System (15-Five Replacement)

## Project Overview
Replace 15-Five with a production-ready micro-frontend module that enforces structural connection between individual weekly commitments and organizational RCDO hierarchy (Rally Cries → Defining Objectives → Outcomes). Full weekly lifecycle with commit entry, prioritization, reconciliation, and manager review.

## Constraints (Loop 1 — LOCKED)

| Constraint | Decision |
|-----------|----------|
| Domain | Weekly planning tool replacing 15-Five |
| RCDO Data | This system owns the hierarchy |
| Host App | Unknown — assume Webpack Module Federation |
| Timeline | 1 day |
| Scale | 50-500 users, ~50 concurrent peak |
| Data Sensitivity | Internal employee performance data |
| Required Languages | TypeScript (strict), Java 21, SQL |

## Architecture Decisions (Loop 2 — LOCKED)

### Pattern
Micro-frontend (Module Federation remote) + REST API + PostgreSQL

```
Browser → [Host App] → [MF Remote: Weekly Commits Module]
                              ↓
                        [Java 21 Spring Boot REST API]
                              ↓
                        [PostgreSQL 16]
```

### Tech Stack

| Layer | Choice | Alternatives Considered | Why |
|-------|--------|------------------------|-----|
| Frontend | React 18 + TypeScript strict | Vue, Angular | Universal MF support, largest ecosystem |
| Bundler | Webpack 5 Module Federation | Vite + vite-plugin-federation | WMF is the standard PM remote pattern |
| State Management | Zustand | Redux Toolkit, Jotai | Minimal boilerplate for 1-day deadline |
| UI | Tailwind CSS + headless | MUI, Ant Design | No design system overhead, fast styling |
| Backend | Java 21 + Spring Boot 3.2 | Quarkus, Micronaut | Required language, fastest to scaffold |
| API Style | REST (JSON) | GraphQL, gRPC | Simplicity, time constraint |
| Database | PostgreSQL 16 | MySQL, H2 | Best SQL DB, JSONB flexibility, production-grade |
| Migrations | Flyway | Liquibase | Spring Boot standard, simpler syntax |
| FE Testing | Vitest | Jest | Faster, native ESM |
| BE Testing | JUnit 5 + MockMvc | TestContainers | Speed for 1-day build |
| Build | Gradle Kotlin DSL | Maven | Modern, concise |

### Data Architecture

#### RCDO Hierarchy
```
rally_cries (org-level goals)
  └── defining_objectives (team-level objectives)
       └── outcomes (measurable results)
```

#### Weekly Lifecycle State Machine
```
DRAFT → LOCKED → RECONCILING → RECONCILED
  ↑                                 │
  │         CARRY_FORWARD ←─────────┘
  │              │
  └──────────────┘ (creates new DRAFT)
```

**Transitions:**
- DRAFT → LOCKED: IC submits weekly plan (locks commits)
- LOCKED → RECONCILING: Week ends, IC begins reconciliation
- RECONCILING → RECONCILED: IC completes all reconciliation entries
- RECONCILED → CARRY_FORWARD: Manager reviews, incomplete items flagged
- CARRY_FORWARD → new DRAFT: System auto-creates next week with carried items

#### Chess Layer (Prioritization)
| Priority | Label | Description |
|----------|-------|-------------|
| A | Must Do | Non-negotiable commitments |
| B | Should Do | Important but flexible |
| C | Nice to Do | Aspirational / stretch |

### Core SQL Schema
```sql
-- RCDO Hierarchy
rally_cries(id, name, description, active, created_at, updated_at)
defining_objectives(id, rally_cry_id FK, name, description, active, created_at, updated_at)
outcomes(id, defining_objective_id FK, name, description, measurable_target, active, created_at, updated_at)

-- Weekly Planning
weekly_plans(id, user_id, week_start_date, status ENUM, created_at, updated_at)
weekly_commits(id, weekly_plan_id FK, title, description, chess_priority ENUM, outcome_id FK, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, created_at, updated_at)

-- Manager Review
manager_reviews(id, weekly_plan_id FK, reviewer_id, status ENUM, feedback, reviewed_at, created_at)
```

## Failure Modes (Loop 3 — Compressed)

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Invalid state transition | Data corruption | Enum-based state machine with guard clauses |
| Concurrent plan edits | Lost updates | Optimistic locking (version column) |
| Orphaned carry-forwards | Missing work items | FK constraints + transaction wrapping |
| MF remote fails to load | Blank screen in host | Error boundary + fallback UI |

## Security
- Auth delegated to host app (JWT passed via MF props/headers)
- API validates JWT on every request
- Users can only see/edit own commits; managers see direct reports
- No SQL injection risk (JPA parameterized queries)

## Risks & Limitations
- Host app integration untested (unknown host stack)
- No offline support
- No notifications/reminders
- No historical analytics beyond current + previous week
- Chess layer is simple categorization, not weighted scoring

## Cost
- $0 infrastructure during dev (local Docker)
- Production: ~$20-50/mo for small org (managed Postgres + container hosting)
