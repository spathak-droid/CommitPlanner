---
name: pr-review
description: Pull request artifact format. Created by Developer when submitting work for review. Contains the PR description, diff summary, self-review checklist, and links. Tech Lead fills in the review decision. QA fills in the test result.
---

# Pull Request Format

A PR is the unit of handoff between Developer → Tech Lead → QA → DevOps. It carries all the information each downstream agent needs to do their job without asking the Developer questions. If the PR is missing information, Tech Lead returns it immediately.

---

## PR Schema

```json
{
  "id": "PR-XXX",
  "ticket_ref": "PROJ-XXX",
  "sprint": N,
  "author": "developer",
  "created_on": "Day N",
  "branch": "feature/PROJ-XXX-short-description",
  "base_branch": "main",
  "status": "OPEN | IN_REVIEW | CHANGES_REQUESTED | APPROVED | IN_QA | QA_PASSED | MERGED | CLOSED",

  "title": "<ticket ID: imperative description>",

  "description": {
    "what_changed": "<1-3 sentences: what does this PR do?>",
    "why": "<link to ticket / business reason>",
    "how": "<brief implementation approach — key decisions made>",
    "what_was_not_changed": "<scope boundaries — what was explicitly left out>"
  },

  "files_changed": [
    {
      "file": "<path/to/file.py>",
      "change_type": "ADDED | MODIFIED | DELETED",
      "summary": "<one-line description of what changed in this file>"
    }
  ],

  "self_review": {
    "tested_locally": true,
    "happy_path_works": true,
    "edge_cases_tested": ["<list of edge cases manually tested>"],
    "no_debug_code": true,
    "no_secrets_committed": true,
    "migrations_reversible": true,
    "tests_added": true,
    "tests_pass": true,
    "linting_passes": true,
    "types_check": true
  },

  "migration_included": false,
  "migration_reversible": null,
  "migration_tested": null,

  "breaking_changes": false,
  "breaking_change_description": null,

  "deployment_notes": "<anything DevOps needs to know: new env vars, migration to run, flag to enable>",

  "screenshots": [],

  "tech_lead_review": {
    "reviewer": "tech-lead",
    "decision": "APPROVED | CHANGES_REQUESTED | REJECTED",
    "reviewed_on": "Day N",
    "comments": [],
    "checklist_summary": {}
  },

  "qa_result": {
    "tester": "qa",
    "result": "PASS | FAIL",
    "tested_on": "Day N",
    "bugs_filed": [],
    "test_cycles": N
  },

  "merged_by": "devops",
  "merged_on": "Day N"
}
```

---

## Developer PR Rules

Before submitting a PR, the Developer must:

1. **Self-review checklist** — all items must be true or explicitly noted as N/A with reason
2. **Every file change is described** — Tech Lead should not have to guess what changed
3. **Deployment notes are complete** — if there are new env vars, migrations, or feature flags, they must be listed
4. **Breaking changes declared** — if any API contracts changed, flag it explicitly
5. **PR is scoped to ONE ticket** — multi-ticket PRs are rejected immediately by Tech Lead

**PR title format:**
```
PROJ-XXX: <imperative verb> <what changed>
```
Example: `PROJ-001: Add PaymentMethod list endpoint with sorting and filtering`

---

## PR Lifecycle

```
Developer opens PR (status: OPEN)
  ↓
Tech Lead picks up for review (status: IN_REVIEW)
  ↓
  ├── APPROVED → status: APPROVED → moves to IN_QA
  └── CHANGES_REQUESTED → status: CHANGES_REQUESTED → returned to Developer
        ↓
      Developer fixes and re-submits (status: OPEN)
        ↓
      Tech Lead re-reviews (only changed files)
        ↓
      (loop until APPROVED or REJECTED)

In QA (status: IN_QA)
  ↓
  ├── QA PASS → status: QA_PASSED → moves to DevOps for deploy
  └── QA FAIL → status: CHANGES_REQUESTED → bugs filed → returned to Developer
        ↓
      Developer fixes bug (new commit on same branch or new PR for bug ticket)
        ↓
      Tech Lead re-reviews (only changed files)
        ↓
      QA re-tests (only failing scenarios)
        ↓
      (loop until QA_PASSED or REJECTED)

DevOps merges (status: MERGED)
```

---

## What Each Agent Does With the PR

| Agent | Reads | Writes |
|-------|-------|--------|
| Tech Lead | description, files_changed, self_review, migration_included | tech_lead_review |
| QA | description, acceptance_criteria (from ticket), deployment_notes | qa_result, bug reports |
| DevOps | deployment_notes, migration_included, breaking_changes | merged_by, merged_on |

---

## Example PR

```json
{
  "id": "PR-012",
  "ticket_ref": "PROJ-001",
  "sprint": 1,
  "author": "developer",
  "created_on": "Day 3",
  "branch": "feature/PROJ-001-payment-method-list",
  "base_branch": "main",
  "status": "OPEN",

  "title": "PROJ-001: Add PaymentMethod list endpoint with sorting and filtering",

  "description": {
    "what_changed": "Adds GET /api/payment-methods endpoint with sort and filter query params. Adds PaymentMethod SQLAlchemy model and Alembic migration. Adds React list component and page.",
    "why": "Closes PROJ-001 — merchants need to view and manage their payment methods",
    "how": "Followed the routes_scenarios.py pattern for the API. Used existing table component pattern from ResponseForm. Migration adds payment_methods table with index on user_id.",
    "what_was_not_changed": "Does not implement create/edit/delete (those are PROJ-002, PROJ-003). Does not implement vault_ref encryption (PROJ-004)."
  },

  "files_changed": [
    { "file": "alembic/versions/20260317_add_payment_methods.py", "change_type": "ADDED", "summary": "Migration: adds payment_methods table" },
    { "file": "src/db/models.py", "change_type": "MODIFIED", "summary": "Adds PaymentMethod model class" },
    { "file": "src/api/routes_payment_methods.py", "change_type": "ADDED", "summary": "GET /api/payment-methods with sort/filter" },
    { "file": "src/api/schemas.py", "change_type": "MODIFIED", "summary": "Adds PaymentMethodResponse schema" },
    { "file": "src/api/routes.py", "change_type": "MODIFIED", "summary": "Registers payment_methods router" },
    { "file": "frontend/src/app/payment-methods/page.tsx", "change_type": "ADDED", "summary": "List page with sort/filter UI" },
    { "file": "frontend/src/components/PaymentMethodList.tsx", "change_type": "ADDED", "summary": "Table component with sort/filter" },
    { "file": "tests/test_payment_methods.py", "change_type": "ADDED", "summary": "pytest: list endpoint happy path + sort/filter edge cases" }
  ],

  "self_review": {
    "tested_locally": true,
    "happy_path_works": true,
    "edge_cases_tested": ["empty list", "filter with no results", "sort by all columns"],
    "no_debug_code": true,
    "no_secrets_committed": true,
    "migrations_reversible": true,
    "tests_added": true,
    "tests_pass": true,
    "linting_passes": true,
    "types_check": true
  },

  "migration_included": true,
  "migration_reversible": true,
  "migration_tested": true,

  "breaking_changes": false,

  "deployment_notes": "Run: alembic upgrade head before deploying. No new env vars. No feature flags."
}
```
