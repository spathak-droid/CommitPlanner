# CommitPlanner Enhancements — Design Spec

**Date:** 2026-03-28
**Approach:** Foundation First — 3 sequential phases

---

## Phase 1: Production Hardening

### 1.1 Backend Integration Tests

**Tech:** JUnit 5 + Spring Boot Test + Testcontainers (PostgreSQL)

**Test suites:**
- `WeeklyPlanServiceTest` — Plan CRUD, duplicate prevention, optimistic lock conflicts
- `StateMachineTest` — All 5 transitions + invalid transition rejection + precondition guards (can't lock empty plan, can't reconcile without actuals)
- `ReconciliationTest` — Actual hours/completion entry, carry-forward creates next week plan with `[CF]` prefix
- `RcdoServiceTest` — Hierarchy CRUD, soft delete cascading, prevent linking to inactive outcomes
- `ManagerServiceTest` — Team plans visibility scoped to assignments, review submission, alignment calculation
- `AuthTest` — Login success/failure, JWT validation, expired token rejection
- `AuthorizationTest` — IC can't access manager endpoints, manager can't see unassigned ICs
- `AiServiceTest` — Mock external API, verify caching, verify rate limiting

### 1.2 Frontend Tests

**Tech:** Vitest + React Testing Library + MSW (Mock Service Worker)

**Test suites:**
- `useStore.test.ts` — Zustand store: auth state, plan loading, toast management, session persistence
- `CommitForm.test.tsx` — Form validation, chess priority selection, outcome picker, submit/cancel
- `ReconciliationRow.test.tsx` — Actual hours input, completion slider, carry-forward toggle, notes
- `StatusBadge.test.tsx` — Correct colors/labels for all 5 states
- `ChessBadge.test.tsx` — Correct rendering for MUST_DO/SHOULD_DO/NICE_TO_DO
- `WeeklyPlanPage.test.tsx` — Renders plan, transition button states, DRAFT-only editing
- `ManagerDashboardPage.test.tsx` — Team stats render, drill-down, review submission
- `RcdoPicker.test.tsx` — Tree rendering, selection, inactive outcomes hidden
- `api.test.ts` — Auth header injection, error handling, API error class

### 1.3 API Documentation (Swagger/OpenAPI)

- Add `springdoc-openapi-starter-webmvc-ui` dependency
- Annotate controllers with `@Operation`, `@ApiResponse`, `@Tag`
- Available at `/swagger-ui.html`
- Groups: Auth, RCDO, Weekly Plans, Manager, AI, Admin, Notifications

### 1.4 Rate Limiting

**Tech:** Bucket4j with in-memory token buckets

**Limits:**
| Tier | Endpoints | Limit |
|---|---|---|
| Tier 1 | matchOutcomes, estimateHours | 30 req/min per user |
| Tier 2 | suggestCommit, reconciliationAssist, reviewInsight | 10 req/min per user |
| Tier 3 | alignmentSuggestions, weeklyDigest | 5 req/min per user |
| Auth | login | 5 req/min per IP |

Returns `429 Too Many Requests` with `Retry-After` header. Frontend shows toast.

### 1.5 Input Validation Hardening

**DTO constraints:**
- `CreateCommitRequest` — `@NotBlank` title (max 200), `@NotNull` chessPriority, `@Positive` plannedHours (max 40), optional outcomeId must exist
- `UpdateCommitRequest` — Same as create, `@Min(0) @Max(100)` completionPct
- `ReconcileCommitRequest` — `@NotNull @Positive` actualHours, `@NotNull @Min(0) @Max(100)` completionPct
- `CreatePlanRequest` — `@NotNull` weekStartDate must be a Monday
- Login request — `@NotBlank` userId (max 50), `@NotBlank` password (max 100)
- Manager review — `@NotNull` status, `@Size(max 2000)` feedback
- RCDO creates — `@NotBlank` name (max 200), `@Size(max 2000)` description

**Global error handler:**
- `@RestControllerAdvice` returns consistent JSON: `{ "error": "...", "field": "...", "code": "VALIDATION_ERROR" }`
- Strips stack traces from responses
- Maps `ConstraintViolationException`, `MethodArgumentNotValidException`, `OptimisticLockingFailureException`

### 1.6 Audit Trail

**Migration:** `V7__audit_log.sql`

**Table:**
```sql
audit_log (
  id UUID PRIMARY KEY,
  entity_type VARCHAR NOT NULL,  -- WEEKLY_PLAN, COMMIT, RCDO, REVIEW, USER
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,       -- CREATE, UPDATE, DELETE, TRANSITION, RECONCILE, REVIEW
  actor_user_id VARCHAR NOT NULL,
  changes JSONB,                 -- { "field": { "old": x, "new": y } }
  created_at TIMESTAMP DEFAULT now()
)
```

**Logged events:**
- Plan created, state transitions
- Commit added/edited/deleted, reconciliation submitted
- Manager review (APPROVED/FLAGGED)
- RCDO created/edited/archived
- User created/deactivated

**Implementation:** Explicit `AuditService.log()` calls from services. No UI in Phase 1.

### 1.7 Security Fixes

**Fix 1 — BCrypt passwords:**
- Replace custom `PasswordHasher` with `BCryptPasswordEncoder`
- Migration `V8__rehash_passwords.sql` resets seed users with BCrypt hashes
- Drop `password_salt` column

**Fix 2 — httpOnly cookie for JWT:**
- Backend sets `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api`
- Frontend removes localStorage token storage — cookie sent automatically
- CSRF protection via `SameSite=Strict` + `Origin` header verification on mutations
- Logout endpoint clears cookie server-side

---

## Phase 2: PRD Completeness

### 2.1 Notifications End-to-End

**Triggers:**
| Event | Recipient | Type |
|---|---|---|
| IC locks plan | Manager | NUDGE |
| IC completes reconciliation | Manager | SYSTEM |
| Manager approves plan | IC | REVIEW_APPROVED |
| Manager flags plan | IC | REVIEW_FLAGGED |
| Plan still DRAFT on Wednesday | IC | NUDGE |
| Carry-forward created | IC | SYSTEM |

**Real-time delivery — SSE:**
- `GET /api/notifications/stream` — SSE endpoint per user via `SseEmitter`
- Frontend `NotificationBell` subscribes on login, shows unread count badge
- Fallback: polling every 30s if SSE drops

**Endpoints:**
- `GET /api/notifications` — paginated list, unread first
- `PUT /api/notifications/{id}/read` — mark single as read
- `PUT /api/notifications/read-all` — mark all as read
- `DELETE /api/notifications/{id}` — dismiss

**Scheduled nudge:** Spring `@Scheduled` Wednesday 9am, creates NUDGE for DRAFT plans.

### 2.2 Email Notification Delivery

**Tech:** Spring Boot Mail (`spring-boot-starter-mail`)

**Migration:** `V9__user_email.sql` — adds `email` and `email_notifications_enabled` columns to `app_users`

**Config:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` env vars

**Delivery:**
- `NotificationDispatcher` dispatches to: in-app (always) + email (if enabled)
- Simple HTML templates (string interpolation, no template engine)
- `@Async` delivery — never blocks the request
- Failed deliveries logged, no retry

### 2.3 Module Federation Production Integration

**Deliverables:**
- Clean `webpack.config.js`: correct `exposes` (App + individual pages) and `shared` (React, ReactDOM, Zustand as singletons)
- `federation-test-host/` — minimal shell app (< 100 lines) that loads the remote
- Tests: host loads remote, routing works, auth token passthrough, styles don't leak
- `docs/module-federation.md` — integration guide for PA host team

### 2.4 Carry-Forward UX Polish

**Migration:** `V10__carry_forward_lineage.sql` — adds `carried_from_commit_id` (nullable UUID) on `weekly_commits`

**Improvements:**
- Dedicated CF badge instead of `[CF]` title prefix
- Confirmation modal before CARRY_FORWARD transition: "X items will carry to next week"
- Banner on next week plan: "Includes {count} items carried from {date}" with link
- Carried items show original planned hours alongside new values
- Skip plan creation if 0 items marked carry-forward (show toast instead)
- Manager dashboard shows CF badge on carried items
- `CommitResponse` DTO includes `carriedFromWeek` date if applicable

---

## Phase 3: High-Value Features

### 3.1 Analytics Dashboard

**Metrics:**
- Team velocity — line chart, total commits completed/week, last 12 weeks
- Completion rate trend — line chart, avg completion %/week
- Chess priority distribution — stacked bar chart over time
- Hours accuracy — scatter plot, planned vs actual hours per commit
- Carry-forward rate — line chart, % carried forward/week
- IC comparison — horizontal bar, completion rate by member for date range
- RCDO coverage trend — line chart, alignment rate %/week

**Backend:** `AnalyticsController` with 5 endpoints (`/api/analytics/velocity`, `/completion`, `/hours-accuracy`, `/carry-forward-rate`, `/rcdo-coverage`). Accept `?from=&to=&userId=`. Manager-scoped.

**Frontend:** `AnalyticsPage` with Recharts. Date range picker + metric cards + charts. Responsive grid.

### 3.2 Capacity Planning View

**Migration:** `V11__user_capacity.sql` — adds `capacity_hours` (default 40) on `app_users`

**View:**
- Team heatmap: rows = members, columns = days, cells = hours (green < 8h, yellow 8-10h, red > 10h)
- Weekly totals: per-member bar, planned hours vs capacity
- Priority breakdown: hours by MUST_DO/SHOULD_DO/NICE_TO_DO per member
- Overcommitment alerts: banner when IC exceeds capacity
- Unallocated capacity: members with significant free hours

**Backend:** `GET /api/analytics/capacity?weekStart=` — per-member hours breakdown. Manager-only.

**Frontend:** `CapacityPlanningPage` — week selector + heatmap + bars.

### 3.3 90-Day Rolling Calendar View

**Backend:** `GET /api/weekly-plans/calendar?from=&to=` — lightweight plan summaries (status, commit count, completion %) for date range. Works for IC (own) and manager (team).

**Frontend:** `CalendarViewPage`
- 13-row week grid, color-coded by status: gray (none), blue (DRAFT), yellow (LOCKED), orange (RECONCILING), green (RECONCILED), purple (CARRY_FORWARD)
- Click week → navigates to plan detail
- Top summary: consecutive locked-plan streak, 90-day avg completion
- IC sees own history, manager toggles between team members

### 3.4 Comments/Threads on Commits

**Migration:** `V12__comments.sql`

**Table:**
```sql
commit_comments (
  id UUID PRIMARY KEY,
  commit_id UUID NOT NULL REFERENCES weekly_commits(id) ON DELETE CASCADE,
  author_user_id VARCHAR NOT NULL REFERENCES app_users(user_id),
  body TEXT NOT NULL,  -- max 2000 chars
  parent_comment_id UUID REFERENCES commit_comments(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**Endpoints:**
- `GET /api/commits/{commitId}/comments` — nested list
- `POST /api/commits/{commitId}/comments` — add (body, optional parentCommentId)
- `PUT /api/comments/{id}` — edit own (within 24h only)
- `DELETE /api/comments/{id}` — delete own

**Rules:**
- IC (plan owner) and assigned manager can comment
- Allowed in any plan status
- New comment triggers notification to other party

**Frontend:** Expandable comment thread below each commit row. Unread dot indicator. Inline reply form.

### 3.5 CSV/PDF Export

**Exports:**
| Export | Format | Contents |
|---|---|---|
| Weekly plan | CSV | Commits: title, priority, outcome, planned/actual hours, completion %, notes |
| Weekly plan | PDF | Formatted plan with status, commits table, reconciliation summary |
| Team summary | CSV | All team members' plans for a given week |
| Analytics | CSV | Raw data behind any chart |

**Backend:**
- `GET /api/export/plan/{id}?format=csv|pdf`
- `GET /api/export/team?weekStart=&format=csv`
- CSV: OpenCSV
- PDF: Apache PDFBox

**Frontend:** Download buttons on plan detail, manager dashboard, analytics page.

### 3.6 Recurring Commit Templates

**Migration:** `V13__templates.sql`

**Table:**
```sql
commit_templates (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES app_users(user_id),
  name VARCHAR(200) NOT NULL,
  commits JSONB NOT NULL,  -- [{ title, description, chessPriority, outcomeId, plannedHours }]
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**Endpoints:**
- `GET /api/templates` — list user's templates
- `POST /api/templates` — save current plan commits as template
- `POST /api/templates/{id}/apply?planId=` — add template commits to DRAFT plan
- `DELETE /api/templates/{id}` — remove template

**Frontend:** "Save as template" button (DRAFT state). "Apply template" dropdown. Template manager in settings.

### 3.7 Advanced Dashboard Filtering

**Filters:**
- Team member — multi-select from assigned ICs
- Chess priority — MUST_DO / SHOULD_DO / NICE_TO_DO
- Plan status — any combination of 5 statuses
- Rally cry — filter by specific rally cry
- Date range — custom range picker
- Completion threshold — below X%

**Implementation:**
- Reusable `FilterBar` component across manager pages
- Filters as query params to existing endpoints (backend adds `WHERE` clauses)
- Filter state in URL params (shareable)
- "Clear all filters" reset

---

## Summary

| Phase | Items | New Migrations | New Endpoints |
|---|---|---|---|
| Phase 1 — Production Hardening | 7 | V7 (audit), V8 (bcrypt) | Swagger UI |
| Phase 2 — PRD Completeness | 4 | V9 (email), V10 (carry-forward) | SSE + notification CRUD |
| Phase 3 — High-Value Features | 7 | V11 (capacity), V12 (comments), V13 (templates) | ~17 new endpoints |

**New dependencies:**
- Backend: Testcontainers, SpringDoc OpenAPI, Bucket4j, Spring Boot Mail, OpenCSV, Apache PDFBox
- Frontend: Vitest, MSW, React Testing Library, Recharts
