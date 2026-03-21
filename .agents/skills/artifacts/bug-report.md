---
name: bug-report
description: Standard bug report format filed by QA when a PR fails testing. This is the formal handoff artifact from QA back to Developer. Every bug must be reproducible, classified by severity, and have explicit steps to reproduce and expected vs. actual behavior.
---

# Bug Report Format

A bug report is filed by QA when testing a PR and a defect is found. It is the formal signal that returns a ticket from IN_QA to IN_DEV. It is not an opinion — it is a contract. The Developer must be able to reproduce and fix the bug using only the information in this report.

---

## Severity Classification

| Severity | Definition | SLA |
|----------|-----------|-----|
| `P0_CRITICAL` | System crash, data loss, security breach, feature completely broken | Fix before any other work |
| `P1_HIGH` | Core acceptance criterion fails, major UX broken, auth issue | Fix within current sprint |
| `P2_MEDIUM` | Edge case fails, non-critical path broken, bad error message | Fix in current or next sprint |
| `P3_LOW` | Cosmetic issue, minor UX inconsistency, non-blocking | Backlog — fix when convenient |

P0 and P1 bugs block the PR from merging. P2 and P3 are logged but do not block.

---

## Bug Report Schema

```json
{
  "id": "BUG-XXX",
  "pr_ref": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "sprint": N,
  "filed_by": "qa",
  "filed_on": "Day N",

  "title": "<verb phrase describing the defect: 'DELETE returns 200 for non-existent ID'>",
  "severity": "P0_CRITICAL | P1_HIGH | P2_MEDIUM | P3_LOW",
  "category": "FUNCTIONAL | SECURITY | PERFORMANCE | UX | DATA_INTEGRITY | AUTH",

  "environment": {
    "service": "backend | frontend | both",
    "endpoint": "<if applicable>",
    "browser": "<if frontend>",
    "test_data": "<what data state was needed to reproduce>"
  },

  "steps_to_reproduce": [
    "1. <Precise step>",
    "2. <Precise step>",
    "3. <Observe result>"
  ],

  "expected_behavior": "<What should happen according to the acceptance criteria>",
  "actual_behavior": "<What actually happened — be specific: HTTP status, UI state, error message, data returned>",

  "acceptance_criterion_violated": "<Paste the exact AC from the ticket that this breaks>",

  "evidence": {
    "request": "<HTTP request if applicable>",
    "response": "<HTTP response / error / UI state>",
    "logs": "<relevant log lines if available>"
  },

  "root_cause_hypothesis": "<QA's guess at why — optional, not required>",

  "blocking": true,

  "status": "OPEN | IN_FIX | FIXED | VERIFIED | CLOSED | WONT_FIX",
  "assigned_to": "developer",

  "fix_pr_ref": "",
  "verified_by": "",
  "verified_on": ""
}
```

---

## Filing Rules

QA must follow these rules when filing a bug:

1. **One bug per report.** Do not combine multiple issues. File separate reports.
2. **Must be reproducible.** If you can't reproduce it consistently, mark as `P3_LOW` with note "intermittent — needs investigation."
3. **Cite the exact acceptance criterion violated.** This is what the Developer must fix to. Not QA's opinion — the ticket's own spec.
4. **Include exact error messages.** "It shows an error" is not acceptable. Paste the actual error text.
5. **Classify severity honestly.** Inflating severity wastes Developer time. Downplaying P0s is dangerous.
6. **Do not suggest the fix.** Your job is to describe what's broken, not how to fix it. Root cause hypothesis is optional and clearly labeled as such.

---

## Bug Report — Full Example

```json
{
  "id": "BUG-001",
  "pr_ref": "PR-012",
  "ticket_ref": "PROJ-001",
  "sprint": 1,
  "filed_by": "qa",
  "filed_on": "Day 4",

  "title": "DELETE /payment-methods/:id returns HTTP 200 when ID does not exist",
  "severity": "P1_HIGH",
  "category": "FUNCTIONAL",

  "environment": {
    "service": "backend",
    "endpoint": "DELETE /api/payment-methods/:id",
    "test_data": "Use any UUID that was never inserted: '00000000-0000-0000-0000-000000000000'"
  },

  "steps_to_reproduce": [
    "1. Authenticate as a merchant with payment_methods:manage permission",
    "2. Send DELETE request: DELETE /api/payment-methods/00000000-0000-0000-0000-000000000000",
    "3. Observe response"
  ],

  "expected_behavior": "HTTP 404 with body: {\"detail\": \"PaymentMethod not found\"}",
  "actual_behavior": "HTTP 200 with body: {\"deleted\": true}. No payment method was deleted (correct), but status code and body are wrong.",

  "acceptance_criterion_violated": "System returns HTTP 404 when DELETE is called on a non-existent resource",

  "evidence": {
    "request": "DELETE /api/payment-methods/00000000-0000-0000-0000-000000000000\nAuthorization: Bearer <valid_token>",
    "response": "HTTP 200 OK\n{\"deleted\": true}",
    "logs": "No error logged — delete query ran with 0 rows affected, no check performed"
  },

  "root_cause_hypothesis": "The route handler runs DELETE without checking if the row existed before deletion. SQLAlchemy's delete() returns success even with 0 rows affected.",

  "blocking": true,
  "status": "OPEN",
  "assigned_to": "developer"
}
```

---

## Bug Lifecycle

```
OPEN        → filed by QA, assigned to Developer
IN_FIX      → Developer acknowledged, working on fix
FIXED       → Developer pushed fix commit, ready for re-test
VERIFIED    → QA re-tested, defect resolved
CLOSED      → Verified + PR merged
WONT_FIX    → PM decision: accepted behavior or out of scope
```

---

## Re-test Protocol (QA)

When Developer marks a bug as FIXED:
1. Re-run the exact steps_to_reproduce from the original report
2. Verify the expected_behavior now occurs
3. Run a quick regression check: does fixing this break anything adjacent?
4. If VERIFIED → update bug status, update PR in QA loop
5. If NOT VERIFIED → re-open bug, add note: "Fix did not resolve. Observed: [new actual behavior]"

---

## QA Summary After a PR Test Cycle

After testing all scenarios for a PR, QA produces a summary:

```json
{
  "agent": "qa",
  "action": "PR_TEST_RESULT",
  "pr_ref": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "result": "PASS | FAIL",
  "acceptance_criteria_tested": N,
  "acceptance_criteria_passed": N,
  "acceptance_criteria_failed": N,
  "bugs_filed": ["BUG-XXX", "BUG-YYY"],
  "blocking_bugs": N,
  "non_blocking_bugs": N,
  "next_action": "SEND_TO_DEVOPS | RETURN_TO_DEVELOPER"
}
```
