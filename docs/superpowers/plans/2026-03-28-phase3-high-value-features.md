# Phase 3: High-Value Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add analytics, capacity planning, calendar view, comments, export, templates, and advanced filtering.

**Tech Stack:** Recharts (charts), OpenCSV (CSV export), Apache PDFBox (PDF), Flyway migrations

---

## Task 1: Analytics Backend

**Files:**
- Create: `backend/src/main/java/com/weeklycommit/controller/AnalyticsController.java`
- Create: `backend/src/main/java/com/weeklycommit/service/AnalyticsService.java`
- Create: `backend/src/main/java/com/weeklycommit/dto/analytics/*.java` (VelocityPoint, CompletionPoint, HoursAccuracyPoint, CarryForwardPoint, CoverageTrendPoint)

### Endpoints:
- `GET /api/analytics/velocity?from=&to=` — commits completed per week
- `GET /api/analytics/completion?from=&to=` — avg completion % per week
- `GET /api/analytics/hours-accuracy?from=&to=` — planned vs actual per commit
- `GET /api/analytics/carry-forward-rate?from=&to=` — % carried forward per week
- `GET /api/analytics/rcdo-coverage?from=&to=` — alignment rate % per week
- `GET /api/analytics/capacity?weekStart=` — per-member hours breakdown

All manager-scoped (only assigned team members).

### DTOs:
```java
record VelocityPoint(LocalDate weekStart, int completedCount, int totalCount) {}
record CompletionPoint(LocalDate weekStart, double avgCompletionPct) {}
record HoursAccuracyPoint(UUID commitId, String title, BigDecimal plannedHours, BigDecimal actualHours) {}
record CarryForwardPoint(LocalDate weekStart, double carryForwardPct) {}
record CoverageTrendPoint(LocalDate weekStart, double alignmentRatePct) {}
record CapacityEntry(String userId, String fullName, BigDecimal totalPlannedHours, BigDecimal capacityHours, Map<String, BigDecimal> priorityBreakdown) {}
```

### Service logic:
- Query `WeeklyPlanRepository.findByUserIdInAndWeekStartDateBetween()` for team members in date range
- Aggregate per-week stats from commits
- Capacity: sum planned_hours per user for given week

---

## Task 2: Analytics Frontend Page

**Files:**
- Install: `recharts` dependency
- Create: `frontend/src/pages/AnalyticsPage.tsx`
- Modify: `frontend/src/services/api.ts` (add analytics endpoints)
- Modify: `frontend/src/types/index.ts` (add analytics types)
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/Sidebar.tsx` (add nav link)

### Charts (using Recharts):
- Team velocity: LineChart (weekStart vs completedCount)
- Completion trend: LineChart (weekStart vs avgCompletionPct)
- Hours accuracy: ScatterChart (plannedHours vs actualHours)
- Carry-forward rate: LineChart (weekStart vs carryForwardPct)
- RCDO coverage: LineChart (weekStart vs alignmentRatePct)

### Layout:
- Date range picker (from/to, default last 12 weeks)
- Metric summary cards at top
- 2-column grid of charts on desktop, stacked on mobile
- Manager-only page

---

## Task 3: Capacity Planning Page

**Files:**
- Create: `backend/src/main/resources/db/migration/V12__user_capacity.sql`
- Modify: `backend/src/main/java/com/weeklycommit/entity/AppUser.java`
- Create: `frontend/src/pages/CapacityPlanningPage.tsx`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/Sidebar.tsx` (add nav link)

### Migration:
```sql
ALTER TABLE app_users ADD COLUMN capacity_hours NUMERIC(5,1) NOT NULL DEFAULT 40.0;
```

### Frontend:
- Week selector
- Team heatmap: rows=members, color-coded bars (green <80%, yellow 80-100%, red >100% of capacity)
- Per-member: total planned hours vs capacity bar
- Priority breakdown per member
- Overcommitment alert banner

---

## Task 4: 90-Day Calendar View

**Files:**
- Create: `frontend/src/pages/CalendarViewPage.tsx`
- Modify: `frontend/src/services/api.ts` (add calendar endpoint)
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/Sidebar.tsx`

### Backend:
- `GET /api/weekly-plans/calendar?from=&to=` — returns `List<CalendarEntry>` with planId, weekStartDate, status, commitCount, avgCompletionPct
- Add to existing WeeklyPlanController

### Frontend:
- 13-row week grid (rolling quarter)
- Color-coded cells by status: gray=none, blue=DRAFT, yellow=LOCKED, orange=RECONCILING, green=RECONCILED, purple=CARRY_FORWARD
- Click week → navigate to plan
- Top summary: consecutive locked streak, 90-day avg completion
- IC sees own, manager can toggle team members

---

## Task 5: Comments/Threads on Commits

**Files:**
- Create: `backend/src/main/resources/db/migration/V13__comments.sql`
- Create: `backend/src/main/java/com/weeklycommit/entity/CommitComment.java`
- Create: `backend/src/main/java/com/weeklycommit/repository/CommitCommentRepository.java`
- Create: `backend/src/main/java/com/weeklycommit/service/CommitCommentService.java`
- Create: `backend/src/main/java/com/weeklycommit/controller/CommitCommentController.java`
- Create: `backend/src/main/java/com/weeklycommit/dto/CommentRequest.java`
- Create: `backend/src/main/java/com/weeklycommit/dto/CommentResponse.java`
- Modify: frontend pages to show comment threads

### Migration:
```sql
CREATE TABLE commit_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id UUID NOT NULL REFERENCES weekly_commits(id) ON DELETE CASCADE,
  author_user_id VARCHAR(255) NOT NULL REFERENCES app_users(user_id),
  body TEXT NOT NULL,
  parent_comment_id UUID REFERENCES commit_comments(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_commit ON commit_comments(commit_id);
```

### Endpoints:
- `GET /api/commits/{commitId}/comments` — nested list
- `POST /api/commits/{commitId}/comments` — add (body, optional parentCommentId)
- `PUT /api/comments/{id}` — edit own (within 24h)
- `DELETE /api/comments/{id}` — delete own

### Frontend:
- Expandable comment section below each commit
- Inline reply form
- Comment count badge on commits

---

## Task 6: CSV/PDF Export

**Files:**
- Modify: `backend/build.gradle.kts` (add OpenCSV + PDFBox)
- Create: `backend/src/main/java/com/weeklycommit/controller/ExportController.java`
- Create: `backend/src/main/java/com/weeklycommit/service/ExportService.java`
- Modify: frontend pages (add download buttons)

### Dependencies:
```kotlin
implementation("com.opencsv:opencsv:5.9")
implementation("org.apache.pdfbox:pdfbox:3.0.2")
```

### Endpoints:
- `GET /api/export/plan/{id}?format=csv|pdf`
- `GET /api/export/team?weekStart=&format=csv`
- `GET /api/export/analytics?from=&to=&type=velocity|completion|hours`

### Frontend:
- Download buttons on plan detail, manager dashboard, analytics page
- Opens download in new tab

---

## Task 7: Recurring Commit Templates

**Files:**
- Create: `backend/src/main/resources/db/migration/V14__templates.sql`
- Create: `backend/src/main/java/com/weeklycommit/entity/CommitTemplate.java`
- Create: `backend/src/main/java/com/weeklycommit/repository/CommitTemplateRepository.java`
- Create: `backend/src/main/java/com/weeklycommit/service/CommitTemplateService.java`
- Create: `backend/src/main/java/com/weeklycommit/controller/CommitTemplateController.java`
- Modify: frontend WeeklyPlanPage (save/apply template buttons)

### Migration:
```sql
CREATE TABLE commit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES app_users(user_id),
  name VARCHAR(200) NOT NULL,
  commits JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_templates_user ON commit_templates(user_id);
```

### Endpoints:
- `GET /api/templates` — list user's templates
- `POST /api/templates` — save current plan commits as template
- `POST /api/templates/{id}/apply?planId=` — add template commits to DRAFT plan
- `DELETE /api/templates/{id}` — remove

### Frontend:
- "Save as Template" button on DRAFT plan
- "Apply Template" dropdown/modal
- Template management in settings

---

## Task 8: Advanced Dashboard Filtering

**Files:**
- Create: `frontend/src/components/FilterBar.tsx`
- Modify: `frontend/src/pages/ManagerDashboardPage.tsx`
- Modify: `frontend/src/pages/TeamAlignmentPage.tsx`
- Modify: `frontend/src/pages/TeamWorkspacePage.tsx`
- Modify: backend endpoints to accept filter query params

### FilterBar component:
- Team member multi-select
- Chess priority checkboxes
- Plan status checkboxes
- Rally cry dropdown
- Date range picker
- Completion threshold slider
- "Clear all" button
- Filter state persisted in URL search params

### Backend:
- Extend existing manager endpoints with optional query params: `?members=&priorities=&statuses=&rallyCryId=&completionBelow=`
- Add WHERE clauses based on params

---

## Task 9: Final Verification

- Run all backend tests
- Run all frontend tests
- Verify webpack builds clean
- Manual smoke test of each new feature
