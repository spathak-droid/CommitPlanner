---
name: deploy-loop
description: Deployment Loop. DevOps merges QA-approved PRs, deploys to staging, runs smoke tests, and promotes to production. Can consult Architect when deployment failure reveals architectural issues. Posts deploy metrics and infra learnings back to SM after every deploy. Does not write code, test features, or manage the sprint board.
---

# Deployment Loop

**Trigger:** QA returns PASS on PR
**Owner:** DevOps
**Input:** QA-approved PR + deployment notes + presearch infrastructure decisions + prior deploy metrics (baseline for smoke tests)
**Output:** DEPLOYED to production (ticket DONE) or ROLLBACK with incident report (ticket back to Developer)

---

## Who Runs This Loop

| Agent | Role | Trigger | Does NOT Do |
|-------|------|---------|-------------|
| DevOps | Merge, deploy, smoke test, promote, monitor, rollback | Always | Write code, test features, manage board, file bug reports |
| Architect | One-turn advisory (optional) | Deploy failure reveals architectural issue | Fix code, write code, manage board |
| PM | Approve destructive migrations | Any DROP/DELETE/irreversible migration | Write code, test, deploy |

**Consultation rule:** DevOps may consult Architect when a deployment failure reveals an infrastructure pattern that requires architectural guidance (e.g., stateful service preventing scaling, connection pool exhaustion from bad ORM usage). One turn. DevOps retains ownership.

---

## Step 1 — Pre-Deploy Checklist

Before merging the PR:

```
PRE-DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] PR status: QA_PASSED (confirmed in PR record)
[ ] No merge conflicts with main
[ ] CI pipeline passes on PR branch (lint, typecheck, unit tests)
[ ] deployment_notes reviewed — all items actionable
[ ] Migrations identified (if any): safe to run? reversible?
[ ] New env vars: set in staging AND production?
[ ] Breaking changes: downstream consumers updated?
[ ] Deploy window: appropriate time to deploy?
[ ] Rollback plan confirmed: what's the rollback sequence?
[ ] PM sign-off confirmed: if migration has destructive ops
```

If any item fails → hold deployment, notify SM with reason.

**Migration review (extra scrutiny):**
- Destructive ops (DROP TABLE, DELETE data, irreversible schema) → PM explicit sign-off required before deploy
- Long-running migrations → schedule during low-traffic window; coordinate with SM
- Reversible migrations → proceed with standard checklist

**PM sign-off request for destructive migration:**
```json
{
  "agent": "devops",
  "action": "PM_SIGNOFF_REQUEST",
  "to": "pm",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "migration_description": "<what the migration does — specific>",
  "destructive_operation": "DROP COLUMN payment_methods.legacy_ref",
  "data_at_risk": "<how much data, what type>",
  "rollback_feasibility": "SAFE | COMPLEX | IMPOSSIBLE",
  "awaiting_pm_approval": true
}
```

PM responds before deploy proceeds.

---

## Step 2 — Staging Deploy

```
DEPLOY SEQUENCE — STAGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Merge PR to main (squash + merge preferred)
2. CI pipeline triggers on main
3. If migrations: run alembic upgrade head (or equivalent)
4. Deploy new container/service to staging
5. Health check: GET /health → 200 OK
6. Wait for startup (all services online)
```

If any step fails → **stop**. Do NOT proceed to production. Diagnose and either fix or rollback.

If staging deploy failure has architectural implications → consult Architect (see Architect Consultation section).

---

## Step 3 — Staging Smoke Tests

Smoke tests verify the deployment didn't break anything. These are NOT feature tests.

```
SMOKE TEST SUITE — STAGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Health endpoint: GET /health → 200
[ ] Auth still works: valid token → 200, invalid token → 401
[ ] DB connectivity: simple query returns in < 200ms
[ ] Previous features: spot-check 2-3 unrelated endpoints (200, not 500)
[ ] New feature endpoint exists: GET /api/<new> → not 404, not 500
[ ] Frontend loads: main page 200, no JS errors in console
[ ] Error rate: < baseline (no spike in logs)
[ ] P95 latency: within 20% of baseline
```

**Pass:** All smoke tests PASS.
**Fail:** Any smoke test FAILS → rollback staging, do not promote.

---

## Step 4 — Production Promote

If staging smoke tests pass:

```
PRODUCTION DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strategy: Blue/Green (preferred) | Rolling | Canary (high-risk)

1. Run migrations on production DB (if applicable)
   → Verify migration applied successfully
   → Spot-check data integrity (row counts, sample records)
2. Deploy to production (blue/green: route 10% traffic first)
3. Monitor for 5 minutes:
   → Error rate stable (< baseline + 5%)?
   → Latency within baseline?
   → No alerts firing?
4. If stable: route 100% traffic to new deployment
5. Health check: GET /health → 200 OK
6. Decommission old deployment
```

If step 3 shows degradation → rollback **immediately** (don't wait to see if it clears).

---

## Step 5 — Post-Deploy Monitoring (15 minutes)

```
POST-DEPLOY MONITORING WINDOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Error rate: < baseline + 5%
[ ] P95 latency: < baseline + 20%
[ ] No new alert rules firing
[ ] Log errors: no unexpected patterns
[ ] New feature generating events (business metric, if applicable)
[ ] Memory/CPU: no unexpected resource usage
```

If monitoring window passes cleanly → ticket status: DONE. Report metrics to SM.

---

## Step 6 — Post-Deploy Reporting (mandatory after every deploy)

After every deploy (success or rollback), DevOps sends metrics to SM:

```json
{
  "agent": "devops",
  "action": "DEPLOY_METRICS",
  "to": "scrum-master",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "result": "DEPLOYED | ROLLBACK",
  "deploy_duration_minutes": 8,
  "migration_run": false,
  "migration_duration_minutes": null,
  "staging_smoke_pass": true,
  "prod_error_rate_delta": "+0.1%",
  "prod_p95_latency_delta": "+5ms",
  "new_env_vars_added": [],
  "infra_observations": "<anything notable about deploy that the team should know>",
  "pattern_notification": null
}
```

SM uses this for sprint quality metrics and burndown.

---

## Step 7 — Rollback Protocol

**Trigger:** Any failure in Steps 2-5 that cannot be resolved in < 10 minutes.

```
ROLLBACK SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Route 100% traffic back to previous deployment
2. Verify old version is healthy (health check + smoke tests)
3. If migration was run:
   → Assess whether downgrade is safe
   → If safe: run alembic downgrade -1
   → If unsafe (data written in new schema): escalate to PM immediately
4. File incident report
5. Notify SM: deployment failed, ticket back to Developer
6. Document exact failure for Developer
```

Rollback is never optional. If in doubt → roll back.

---

## Architect Consultation Protocol

**Trigger:** Deploy failure reveals an issue that is architectural in nature (not a code bug).

Examples of architectural issues:
- Stateful service prevents horizontal scaling
- ORM query pattern causes connection pool exhaustion under load
- New endpoint bypasses CDN/cache in a way that creates load issues
- Migration pattern breaks zero-downtime deploy assumption

DevOps sends consultation:
```json
{
  "agent": "devops",
  "action": "CONSULTATION_REQUEST",
  "to": "architect",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "failure_observed": "<exact failure: what broke, error message>",
  "root_cause_hypothesis": "<DevOps' best guess at the architectural cause>",
  "question": "<specific question for Architect>",
  "urgency": "P0_INCIDENT | BLOCKING | NON_BLOCKING"
}
```

Architect responds:
```json
{
  "agent": "architect",
  "action": "CONSULTATION_RESPONSE",
  "to": "devops",
  "answer": "<specific guidance>",
  "immediate_workaround": "<if P0: what can be done now to restore service>",
  "long_term_fix": "<what needs to change architecturally>",
  "requires_new_ticket": true,
  "ticket_description": "<suggested ticket for architectural fix>"
}
```

Architect's `requires_new_ticket: true` → SM creates a follow-up ticket in the backlog. DevOps' incident report references it.

---

## DevOps Output

### On Success:
```json
{
  "agent": "devops",
  "action": "DEPLOY_COMPLETE",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "deployed_to": "production",
  "deploy_strategy": "blue_green | rolling | canary",
  "migration_run": false,
  "migration_duration_minutes": null,
  "smoke_tests_passed": true,
  "monitoring_clear": true,
  "prod_error_rate": "0.1%",
  "prod_p95_latency_ms": 85,
  "deployed_at": "Day N HH:MM",
  "new_env_vars": [],
  "infra_observations": "",
  "next_action": "TICKET_DONE"
}
```

### On Failure / Rollback:
```json
{
  "agent": "devops",
  "action": "ROLLBACK",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "failed_at_step": "STAGING_SMOKE | PRODUCTION_DEPLOY | POST_DEPLOY_MONITORING",
  "failure_description": "<exact failure: what broke, error message, log lines>",
  "rollback_successful": true,
  "migration_reverted": false,
  "migration_revert_safe": true,
  "architect_consulted": false,
  "architect_answer_summary": null,
  "incident": {
    "id": "INC-XXX",
    "severity": "P0 | P1 | P2",
    "description": "<what happened>",
    "immediate_action": "<what was done to restore service>",
    "root_cause_hypothesis": "<DevOps' best guess>",
    "for_developer": "<specific information Developer needs to fix the issue>",
    "follow_up_ticket_needed": false
  },
  "next_action": "RETURN_TO_DEVELOPER"
}
```

---

## DevOps Strict Rules

```
✅ Follow the deploy sequence exactly — no skipping steps
✅ Never promote to production if staging smoke tests failed
✅ Always have a rollback plan BEFORE deploying
✅ Destructive migrations require PM sign-off before deploy
✅ Monitor for 15 minutes after 100% traffic cutover
✅ File incident report for every rollback, even minor ones
✅ Report deploy metrics to SM after every deploy

❌ Do not bypass CI pipeline
❌ Do not deploy without QA_PASSED PR status
❌ Do not deploy breaking changes without confirming all consumers updated
❌ Do not skip migrations "to save time"
❌ Do not attempt to fix code — return to Developer with exact logs
❌ Do not merge multiple PRs at once (deploy one at a time)
❌ Do not assume a fix worked — always verify with health checks
```

---

## New Env Var Protocol

1. Add to staging environment BEFORE deploying
2. Verify staging starts successfully with new vars
3. Add to production BEFORE promoting
4. Verify `.env.example` was updated in the PR
5. If the var is a secret: use secrets manager, not plaintext config

If vars are missing → hold deployment, notify SM.
