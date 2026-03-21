# Weekly Commit System (15-Five Replacement)

## Project Overview
Micro-frontend module replacing 15-Five with RCDO-linked weekly planning.
Enforces structural connection between individual weekly commitments and
organizational Rally Cries → Defining Objectives → Outcomes.

## Architecture
- **Frontend**: React 18 + TypeScript (strict) + Webpack Module Federation remote
- **Backend**: Java 21 + Spring Boot 3.2 + Spring Data JPA
- **Database**: PostgreSQL 16 + Flyway migrations
- **State**: Zustand (frontend), JPA entities (backend)

## Structure
```
backend/          Java 21 Spring Boot API (port 8080)
frontend/         React 18 MF remote (port 3001)
docker-compose.yml  PostgreSQL 16
```

## Commands
- `docker-compose up -d` — start PostgreSQL
- `cd backend && ./gradlew bootRun` — start API
- `cd frontend && npm run dev` — start frontend dev server
- `cd frontend && npm test` — run frontend tests
- `cd backend && ./gradlew test` — run backend tests

## Key Patterns
- Weekly lifecycle state machine: DRAFT → LOCKED → RECONCILING → RECONCILED → CARRY_FORWARD
- Chess layer priorities: MUST_DO (A), SHOULD_DO (B), NICE_TO_DO (C)
- RCDO hierarchy: rally_cries → defining_objectives → outcomes
- Optimistic locking on WeeklyPlan (version column)
- Module Federation: remote name `weeklyCommitRemote`, exposes App + individual pages

## API Base
All endpoints under `/api/`. Key routes:
- `/api/rcdo/tree` — full RCDO hierarchy
- `/api/weekly-plans` — plan CRUD
- `/api/weekly-plans/{id}/transition?action=` — state machine
- `/api/commits/{id}/reconcile` — reconciliation
- `/api/manager/team-plans` — manager dashboard
- `/api/manager/rcdo-alignment` — alignment view

## Conventions
- TypeScript strict mode enforced (tsconfig.json)
- Java records for DTOs
- Soft deletes on RCDO hierarchy (active flag)
- UUID primary keys everywhere
- ISO date format for week_start_date
