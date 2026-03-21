---
name: review-loop
description: Code Review Loop. Tech Lead reviews every PR before QA. Returns APPROVED (→ QA) or CHANGES_REQUESTED (→ Developer). Can consult Architect for architectural violations. Logs patterns after each review — patterns are routed to Scrum Master for retrospective and sprint planning. Does not test features, does not manage the board, does not deploy.
---

# Code Review Loop

**Trigger:** Developer opens PR, ticket moves to IN_REVIEW
**Owner:** Tech Lead
**Input:** PR (per `artifacts/pr-review.md` schema) + codebase conventions profile + presearch architecture decisions + prior pattern log (to detect recurrence)
**Output:** APPROVED (→ QA Loop) or CHANGES_REQUESTED (→ Dev Loop back)

---

## Who Runs This Loop

| Agent | Role | Trigger | Does NOT Do |
|-------|------|---------|-------------|
| Tech Lead | Reviews code, issues decision with specific comments | Always | Write feature code, test, deploy, manage board |
| Architect | One-turn advisory consultation (optional) | Architectural violation found that requires clarification | Make product decisions, write code |

**Consultation rule:** Tech Lead may consult Architect when an architectural violation is found that requires design-level clarification (not just a convention deviation). This is single-turn. Tech Lead's review comment then references the Architect's answer. Architect does not take ownership.

---

## Step 1 — PR Intake Validation

Before reviewing code, Tech Lead validates the PR is complete:

```
PR INTAKE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] PR title matches format: PROJ-XXX: <imperative>
[ ] Scoped to exactly ONE ticket
[ ] description.what_changed is present
[ ] description.what_was_not_changed is present
[ ] All files_changed have summaries
[ ] self_review checklist is complete (no unchecked boxes)
[ ] deployment_notes present (or explicitly "none")
[ ] breaking_changes declared
[ ] If migration_included: migration fields are filled
[ ] If Architect consulted: consultation summary present in PR
```

If ANY intake item fails → **RETURN IMMEDIATELY** without reviewing code:
```json
{
  "decision": "CHANGES_REQUESTED",
  "reason": "INCOMPLETE_PR",
  "comments": [{ "type": "BLOCKING", "issue": "PR missing what_was_not_changed. Cannot review scope without it.", "fix": "Add what_was_not_changed field to PR description." }]
}
```

---

## Step 2 — Conventions Compliance Review

For each changed file:
- Filename matches naming pattern?
- File is in the correct directory?
- Imports follow the project's import style?
- Uses existing utilities/helpers (not reimplemented)?
- Structural pattern matches (route file, model, component, test)?

---

## Step 3 — Architecture Compliance Review

Verify implementation follows presearch decisions:
- Auth pattern matches presearch (e.g., `get_current_user` dependency injection)?
- Database access follows the ORM pattern?
- API response shape matches schema conventions?
- No new service/dependency introduced without architectural approval?
- Service boundaries not violated?
- No circular dependencies introduced?

**If architectural violation found that requires clarification (not just convention deviation):**

Tech Lead sends Architect consultation:
```json
{
  "agent": "tech-lead",
  "action": "CONSULTATION_REQUEST",
  "to": "architect",
  "pr_id": "PR-XXX",
  "ticket_id": "PROJ-XXX",
  "question": "<specific architectural question — one sentence>",
  "violation_found": "<what Developer implemented>",
  "presearch_decision": "<what presearch said>",
  "options": ["<is synchronous acceptable for MVP?", "must it be async per presearch decision?"],
  "urgency": "BLOCKING | NON_BLOCKING"
}
```

Architect responds:
```json
{
  "agent": "architect",
  "action": "CONSULTATION_RESPONSE",
  "to": "tech-lead",
  "pr_id": "PR-XXX",
  "answer": "<specific answer>",
  "is_blocking": true,
  "fix_required": "<what Developer must change>",
  "pattern_to_document": "<if this reveals a gap in documented conventions>"
}
```

Tech Lead's review comment then states: "Consulted Architect — [answer]. Required fix: [fix]."

---

## Step 4 — Security Review

For every file that handles user input or data access:
- [ ] All inputs validated before use
- [ ] No raw SQL with user data (ORM or parameterized queries)
- [ ] Auth check present before any data modification
- [ ] No credentials, tokens, or keys in code
- [ ] Sensitive fields handled per presearch security decisions
- [ ] Error messages don't leak implementation details
- [ ] No bypassed permission gates

Any security issue is automatically **BLOCKING** regardless of severity. No exceptions.

---

## Step 5 — Test Coverage Review

- [ ] Tests exist for happy path
- [ ] Tests exist for primary failure case
- [ ] Tests exist for edge cases from acceptance criteria
- [ ] Test assertions are meaningful (actually verify behavior, not just "doesn't throw")
- [ ] Test data is realistic
- [ ] Tests are isolated (no order dependency, no shared mutable state)

---

## Step 6 — Code Quality Review

- [ ] No debug code left in
- [ ] No commented-out code
- [ ] No hardcoded values that should be config
- [ ] Functions are single-purpose
- [ ] Error handling is explicit, not silent
- [ ] No N+1 query patterns
- [ ] No blocking calls in async contexts

---

## Step 7 — Decision

**APPROVED** when:
- Intake passes
- Zero BLOCKING comments
- All checklist items PASS or N/A
- Code would not embarrass the team if it shipped today

**CHANGES_REQUESTED** when:
- Any intake item fails
- Any checklist item FAILS
- Any BLOCKING comment exists
- Any security issue found (always BLOCKING)

**ESCALATE_TO_PM** when:
- Implementation fundamentally misunderstood the ticket (requires ticket redefinition)
- PR reveals a gap in presearch architecture requiring team decision
- Developer and Tech Lead have disagreed on the same item across 2 review cycles

---

## Comment Format (strict)

Every BLOCKING comment:
```
[BLOCKING]
File: <exact path>
Line: <exact number>
Issue: <what is wrong — one sentence>
Why it matters: <impact if not fixed — one sentence>
Fix: <exactly what to do>
Example: <file path or code snippet showing the correct pattern>
```

Every NON_BLOCKING comment:
```
[NON-BLOCKING — no merge required]
File: <exact path>
Line: <exact number>
Suggestion: <what could improve>
Why: <benefit>
```

Tech Lead never writes the fix for Developer. Tech Lead points to where the correct pattern exists.

---

## Re-Review Rules

When Developer submits a revision:
1. Only review files that changed since last review
2. Verify each BLOCKING comment from original review is addressed
3. Do NOT open new blocking comments on unchanged files
4. New issues in revised files → new blocking comment is valid
5. All blocking comments resolved → APPROVED

---

## Pattern Logging (after every review)

After every review (whether APPROVED or CHANGES_REQUESTED), Tech Lead logs pattern observations:

```json
{
  "agent": "tech-lead",
  "action": "PATTERN_LOG",
  "sprint": 2,
  "pr_id": "PR-XXX",
  "patterns_observed": [
    {
      "pattern": "RECURRING | NEW",
      "description": "Auth dependency missing from DELETE endpoints",
      "occurrence_count": 3,
      "root_cause_hypothesis": "Auth pattern for DELETE not documented clearly enough in CLAUDE.md",
      "recommendation_for": "architect | ba | pm | scrum-master",
      "recommendation_text": "Update CLAUDE.md auth section with explicit DELETE endpoint pattern"
    }
  ]
}
```

Pattern log is sent to Scrum Master:
- First occurrence (NEW): SM logs for tracking
- Second occurrence: SM flags in standup as process concern
- Third occurrence: SM adds to retrospective as mandatory agenda item

---

## Tech Lead Output

```json
{
  "agent": "tech-lead",
  "action": "PR_REVIEW",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "review_cycle": 1,

  "intake_passed": true,

  "checklist": {
    "conventions": "PASS | FAIL",
    "architecture": "PASS | FAIL",
    "security": "PASS | FAIL",
    "tests": "PASS | FAIL",
    "code_quality": "PASS | FAIL",
    "performance": "PASS | FAIL"
  },

  "decision": "APPROVED | CHANGES_REQUESTED | REJECTED",

  "comments": [
    {
      "type": "BLOCKING | NON_BLOCKING",
      "file": "",
      "line": 0,
      "issue": "",
      "why_it_matters": "",
      "fix": "",
      "example": ""
    }
  ],

  "blocking_count": 0,
  "non_blocking_count": 0,

  "architect_consulted": false,
  "architect_question": null,
  "architect_answer_summary": null,

  "pattern_log": [
    {
      "pattern": "NEW | RECURRING",
      "description": "",
      "occurrence_count": 1,
      "recommendation_for": "",
      "recommendation_text": ""
    }
  ],

  "summary": "<one paragraph: what was good, what needs fixing, overall assessment>",

  "next_action": "SEND_TO_QA | RETURN_TO_DEVELOPER | ESCALATE_TO_PM"
}
```

---

## Escalation to PM

```json
{
  "agent": "tech-lead",
  "action": "ESCALATE_TO_PM",
  "pr_id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "reason": "FUNDAMENTAL_MISUNDERSTANDING | ARCHITECTURE_GAP | REPEATED_DISAGREEMENT",
  "description": "<what the architectural or product gap is>",
  "options": ["<option A>", "<option B>"],
  "tech_lead_recommendation": "<Tech Lead's recommendation if any>",
  "review_cycle": 3
}
```

PM decides. Tech Lead implements the decision. The decision is logged in presearch under "Human Decisions Made" if it requires a change to architecture.
