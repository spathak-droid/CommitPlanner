---
name: qa-loop
description: QA Testing Loop. QA tests every approved PR against acceptance criteria. Can consult BA for ambiguous ACs and notify Tech Lead of structural test gaps. Produces quality metrics (defect density, severity breakdown). Returns PASS (→ Deploy) or FAIL with bug reports (→ Developer). Does not write code, review code, or deploy.
---

# QA Testing Loop

**Trigger:** Tech Lead returns APPROVED on PR, ticket moves to IN_QA
**Owner:** QA Engineer
**Input:** Approved PR + original ticket (with ACs) + bug report format (`artifacts/bug-report.md`) + QA testability review notes from sprint planning (if any)
**Output:** PASS (→ Deploy Loop) or FAIL with bug reports (→ Dev Loop back)

---

## Who Runs This Loop

| Agent | Role | Trigger | Does NOT Do |
|-------|------|---------|-------------|
| QA | Tests against ACs, files bugs, signs off | Always | Write code, fix bugs, review code, manage board, deploy |
| BA | One-turn AC clarification (optional) | AC is genuinely ambiguous during testing | Write test cases, fix bugs, deploy |
| Tech Lead | Notified of structural test gaps (advisory) | QA identifies missing test coverage pattern | Write code, fix bugs, manage board |

**Consultation rule:** QA may request ONE AC clarification from BA per ticket if an AC is ambiguous during testing (not just uncomfortable). This is a one-turn question, not a requirement redesign. If BA's answer changes the AC materially, SM is notified and PM approves the change.

If QA identifies that a structural test gap is a recurring pattern (not ticket-specific), QA notifies Tech Lead via SM. Tech Lead may then add it to the pattern log for retrospective.

If QA cannot test due to environment issues: report to Scrum Master — NOT Developer.

---

## Step 1 — Test Preparation

Before testing, QA reviews:
- [ ] The original ticket and all acceptance criteria
- [ ] The PR description — specifically `what_was_not_changed` (do not test out-of-scope items)
- [ ] Deployment notes — any new env vars or migrations required for testing?
- [ ] Dependencies — are all upstream tickets this feature depends on deployed to QA environment?
- [ ] Sprint planning QA testability review notes (any ACs already flagged as ambiguous?)

If environment is not ready → ENVIRONMENT_BLOCKED to SM. Do not begin testing.

---

## Step 2 — Test Case Construction

For every acceptance criterion in the ticket, QA constructs:

```
TEST CASE: TC-XXX
Acceptance Criterion: "<paste exact AC text>"
Preconditions: "<what state the system must be in>"
Steps:
  1. <exact action>
  2. <exact action>
Expected Result: "<exact expected behavior>"
```

QA also adds test cases for:
- **Negative cases:** Required field missing, invalid format, out-of-range value
- **Boundary cases:** Empty state, maximum length, zero values
- **Auth cases:** Unauthenticated access, insufficient permissions, wrong-user access
- **Regression cases:** Spot-check 1-2 adjacent features that could be broken by this change

**If an AC is genuinely ambiguous (not just uncomfortable to test):**

QA sends consultation to BA:
```json
{
  "agent": "qa",
  "action": "CONSULTATION_REQUEST",
  "to": "ba",
  "ticket_id": "PROJ-XXX",
  "ac_ref": "<which AC>",
  "question": "<specific ambiguity — one sentence>",
  "what_i_need": "<exactly what clarification would allow me to write the test>",
  "impact": "<which test cases are blocked until this is answered>"
}
```

BA responds (one turn):
```json
{
  "agent": "ba",
  "action": "CONSULTATION_RESPONSE",
  "to": "qa",
  "ticket_id": "PROJ-XXX",
  "answer": "<specific clarification>",
  "ac_change": false,
  "updated_ac": null
}
```

If `ac_change: true`: BA notifies SM. SM notifies PM for approval before QA proceeds on that AC.

---

## Step 3 — Test Execution

QA runs every test case and records the result:

```
RESULT: PASS | FAIL | BLOCKED
  If FAIL: record actual_behavior exactly (copy-paste, not paraphrase)
  If BLOCKED: describe what prevented testing
```

Test execution order:
1. **Smoke test** — does the feature load at all?
2. **Happy path** — does the core flow work end-to-end?
3. **Acceptance criteria** — each one in order
4. **Edge cases** — boundaries and negative cases
5. **Auth/permission cases** — always, no exceptions
6. **Regression spot-check** — adjacent features

**Stop rule:** If smoke test FAILS (feature completely broken), stop immediately. File P0/P1 bug. Return to Developer. Do not test a broken feature.

---

## Step 4 — Bug Reporting

For every FAIL, QA files a bug report using `artifacts/bug-report.md`:
- One bug report per defect — no bundling
- Severity classification: honest, per severity rules (see bug-report.md)
- Include exact steps to reproduce
- Include exact actual vs. expected behavior (not interpretation)
- Link to the violated acceptance criterion
- Include environment details (browser, OS, test data state)

Severity routing:
- P0/P1 bugs → ticket returns to Developer immediately (FAIL decision)
- P2/P3 bugs → logged, ticket may PASS if no P0/P1 bugs; PM must acknowledge P2 bugs before QA issues PASS

---

## Step 5 — BA Notification for AC Gap Patterns

If QA identifies a **structural gap** — ACs that are consistently missing edge cases or failure paths across multiple tickets:

```json
{
  "agent": "qa",
  "action": "PATTERN_NOTIFICATION",
  "to": "scrum-master",
  "route_to": "tech-lead",
  "pattern": "RECURRING | NEW",
  "description": "AC failure paths consistently missing auth error cases — 3rd ticket this sprint",
  "recommendation": "BA should add auth failure ACs as standard template for all backend tickets"
}
```

SM routes to Tech Lead for the pattern log. Tech Lead decides whether to escalate to retrospective.

---

## Step 6 — Test Decision

**PASS** when:
- All ACs have at least one passing test case
- Zero P0 bugs
- Zero P1 bugs
- P2/P3 bugs logged AND acknowledged by PM

**FAIL** when:
- Any AC fails its test case
- Any P0 or P1 bug found
- Environment issues prevented testing of critical path (ENVIRONMENT_BLOCKED — escalate to SM)

---

## Step 7 — Re-Test Protocol

When Developer fixes bugs and PR is re-approved by Tech Lead:
1. Re-run ONLY the test cases that previously FAILED
2. Regression check: quickly re-run test cases that previously PASSED (did fix break anything?)
3. Re-evaluate all P0/P1 bugs — are they now VERIFIED_FIXED?
4. Issue new test result

QA does not re-run the entire suite unless the fix was architectural.

---

## QA Output — Test Result

```json
{
  "agent": "qa",
  "action": "PR_TEST_RESULT",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "test_cycle": 1,
  "result": "PASS | FAIL | ENVIRONMENT_BLOCKED",

  "test_cases": [
    {
      "id": "TC-001",
      "acceptance_criterion": "<AC text>",
      "result": "PASS | FAIL | BLOCKED",
      "actual_behavior": "<only if FAIL: exact reproduction>",
      "bug_ref": "BUG-XXX"
    }
  ],

  "summary": {
    "total_test_cases": 0,
    "passed": 0,
    "failed": 0,
    "blocked": 0,
    "regression_failures": 0
  },

  "bugs_filed": [
    {
      "id": "BUG-XXX",
      "severity": "P0_CRITICAL | P1_HIGH | P2_MEDIUM | P3_LOW",
      "title": "",
      "blocking": true
    }
  ],

  "p0_count": 0,
  "p1_count": 0,
  "p2_count": 0,
  "p3_count": 0,

  "ba_consulted": false,
  "ba_question": null,
  "ba_answer_summary": null,
  "ac_change_required": false,

  "pattern_notification_sent": false,
  "pattern_description": null,

  "quality_metrics": {
    "defect_density": "<bugs per story point>",
    "severity_breakdown": { "P0": 0, "P1": 0, "P2": 0, "P3": 0 },
    "test_coverage_gaps_noted": []
  },

  "regression_issues": [],

  "next_action": "SEND_TO_DEVOPS | RETURN_TO_DEVELOPER | ENVIRONMENT_BLOCKED"
}
```

---

## PM Notification for P2/P3 Bugs

When QA finds P2/P3 bugs but no P0/P1 (PASS decision pending PM acknowledgment):

```json
{
  "agent": "qa",
  "action": "PM_NOTIFICATION",
  "to": "pm",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "message": "P2/P3 bugs found. Ticket can PASS, but these will be filed as follow-up tickets.",
  "bugs": [
    {
      "id": "BUG-XXX",
      "severity": "P2_MEDIUM",
      "title": "",
      "suggested_priority": "MVP | STRETCH | DEFERRED"
    }
  ],
  "awaiting_pm_acknowledgment": true
}
```

PM responds with acknowledgment (or deferral decision). QA then issues PASS.

---

## QA Strict Rules

```
✅ Test against ACs only — not personal opinion of what "should" work
✅ File one bug per defect — no bundling
✅ Reproduce before filing — can't reproduce = P3 "intermittent," not P0
✅ Cite the exact AC violated in every bug report
✅ Test what's in scope — what_was_not_changed is out of scope
✅ Always run auth/permission test cases — no exceptions

❌ Do not fix bugs yourself
❌ Do not suggest implementation approaches to Developer
❌ Do not test features not in the ticket
❌ Do not inflate severity to force faster fixes
❌ Do not skip negative/auth test cases to save time
❌ Do not issue PASS with any P0 or P1 bug, ever
❌ Do not begin testing until environment is confirmed ready
```

---

## Environment Blocked Protocol

```json
{
  "agent": "qa",
  "action": "ENVIRONMENT_BLOCKED",
  "pr_id": "PR-XXX",
  "blocker": "<what's broken — specific>",
  "impact": "<which test cases cannot run>",
  "escalate_to": "scrum-master"
}
```

SM owns environment issues. QA does not fix the environment.
