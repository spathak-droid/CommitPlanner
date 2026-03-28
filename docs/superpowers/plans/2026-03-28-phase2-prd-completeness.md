# Phase 2: PRD Completeness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete remaining PRD requirements — notifications end-to-end, email delivery, Module Federation verification, and carry-forward UX polish.

**Architecture:** SSE for real-time notifications, Spring Boot Mail for email, webpack Module Federation test harness, carry-forward lineage tracking via new DB column.

**Tech Stack:** Spring SseEmitter, Spring Boot Mail, Webpack Module Federation, Flyway

---

## Task 1: Notification SSE Backend + Full CRUD

**Files:**
- Modify: `backend/src/main/java/com/weeklycommit/controller/NotificationController.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/NotificationService.java`
- Create: `backend/src/main/java/com/weeklycommit/service/SseEmitterService.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/WeeklyPlanService.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/ManagerService.java`

### What to build:
1. **SseEmitterService** — manages per-user SSE connections
   - `subscribe(userId)` → returns SseEmitter (30s timeout, auto-reconnect)
   - `push(userId, notification)` → sends event to connected client
   - ConcurrentHashMap<String, SseEmitter> for connections

2. **NotificationController updates:**
   - `GET /api/notifications/stream` — SSE endpoint, calls SseEmitterService.subscribe()
   - `DELETE /api/notifications/{id}` — dismiss notification
   - Existing: GET list, GET unread-count, POST mark-read, POST mark-all-read

3. **NotificationService updates:**
   - After `send()`, also push via SseEmitterService
   - New: `delete(UUID notificationId)`

4. **Auto-trigger notifications from existing services:**
   - WeeklyPlanService `transition()` — when LOCK: notify manager "{name} locked their week of {date}"
   - WeeklyPlanService `transition()` — when RECONCILE complete: notify manager "{name} reconciled their week"
   - WeeklyPlanService `transition()` — when CARRY_FORWARD: notify IC "{count} items carried forward to {date}"
   - ManagerService `submitReview()` — when APPROVED: notify IC "Your week was approved"
   - ManagerService `submitReview()` — when FLAGGED: notify IC "Your week was flagged: {feedback}"

5. **Scheduled Wednesday nudge:**
   - `@Scheduled(cron = "0 0 9 * * WED")` in NotificationService
   - Find all plans for current week still in DRAFT, send NUDGE to each user

---

## Task 2: Frontend Notification Bell + SSE

**Files:**
- Modify: `frontend/src/components/NotificationBell.tsx`
- Modify: `frontend/src/services/api.ts`

### What to build:
1. **API additions:**
   - `deleteNotification(id)` — DELETE endpoint
   - `subscribeNotifications()` — returns EventSource for SSE stream

2. **NotificationBell updates:**
   - Replace 30s polling with EventSource SSE connection
   - On SSE message: increment unread count, prepend to notifications list
   - Fallback to polling if SSE connection fails
   - Add dismiss button (X) per notification calling deleteNotification
   - Show notification type icon + time ago + dismiss

---

## Task 3: Email Notification Delivery

**Files:**
- Modify: `backend/build.gradle.kts`
- Create: `backend/src/main/resources/db/migration/V9__user_email.sql`
- Modify: `backend/src/main/java/com/weeklycommit/entity/AppUser.java`
- Create: `backend/src/main/java/com/weeklycommit/service/EmailService.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/NotificationService.java`
- Modify: `backend/src/main/resources/application.yml`

### What to build:
1. **Migration V9:** Add `email VARCHAR(255)` and `email_notifications_enabled BOOLEAN DEFAULT true` to app_users
2. **AppUser entity:** Add email and emailNotificationsEnabled fields
3. **Spring Boot Mail dependency:** `spring-boot-starter-mail`
4. **application.yml:** SMTP config via env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)
5. **EmailService:**
   - `sendNotificationEmail(String to, String subject, String body)`
   - Simple HTML template (inline styles, no template engine)
   - `@Async` so it never blocks
   - Catches exceptions and logs (no retry)
6. **NotificationService integration:**
   - After creating notification, if user has email + enabled → call EmailService
   - Email content derived from notification type/title/message

---

## Task 4: Carry-Forward Lineage + UX Polish

**Files:**
- Create: `backend/src/main/resources/db/migration/V10__carry_forward_lineage.sql`
- Modify: `backend/src/main/java/com/weeklycommit/entity/WeeklyCommit.java`
- Modify: `backend/src/main/java/com/weeklycommit/dto/WeeklyPlanResponse.java`
- Modify: `backend/src/main/java/com/weeklycommit/service/WeeklyPlanService.java`
- Modify: `frontend/src/pages/WeeklyPlanPage.tsx`
- Modify: `frontend/src/types/index.ts`

### What to build:
1. **Migration V10:** Add `carried_from_commit_id UUID REFERENCES weekly_commits(id)` to weekly_commits
2. **WeeklyCommit entity:** Add carriedFromCommitId field
3. **WeeklyPlanResponse.CommitResponse:** Add `carriedFromWeek: String | null` field
4. **WeeklyPlanService carry-forward logic:**
   - When creating CF commit, set carriedFromCommitId to original commit ID
   - Stop prefixing title with `[CF]` — use the badge instead
   - Skip plan creation if 0 items marked carry-forward
5. **Frontend types:** Add `carriedFromWeek` to CommitResponse
6. **WeeklyPlanPage updates:**
   - Show CF badge (purple pill) on carried items instead of [CF] prefix
   - Confirmation modal before CARRY_FORWARD transition: "X items will carry to next week. Continue?"
   - Banner on plans with carried items: "Includes {count} items carried from {date}"

---

## Task 5: Module Federation Test Harness

**Files:**
- Create: `federation-test-host/index.html`
- Create: `federation-test-host/webpack.config.js`
- Create: `federation-test-host/src/index.js`
- Create: `federation-test-host/package.json`
- Modify: `frontend/webpack.config.js` (verify shared config)
- Create: `docs/module-federation.md`

### What to build:
1. **Minimal host app** (< 100 lines total) that:
   - Uses ModuleFederationPlugin to consume weeklyCommitRemote
   - Loads `./WeeklyCommitApp` from remote
   - Passes auth token as prop
   - Renders in a div
2. **Verify webpack.config.js shared config:**
   - React, ReactDOM as singletons
   - Zustand shared
3. **Integration doc** explaining:
   - How to consume the remote
   - Expected shared deps
   - Auth token passthrough
   - CSS isolation notes

---

## Task 6: Final Verification + Run All Tests

- Run all backend tests
- Run all frontend tests
- Verify Webpack builds clean
- Test notifications manually (login, lock plan, check manager gets notification)
