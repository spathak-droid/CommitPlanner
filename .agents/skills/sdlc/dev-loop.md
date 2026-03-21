---
name: dev-loop
description: Development Loop. Developer picks up a ticket, implements it, optionally consults Architect for technical unknowns, runs self-review checklist, and opens a PR. One consultation allowed per ticket (advisory only — Developer retains ownership). Output is a PR ready for Tech Lead review.
---

# Development Loop

**Trigger:** Ticket moves from BACKLOG to IN_DEV (Scrum Master assigns it)
**Owner:** Developer
**Input:** Ticket (with ACs) + codebase conventions profile + presearch architecture decisions + Tech Lead pattern log (from sprint planning) + sprint retrospective actions
**Output:** PR opened, ticket moved to IN_REVIEW

---

## Who Runs This Loop

| Agent | Role | Trigger | Does NOT Do |
|-------|------|---------|-------------|
| Developer | Implements the ticket, self-reviews, opens PR | Always | Review others, test features, deploy, manage board |
| Architect | One-turn advisory consultation (optional) | Developer flags technical unknown | Make decisions for Developer, write code |

**Consultation rule:** Developer may request one Architect consultation per ticket for genuine technical unknowns. This is advisory — Developer makes the final implementation decision. After consultation, Developer works alone.

If Developer hits a blocker that is NOT a technical unknown: report to Scrum Master. Do NOT ping Tech Lead or QA directly.

---

## Step 1 — Ticket Intake

Developer reads the ticket and confirms:
- [ ] Acceptance criteria are clear (if not → SM routes to BA — NOT directly to BA)
- [ ] Dependencies are DONE (if not → SM tracks as blocker)
- [ ] Technical notes from sprint planning are loaded
- [ ] Architecture decisions from presearch are loaded
- [ ] Tech Lead pattern log is loaded (awareness of recurring issues to avoid)
- [ ] Any sprint retrospective action items that apply to this ticket type are noted

If any dependency is not DONE → status remains BLOCKED, report to SM.

---

## Step 2 — Architect Consultation (optional, one per ticket)

**Trigger:** Developer has a genuine technical unknown that cannot be resolved by reading the codebase or presearch decisions. Not to be used for implementation preference or design taste.

Valid reasons:
- The ticket requires a pattern that doesn't exist in the codebase and isn't in presearch
- There are two valid implementation approaches with meaningfully different architectural implications
- A security approach is unclear for this specific case

NOT valid reasons:
- Wanting reassurance on a known pattern
- General code style questions
- Questions that can be answered by reading exemplar files

Developer sends consultation request:
```json
{
  "agent": "developer",
  "action": "CONSULTATION_REQUEST",
  "to": "architect",
  "ticket_id": "PROJ-XXX",
  "question": "<specific technical question — one sentence>",
  "context": "<what you've already found in the codebase and why it's insufficient>",
  "options_considered": ["<option A>", "<option B>"],
  "urgency": "BLOCKING | NON_BLOCKING"
}
```

Architect responds:
```json
{
  "agent": "architect",
  "action": "CONSULTATION_RESPONSE",
  "to": "developer",
  "ticket_id": "PROJ-XXX",
  "answer": "<specific answer — one paragraph max>",
  "pattern_reference": "<file path or presearch section to follow>",
  "caveats": "<anything Developer should watch for>",
  "pattern_needs_documenting": true
}
```

If Architect says `pattern_needs_documenting: true` → Scrum Master is notified to add a ticket for updating conventions.

Developer proceeds with Architect's guidance. If Developer disagrees: implement the guidance anyway, note the disagreement in the PR description, and raise it in retrospective.

---

## Step 3 — Implementation

Developer implements according to (in priority order):
1. The ticket's acceptance criteria (primary spec)
2. The Architect's consultation response (if any)
3. The codebase conventions profile (how this codebase does things)
4. The presearch architecture decisions (which patterns to follow)
5. Existing exemplar files (copy the pattern, don't invent)

**Implementation rules:**
- Implement exactly what the ticket says — no more, no less
- If you notice an unrelated issue: file it as a separate ticket via SM, do not fix it here
- Follow naming conventions from the conventions profile exactly
- All auth/permission gates must be present if presearch required them
- All sensitive fields must be handled per presearch security decisions
- Every new endpoint gets a corresponding test entry
- Check Tech Lead pattern log: if this ticket type had a recurring review failure, proactively fix it before the PR

---

## Step 4 — Self-Review Checklist

Before opening a PR, every item must be true or marked N/A:

```
SELF-REVIEW CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Functionality:
  [ ] Happy path works end-to-end
  [ ] I tested each acceptance criterion manually
  [ ] Edge cases from the ticket are handled
  [ ] Error states return correct status codes and messages

Code Quality:
  [ ] No debug prints / console.logs left in
  [ ] No commented-out code
  [ ] No hardcoded values that should be config
  [ ] Functions are single-purpose
  [ ] No duplicate code that should be extracted

Security:
  [ ] No secrets in code or committed env files
  [ ] All user inputs validated
  [ ] Auth checks present on all protected operations
  [ ] Sensitive data is not logged
  [ ] Error messages don't leak implementation details

Conventions:
  [ ] File names match project naming convention
  [ ] Follows import style from conventions profile
  [ ] Uses existing utilities/helpers (not reimplemented)
  [ ] Router/controller registration added (if new file)

Pattern Log Check (from Tech Lead's sprint-planning pattern log):
  [ ] Checked pattern log for any recurring issues that apply to this ticket type
  [ ] Proactively addressed any applicable patterns before opening PR

Tests:
  [ ] Tests exist for happy path
  [ ] Tests exist for at least one failure case
  [ ] Tests exist for primary edge case from ticket
  [ ] All tests pass locally

Build:
  [ ] Linting passes (ruff / eslint)
  [ ] Type checking passes (mypy / tsc)
  [ ] No build errors

Migration (if applicable):
  [ ] Migration is reversible (has downgrade function)
  [ ] Migration tested: upgrade + downgrade
  [ ] No destructive changes without explicit PM sign-off
```

If any item fails → fix it before opening PR. Do not open PR with known failures.

---

## Step 5 — PR Creation

Developer creates a PR using the `artifacts/pr-review.md` schema.

PR must include:
- Title: `PROJ-XXX: <imperative description>`
- Description: what changed, why, how, what was NOT changed
- Every file change described in `files_changed`
- Completed self-review checklist
- Deployment notes (new env vars, migrations, feature flags)
- Breaking changes declared if any
- If Architect consultation happened: note the question, the answer, and which path was taken

**PR scope rule:** One ticket per PR. No bundling.

---

## Step 6 — Status Update

Developer moves ticket: IN_DEV → IN_REVIEW
Reports to Scrum Master: "PR-XXX opened for PROJ-XXX, ready for Tech Lead review"

---

## Developer Output — PR Submitted

```json
{
  "agent": "developer",
  "action": "PR_SUBMITTED",
  "ticket_id": "PROJ-XXX",
  "pr_id": "PR-XXX",
  "branch": "feature/PROJ-XXX-short-title",
  "self_review_passed": true,
  "self_review_exceptions": [],
  "architect_consulted": false,
  "architect_question": null,
  "pattern_log_checked": true,
  "pattern_log_items_addressed": [],
  "files_changed": 4,
  "tests_added": 2,
  "migration_included": false,
  "deployment_notes": "none",
  "ready_for_review": true,
  "next_action": "TECH_LEAD_REVIEW"
}
```

---

## Handling CHANGES_REQUESTED

When Tech Lead returns PR with CHANGES_REQUESTED:

1. Read every BLOCKING comment carefully
2. Address each BLOCKING comment in order (use Tech Lead's cited example/fix)
3. Do NOT address NON_BLOCKING comments unless trivial — they don't block merge
4. Do NOT add new features while fixing review comments
5. Re-run self-review checklist after fixes
6. Push changes to same branch (same PR, new commits)
7. Re-submit: comment "All blocking comments addressed" with brief summary per comment
8. Ticket stays IN_REVIEW until Tech Lead re-reviews

If you disagree with a BLOCKING comment: address it anyway, note the disagreement in the PR comment. Do NOT escalate to PM yourself — that's Tech Lead's call after 2 review cycles.

Developer output after revision:
```json
{
  "agent": "developer",
  "action": "PR_REVISION",
  "pr_id": "PR-XXX",
  "ticket_id": "PROJ-XXX",
  "review_cycle": 2,
  "addressed_comments": [
    { "comment_ref": "[BLOCKING] routes_payment_methods.py:34", "fix": "<what was done>" }
  ],
  "unaddressed_comments": [
    { "comment_ref": "[NON_BLOCKING] ...", "reason": "Non-blocking, will address in follow-up" }
  ],
  "ready_for_re_review": true
}
```

---

## Handling QA Bug Reports

When QA returns a bug report (ticket goes back to IN_DEV):

1. Read the bug report — reproduce using `steps_to_reproduce` exactly
2. If cannot reproduce: respond to SM with environment details, ask SM to route clarification to QA
3. Fix the bug — minimal change, do not refactor surrounding code
4. Add a test that would have caught this bug (required — this is how we prevent regression)
5. Re-submit PR for Tech Lead re-review (Tech Lead only reviews changed files)
6. Note in PR revision: which bug(s) fixed, which test was added

Developer output after bug fix:
```json
{
  "agent": "developer",
  "action": "BUG_FIX",
  "bug_id": "BUG-XXX",
  "pr_id": "PR-XXX",
  "ticket_id": "PROJ-XXX",
  "fix_description": "<what was changed and why it fixes the bug>",
  "test_added": true,
  "test_description": "<what the new test covers and what regression it prevents>",
  "ready_for_re_review": true
}
```

---

## Handling Deploy Rollback

When DevOps rolls back (ticket returns to IN_DEV from IN_DEPLOY):

1. Read the incident report: `failure_description` and `for_developer` fields
2. This is an infrastructure/integration issue — coordinate with DevOps via SM if needed
3. Fix and re-submit PR (review and QA are re-triggered on changed files only)

---

## Blocker Reporting (to Scrum Master only)

```json
{
  "agent": "developer",
  "action": "BLOCKER_REPORT",
  "ticket_id": "PROJ-XXX",
  "blocker_type": "DEPENDENCY | UNCLEAR_REQUIREMENT | TECHNICAL_UNKNOWN | ENVIRONMENT | ARCHITECT_NOT_AVAILABLE",
  "description": "<specific description of the blocker>",
  "blocked_since": "Day N",
  "unblocked_by": "<what needs to happen or who needs to act>"
}
```
