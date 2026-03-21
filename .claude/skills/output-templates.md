---
name: output-templates
description: Final output templates for the team-presearch system. Defines the exact structure of presearch.md and PRD.md generated after convergence. The orchestrator uses these as fill-in-the-blank templates.
---

# Output Templates

These are the final artifacts produced when the team-presearch loop converges. The orchestrator fills these in from the cumulative locked_decisions and round outputs.

---

## presearch.md Template

```markdown
# Presearch: [PROJECT NAME]

> **Status:** CONVERGED after [N] loops
> **Team:** Researcher (Jordan) · BA (Riley) · PM (Alex) · Architect (Morgan) · Developer (Sam) · QA (Casey) · DevOps (Drew)
> **Date:** [DATE]
> **Session ID:** [SESSION_ID]

---

## 1. Project Brief (Original)

[PASTE ORIGINAL BRIEF VERBATIM]

---

## 2. Constraints

*From: BA (Round 1) + PM (Round 1, Round 4)*

### 2.1 Scope
**In scope (MVP):**
- [R1]: [description]
- [R2]: [description]

**In scope (Stretch):**
- [R3]: [description]

**Explicitly excluded:**
- [item]: [reason]

### 2.2 User Personas
[FROM BA OUTPUT]

### 2.3 Scale & Performance
| Dimension | Target | Source |
|-----------|--------|--------|
| Request volume | | |
| Latency (P95) | | |
| Concurrent users | | |
| Data volume | | |

### 2.4 Budget & Timeline
| Category | Budget/Deadline | Notes |
|----------|----------------|-------|
| MVP delivery | | |
| Infrastructure/month | | |
| API costs/month | | |

### 2.5 Data Sensitivity
[FROM BA + DEVOPS outputs]

---

## 3. Architecture Decisions

*From: Architect (Round 2) + Developer (Round 2)*

### 3.1 System Architecture

```
[ASCII DIAGRAM FROM ARCHITECT]
```

### 3.2 Technology Stack

| Layer | Decision | Rejected Alternatives | Rationale |
|-------|----------|-----------------------|-----------|
| Language | | | |
| Framework | | | |
| Database | | | |
| Auth | | | |
| Cache | | | |
| Queue | | | |
| Hosting | | | |

### 3.3 Data Model (High-Level)

[KEY ENTITIES, RELATIONSHIPS, STATE MACHINES FROM ARCHITECT]

### 3.4 Service Topology

| Service | Port | Responsibility | Data Owned |
|---------|------|---------------|------------|
| | | | |

### 3.5 Integration Map

| Integration | Auth | Rate Limit | Fallback |
|-------------|------|------------|----------|
| | | | |

### 3.6 Developer Reality Check

*From: Developer (Round 2)*

**Timeline assessment:** [REALISTIC / TIGHT / UNREALISTIC]
**Biggest complexity risk:** [FROM DEVELOPER]

**Effort estimates:**
| Component | Estimate | Complexity | Notes |
|-----------|----------|------------|-------|
| | | | |

**Architectural pushbacks resolved:**
- [pushback]: [resolution]

---

## 4. Quality & Verification

*From: QA (Round 3)*

### 4.1 Test Strategy

| Layer | Coverage Target | Framework | CI Gate |
|-------|----------------|-----------|---------|
| Unit | | | YES/NO |
| Integration | | | YES/NO |
| E2E | | | YES/NO |
| AI evals (if applicable) | | | YES/NO |

### 4.2 Quality Gates

| Gate | Criterion | Blocks Merge | Blocks Release |
|------|-----------|-------------|----------------|
| | | | |

### 4.3 Failure Mode Register

| Failure Mode | Component | Severity | Mitigation | Test Covered |
|-------------|-----------|----------|------------|--------------|
| | | | | |

### 4.4 Edge Cases (Unresolved → Moved to Implementation)

[List of edge cases surfaced by QA that are deferred to implementation phase]

---

## 5. Operations & Infrastructure

*From: DevOps (Round 3)*

### 5.1 Deployment Strategy
[FROM DEVOPS]

### 5.2 CI/CD Pipeline
[FROM DEVOPS]

### 5.3 Observability Stack
| Layer | Tool | What's Measured |
|-------|------|----------------|
| Logs | | |
| Metrics | | |
| Traces | | |
| Alerts | | |

### 5.4 Infrastructure Cost

| Environment | Monthly Est. | Key Drivers |
|-------------|-------------|-------------|
| Development | | |
| Staging | | |
| Production (launch) | | |
| Production (10x scale) | | |

### 5.5 Secrets & Security

[FROM DEVOPS: secrets management approach, security posture]

---

## 6. Research Findings

*From: Researcher (Round 0)*

[SUMMARIZED LANDSCAPE FINDINGS — key insights that drove architecture decisions]

---

## 7. Decision Log

| # | Decision | Owner | Rationale | Alternatives Rejected | Loop Decided |
|---|----------|-------|-----------|----------------------|-------------|
| D1 | | | | | |
| D2 | | | | | |

---

## 8. Risk Register

| # | Risk | Severity | Likelihood | Mitigation | Owner |
|---|------|----------|------------|------------|-------|
| R1 | | | | | |
| R2 | | | | | |

---

## 9. Open Items (Deferred, Not Unresolved)

Things explicitly punted to implementation — known, accepted, not forgotten:

| Item | Why Deferred | When to Revisit |
|------|-------------|-----------------|
| | | |

---

## 10. Human Decisions Made

[If any decisions required manual human input during loops:]

| Decision | Human Choice | Context |
|----------|-------------|---------|
| | | |

---

## Loop History

| Loop | Conflicts In | Conflicts Resolved | Result |
|------|-------------|-------------------|--------|
| 1 | 0 | 0 | CONVERGE / LOOP_AGAIN |
| 2 | N | M | CONVERGE / LOOP_AGAIN |
```

---

## PRD.md Template

```markdown
# PRD: [PROJECT NAME]

> **Based on presearch:** [presearch.md]
> **Generated:** [DATE]
> **MVP deadline:** [DATE]

---

## Phase Dependency Map

```
Phase 1: [Foundation/Scaffold]
  └── Phase 2: [Core Backend] + Phase 3: [Core Frontend]  ← parallel
        └── Phase 4: [Integration]
              └── Phase 5: [Polish] + Phase 6: [Observability]  ← parallel
                    └── Phase 7: [Launch Prep]
```

---

## Phase 1: [Name]

**Goal:** [One sentence.]
**Depends on:** Nothing — first phase
**Estimated effort:** [Xh]
**Team:** [who works on this]

### Requirements
- [ ] [Requirement from presearch R-list]
- [ ] [Requirement]

### Acceptance Criteria
- [ ] [Specific, testable condition]
- [ ] [Performance target, if applicable]
- [ ] Developer can run this locally in < 30 minutes

### Key Decisions Applied
- [D1]: [how it manifests in this phase]

### Definition of Done
All requirements checked. All acceptance criteria passing. QA sign-off on test coverage for this phase.

---

## Phase 2: [Name]

[Same structure as Phase 1]

---

## MVP Validation Checklist

| # | Requirement | Phase | Acceptance Criterion | Status |
|---|-------------|-------|---------------------|--------|
| R1 | | Phase N | | [ ] |
| R2 | | Phase N | | [ ] |

All MVP requirements must be checked before launch.

---

## Stretch Goals

Ordered by impact:

1. **[Stretch goal 1]** — [1-line description, estimated effort, unlock condition]
2. **[Stretch goal 2]** — [same]
3. **[Stretch goal 3]** — [same]

---

## Implementation Notes from Presearch

Key conventions and patterns the team agreed on:

- **File organization:** [FROM ARCHITECT + DEVELOPER agreement]
- **Error handling:** [FROM QA + DEVELOPER agreement]
- **Logging standard:** [FROM DEVOPS]
- **Test conventions:** [FROM QA]
- **Naming conventions:** [FROM ARCHITECT]

---

## CLAUDE.md Additions

*Add these to the project's CLAUDE.md after the PRD is approved:*

```markdown
## Architecture
[key architectural decisions that Claude should follow]

## Tech Stack
[language, framework, DB, auth — with versions]

## Testing Requirements
[test standards, coverage targets, what blocks merge]

## Deployment
[how to deploy, environment variables needed]

## Key Patterns
[conventions decided in presearch — naming, file organization, error handling]
```
```
