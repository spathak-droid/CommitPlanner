# Weekly Commit System

> A micro-frontend module replacing 15-Five with RCDO-linked weekly planning. Enforces structural connection between individual weekly commitments and organizational Rally Cries, Defining Objectives, and Outcomes.

---

## The Problem

Organizations use tools like 15-Five for weekly planning, but there's no structural link between what individuals commit to each week and the organization's strategic goals. Managers can't see alignment until it's too late — by Friday, misaligned work is already done.

**Before (15-Five):** Commitments live in isolation. No priority framework. No reconciliation. No visibility.

**After (Weekly Commit System):** Every commitment links to an Outcome in the RCDO hierarchy. A state machine enforces the full lifecycle. Managers see alignment gaps in real-time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (strict) + Tailwind CSS + Zustand |
| Backend | Java 21 + Spring Boot 3.2 + Spring Data JPA |
| Database | PostgreSQL 16 + Flyway migrations (16 versions) |
| AI | Anthropic Claude API (via OpenRouter) |
| Build | Webpack 5 Module Federation |
| Auth | JWT + HttpOnly cookies + bcrypt |
| Real-time | Server-Sent Events (SSE) for notifications |
| Charts | Recharts |

---

## Quick Start

### Prerequisites

- **Java 21** (e.g., Amazon Corretto)
- **Node.js 18+** and npm
- **PostgreSQL 16** — either local via Docker or a hosted instance (e.g., Railway)

### 1. Clone and setup

```bash
git clone <repo-url>
cd CommitPlanner
```

### 2. Database

**Option A — Docker (local):**

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with database `weekly_commits`.

**Option B — Remote (Railway, Supabase, etc.):**

Create a `.env` file in the project root:

```env
DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
ANTHROPIC_API_KEY=<your-api-key>
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### 3. Start the backend

```bash
cd backend

# If using .env file:
export $(cat ../.env | xargs)

./gradlew bootRun
```

The backend starts on **http://localhost:8080**. Flyway automatically runs all 16 migrations and seeds:
- 3 Rally Cries, 6 Defining Objectives, 12 Outcomes
- 3 Managers + 3 Individual Contributors
- 8 weeks of historical plans with reconciliation data
- Manager reviews and team assignments

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:3001** and proxies API calls to `localhost:8080`.

### 5. Login

Open **http://localhost:3001** in your browser.

**Demo accounts** (all passwords: `password123`):

| Role | User ID | Name | Sees |
|------|---------|------|------|
| Manager | `manager-1` | Maya Reynolds | Jordan, Avery, Sam |
| Manager | `director-ops` | Adrian Cole | Sam Rivera |
| Manager | `lead-product` | Nina Patel | Avery Brooks |
| IC | `user-1` | Jordan Kim | Own plans |
| IC | `ic-product` | Avery Brooks | Own plans |
| IC | `ic-design` | Sam Rivera | Own plans |

---

## Features

### Individual Contributor (IC) Views

**Weekly Commitments** — Create commitments linked to RCDO outcomes. Each commit has:
- Title and description
- Chess layer priority: MUST_DO (A), SHOULD_DO (B), NICE_TO_DO (C)
- RCDO outcome picker (required — every commit links to strategy)
- Planned hours estimate
- AI-assisted commit generation (suggests title, priority, hours, outcome)

**Plan Lifecycle** — State machine enforces discipline:
```
DRAFT → LOCKED → RECONCILING → RECONCILED → CARRY FORWARD
```

**Reconciliation** — End-of-week review for each commit:
- Actual hours vs. planned
- Completion % (0-100) with color feedback
- Reconciliation notes
- Carry-forward checkbox (unfinished work goes to next week with lineage tracking)
- AI reconciliation assist

**Calendar** — Rolling 9-week view showing plan status and completion per week.

**Templates** — Save a week's commits as a reusable template for future weeks.

### Manager Views

**Team Dashboard** — Weekly execution signals at a glance:
- Average completion %, missing plans, awaiting review count
- Focus distribution (Must Do / Should Do / Nice To Do breakdown)
- Week-over-week team performance comparison
- Individual performance cards with trend indicators (improving/declining/steady)

**Drill-Down** — Click into any team member's plan to see:
- All commits with priority badges, RCDO mapping, progress bars
- Reconciliation notes and comment threads
- **Performance History** — 8-week bar chart, best/worst week, trend, consistency score, auto-generated insights
- AI Review Insights (patterns, risk signals, suggested feedback)
- Manager review: Approve or Flag with written feedback

**Team Alignment** — RCDO coverage dashboard:
- Which outcomes are covered by team commits
- Zero-coverage outcomes (strategic gaps)
- At-risk outcomes (commits exist but low completion)
- AI alignment suggestions

**Analytics** — 5 historical charts:
- Velocity trend (completed vs. total commits over 12 weeks)
- Completion rate trend
- Hours accuracy scatter (planned vs. actual — measures estimation maturity)
- Carry-forward rate
- RCDO coverage trend

**Capacity Planning** — Per-person planned hours vs. 40h capacity:
- Color-coded bars (red = overcommitted, yellow = high, green = healthy)
- Priority breakdown per person

**Admin / Settings** — User management, role assignment, manager-to-IC assignment matrix.

### AI-Powered Features

All AI features use the Anthropic Claude API:

| Feature | Trigger | What it does |
|---------|---------|-------------|
| Commit suggestion | IC creating a commit | Suggests title, description, priority, outcome, hours |
| Outcome matching | IC typing a commit title | Ranks matching outcomes by confidence |
| Hours estimation | IC entering a commit | Estimates effort with range |
| Reconciliation assist | IC reconciling | Suggests completion %, notes, carry-forward decision |
| Review insights | Manager reviewing a plan | Detects patterns, risk signals, suggests feedback |
| Alignment suggestions | Manager viewing alignment | Identifies which outcomes need more focus |
| Weekly digest | Manager dashboard | Executive summary with highlights, concerns, talking points |

### Other Features

- **Notifications** — In-app bell with unread count. Auto-triggered on plan lock, review, comments. Nudge button for missing plans.
- **Comment Threads** — Nested comments on each commit (manager and IC can discuss).
- **Export** — Download individual plans or team rosters as CSV or PDF.
- **Problem Statement** — Built-in page (accessible from login screen) showing the before/after diagram and STAR method summary.

---

## Module Federation

This app is designed as a micro-frontend remote that can be consumed by a host application:

```js
// Host app webpack config
remotes: {
  weeklyCommitRemote: 'weeklyCommitRemote@http://localhost:3001/remoteEntry.js'
}
```

**Exposed modules:**

| Module | Component |
|--------|-----------|
| `./WeeklyCommitApp` | Full application |
| `./WeeklyPlanView` | Weekly plan page only |
| `./ManagerDashboard` | Manager dashboard only |
| `./TeamAlignmentView` | Team alignment page only |
| `./AdminSetupView` | Settings/admin page only |

**Props-based bootstrap:**

```tsx
<WeeklyCommitApp
  userId="user-1"
  role="IC"
  apiBaseUrl="https://api.example.com/api"
  authToken="jwt-token-here"
/>
```

---

## Project Structure

```
CommitPlanner/
├── backend/                    # Java 21 Spring Boot API
│   ├── src/main/java/com/weeklycommit/
│   │   ├── controller/         # REST controllers (8 controllers)
│   │   ├── entity/             # JPA entities
│   │   ├── repository/         # Spring Data repositories
│   │   ├── service/            # Business logic + AI service
│   │   ├── dto/                # Request/response DTOs (Java records)
│   │   ├── security/           # JWT auth filter
│   │   └── config/             # Rate limiting, CORS, Anthropic config
│   └── src/main/resources/
│       └── db/migration/       # Flyway V1-V16 migrations
├── frontend/                   # React 18 TypeScript
│   ├── src/
│   │   ├── pages/              # 10 page components
│   │   ├── components/         # Shared UI components
│   │   ├── store/              # Zustand state management
│   │   ├── services/           # API client
│   │   ├── hooks/              # GSAP animations, custom hooks
│   │   └── types/              # TypeScript interfaces
│   ├── webpack.config.js       # Module Federation config
│   └── tailwind.config.js      # Design tokens
├── docker-compose.yml          # PostgreSQL 16
├── .env                        # Environment variables
└── README.md                   # This file
```

---

## API Reference

All endpoints under `/api/`. Swagger UI available at **http://localhost:8080/swagger-ui/index.html** when the backend is running.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/rcdo/tree` | Full RCDO hierarchy |
| POST | `/api/weekly-plans` | Create a plan |
| GET | `/api/weekly-plans/current` | Current week's plan |
| POST | `/api/weekly-plans/{id}/transition?action=` | State machine transition |
| PUT | `/api/commits/{id}/reconcile` | Reconcile a commit |
| GET | `/api/manager/team-plans?weekStart=` | Team roster for week |
| GET | `/api/manager/rcdo-alignment?weekStart=` | Alignment report |
| POST | `/api/manager/reviews` | Submit manager review |
| GET | `/api/analytics/velocity?from=&to=` | Velocity trend data |
| GET | `/api/analytics/capacity?weekStart=` | Capacity per person |
| GET | `/api/weekly-plans/calendar?from=&to=` | Calendar entries |

---

## Seeded Demo Data

The database comes pre-loaded with 8 weeks of realistic data across 3 ICs, each with a distinct performance profile:

| Person | Role | Avg Completion | Pattern |
|--------|------|---------------|---------|
| Jordan Kim | IC | ~89% | Consistently high performer. Plans approved. |
| Avery Brooks | IC | ~60% | Inconsistent. Recurring carry-forwards. Plans flagged. |
| Sam Rivera | IC | ~65% | Started at 38%, improved to 80%. Growth story. |

Each week includes 3-4 commits with full reconciliation (actual hours, completion %, notes), manager reviews with written feedback, and realistic RCDO linkages.

---

## Commands Reference

```bash
# Database
docker-compose up -d              # Start PostgreSQL (local)
docker-compose down               # Stop PostgreSQL

# Backend
cd backend
./gradlew bootRun                 # Start API server (port 8080)
./gradlew test                    # Run backend tests
./gradlew compileJava             # Compile only

# Frontend
cd frontend
npm install                       # Install dependencies
npm run dev                       # Dev server (port 3001)
npm run build                     # Production build
npm test                          # Run Vitest tests
```

---

## Design Decisions

- **No React Router** — View switching via Zustand state. Simpler for a micro-frontend that may be embedded in a host app with its own router.
- **Chess Layer naming** — MUST_DO/SHOULD_DO/NICE_TO_DO maps to chess notation (A/B/C priority tiers) from the RCDO methodology.
- **Optimistic locking** — `version` column on weekly_plans prevents concurrent edit conflicts.
- **Soft deletes on RCDO** — `active` flag instead of hard delete preserves historical integrity.
- **UUID primary keys** — Avoids sequential ID exposure and works with distributed systems.
- **Flyway migrations** — Schema changes are versioned and repeatable. 16 migrations from initial schema through comment threads and templates.
