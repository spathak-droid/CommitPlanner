# Demo Video Script — Weekly Commit System (5 min)

## [0:00–0:30] HOOK — The Problem (Situation)

**Open the app. Click "Problem Statement" on the login page.**

> "Every week, our teams plan their work in 15-Five. But here's the disconnect — *(point to the left side of the diagram)* — commitments live in complete isolation. No priority. No link to strategy. No way to know if someone's Monday plan actually moves the needle on a Rally Cry."
>
> *(Point to the right side)* "What if every commitment had to connect to an organizational outcome? That's what we built."
>
> *(Point to the lifecycle bar at bottom)* "And we didn't stop at planning — we enforce the full cycle: commit, lock, reconcile, review."

---

## [0:30–1:15] TASK — What We Were Asked to Build

**Stay on the problem statement page, scroll to the STAR cards at bottom.**

> "The **task** was specific: replace 15-Five with a production-ready micro-frontend that enforces structural alignment through RCDO — Rally Cries, Defining Objectives, Outcomes."
>
> "This isn't a planning toy. It needed a full lifecycle state machine, reconciliation comparing planned vs. actual, manager review with approval workflows, and it had to plug into the existing host app via Module Federation."
>
> "Tech requirements: TypeScript strict, Java 21, Spring Boot, PostgreSQL — and AI-assisted features throughout."

**Click "Back to Login."**

---

## [1:15–2:30] ACTION Part 1 — IC Flow

**Log in as `user-1` / `password123` (Jordan Kim, IC).**

> "Let me show you the contributor experience."

### Show the Weekly Plan page — current week's draft commits

> "Jordan has 3 commits this week. Every single one links to an RCDO outcome — you literally can't save a commit without that connection. And each gets a chess layer priority: A is must-do, B is should-do, C is nice-to-do."

### Click into one commit — show the RCDO link and planned hours

> "This commit links to 'Reduce MTTR' under Platform Reliability. 6 hours planned. The strategy connection is baked in, not optional."

### Navigate to Calendar view

> "Here's Jordan's 9-week history. Green means 80%+ completion, yellow is 50-79%, red is below 50%. Jordan's been consistently green — you can see the pattern instantly."

### Mention reconciliation (show a reconciled commit if visible)

> "At end of week, Jordan reconciles — actual hours, completion percentage, notes, and a carry-forward checkbox for unfinished work. This is how we close the loop between planning and reality."

---

## [2:30–4:00] ACTION Part 2 — Manager Flow

**Log out. Log in as `manager-1` / `password123` (Maya Reynolds, Manager).**

> "Now the manager's perspective — this is where alignment becomes visible."

### Dashboard — hero stats and week-over-week insights

> "Team dashboard. Average completion, focus distribution across A/B/C priorities. But watch this — *(scroll to Week-over-Week Insights)* — I can see each person compared to last week. Jordan is steady at 88%. Sam Rivera is *improving* — up from 38% two months ago to 80% now. Avery Brooks is *declining* — flagged for discussion."

### Click into Avery Brooks' plan

> "Drill down into Avery. I can see every commit, the RCDO mapping, the completion bars. The pricing experiment is at 35% — it's been carried forward three weeks in a row."

### Scroll to Performance History section

> "Here's the individual history — 8-week bar chart. You can see Avery's inconsistency at a glance. Average 60%, worst week was 51%, high variability. The system auto-generates insights: 'Below 50% — discuss blockers in next 1:1.' This isn't a dashboard you interpret — it tells you what to do."

### Show AI Review Insights and manager review

> "I can approve or flag the plan with written feedback. AI suggests the feedback for me based on patterns it detects. And Avery gets notified in real-time via SSE."

### Quick flash of Team Alignment page

> "One more view — *(navigate to Team Alignment)* — this shows RCDO coverage. Which outcomes have commits mapped? Which are zero-coverage gaps? Which have commits but low completion? This is strategic visibility that 15-Five never had."

---

## [4:00–4:40] ACTION Part 3 — Architecture (30 sec, fast)

> "Quick architecture note — this is a Module Federation micro-frontend. It exposes 4 federated modules that any host app can consume independently. React 18, TypeScript strict, Java 21 Spring Boot, PostgreSQL with 16 Flyway migrations, JWT auth, SSE notifications, and AI features powered by Claude."
>
> "The whole RCDO hierarchy, all the seed data, 8 weeks of historical plans — it all lives in PostgreSQL. Every API endpoint is documented in Swagger."

---

## [4:40–5:00] RESULT — The Outcome

> "So here's the result. With 15-Five, commitments lived in a vacuum — managers saw misalignment after the fact. With this system:"
>
> *(Count on fingers)*
>
> "**One** — every commitment structurally links to organizational strategy."
>
> "**Two** — a state machine enforces plan, lock, reconcile, review. No shortcuts."
>
> "**Three** — managers see who's aligned, who's drifting, and who's improving — in real-time, not at Friday standup."
>
> "**Four** — AI accelerates every step, from commit creation to manager review."
>
> "This turns weekly planning from a compliance checkbox into a strategic alignment tool."

---

## Timing Cheat Sheet

| Segment | Duration | What's on screen |
|---|---|---|
| Hook / Problem | 30s | Problem Statement page (diagram) |
| Task | 45s | STAR cards, then back to login |
| IC Flow | 75s | Jordan's commits, calendar, reconciliation |
| Manager Flow | 90s | Dashboard, Avery drill-down, history, alignment |
| Architecture | 30s | Talking (optionally show Swagger) |
| Result / Close | 20s | Talking, count on fingers |

---

## Demo Prep Checklist

- [ ] Backend running (Railway: https://backend-production-8df5.up.railway.app)
- [ ] Frontend running (Railway: https://frontend-production-a2d0.up.railway.app)
- [ ] Login page loads, "Problem Statement" button visible
- [ ] Login as `user-1` — verify commits show for current week
- [ ] Login as `manager-1` — verify 3 team members visible, week-over-week insights populated
- [ ] Click into Avery — verify Performance History bar chart renders
- [ ] Team Alignment page loads with RCDO coverage data
- [ ] Practice the script once for pacing — 5 minutes goes fast

---

## Demo Accounts

| Role | User ID | Password | Name |
|------|---------|----------|------|
| Manager | `manager-1` | `password123` | Maya Reynolds |
| IC | `user-1` | `password123` | Jordan Kim |
| IC | `ic-product` | `password123` | Avery Brooks |
| IC | `ic-design` | `password123` | Sam Rivera |

---

## Performance Profiles (Seeded Data)

| Person | Avg Completion | Trend | Manager Review |
|--------|---------------|-------|---------------|
| Jordan Kim | ~89% | Consistently high | Approved |
| Avery Brooks | ~60% | Declining, carry-forwards | Flagged |
| Sam Rivera | ~65% | 38% to 80%, improving | Approved |
