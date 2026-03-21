---
name: loop-engine
description: Core execution engine for team-presearch. Defines the reaction round protocol, consultation routing between agents, quality scoring, conflict classification, and convergence rules. The orchestrator follows this exactly.
---

# Loop Engine — Execution Protocol

This is the mechanical contract for all loops in the system. Orchestrator follows this. Agents follow this. No deviations.

---

## Fundamental Principle: Every Output Gets a Reaction

No agent output is accepted without being distributed to agents who care about it. The sequence is:

```
Agent A produces output
  → Orchestrator checks: who has stated concerns about A's domain?
  → Orchestrator checks: who asked A a question?
  → Orchestrator checks: does A's output contradict B's locked decision?
  → If any YES: spawn reaction agents immediately (same loop, new sub-round)
  → Reaction agents respond
  → Re-run conflict detection
  → Only then advance to next main round
```

This continues until no agent has an outstanding concern about another agent's output, or max reaction sub-rounds are reached.

---

## Main Round Definitions

### ROUND 0 — Research Sweep
```
Owner:      Researcher
Parallel:   No
Input:      Project brief only
Tools:      WebSearch + WebFetch (MANDATORY — no research from training data alone)
Output:     Landscape findings with live URLs, prior art, unknowns, spikes recommended,
            security_summary (CVEs, supply chain), version_maturity_summary (LTS, EOL),
            web_research_log (every search query + source URL)
Reaction:   BA + PM react to findings (do findings change requirements?)
Gate:       Researcher always proceeds. Never blocks.
            QUALITY CHECK: If web_research_log is empty or all findings have
            freshness="training_data", orchestrator re-spawns Researcher with
            explicit instruction to use WebSearch/WebFetch.
```

### ROUND 1 — Requirements Lock
```
Owner:      BA + PM
Parallel:   Yes (same context, independent outputs)
Input:      Brief + Round 0 outputs + Round 0 reactions
Output:     Requirements list, MVP line, scope exclusions
Reaction A: Architect + Developer react (is this feasible? does this change design?)
Reaction B: If Architect flags infeasibility → BA + PM respond (modify or accept?)
Gate:       Both BA and PM must be READY. If they conflict → carry to Round 2 as CONFLICT.
```

### ROUND 2 — Architecture + Design Debate
```
Owner:      Architect + Designer + Developer
Parallel:   Yes
Input:      All prior outputs + reactions + carry-forward conflicts
Tools:      Designer MUST use WebSearch (Dribbble/Behance/competitors) + Pencil MCP tools
Output:     Tech stack (with rejected alternatives), data model, effort estimates, pushbacks,
            Designer: screen inventory + design_research (inspiration sources, competitor analysis)
Reaction A: QA (testability + visual testability) + DevOps (operability + asset pipeline) react
Reaction B: Architect + Designer + Developer respond to QA/DevOps concerns
Gate:       Architect READY_TO_DECIDE + Developer READY_TO_DECIDE (or BLOCKED → immediate escalation)
            QUALITY CHECK: If Designer's design_research.inspiration_sources is empty,
            orchestrator re-spawns Designer with explicit instruction to search Dribbble/Behance first.
```

### ROUND 3 — Risk and Ops Review
```
Owner:      QA + DevOps
Parallel:   Yes
Input:      All prior outputs + all reactions
Output:     Full test strategy, full ops/infra plan, failure modes
Reaction A: PM classifies each risk: BLOCKER | ACCEPTED | DEFERRED
Reaction B: Architect + Developer respond to BLOCKER risks with mitigation
Gate:       All BLOCKER risks have a mitigation or PM has accepted the unmitigated risk.
```

### ROUND 4 — Synthesis
```
Owner:      PM (solo)
Parallel:   No
Input:      Everything from all rounds and all reactions
Output:     CONVERGE (with full decision log) or LOOP_AGAIN (with conflict list + agents)
Gate:       No gate — PM always produces a result.
            CONVERGE requires all 9 convergence criteria met.
            LOOP_AGAIN requires specific: conflicts, agents, questions.
```

---

## Agent Spawning — Context Package

Every agent spawn receives this exact context package:

```
═══════════════════════════════════════════════════════════
CONTEXT PACKAGE: [AGENT] — Round [N][sub], Loop [M]
═══════════════════════════════════════════════════════════

PERSONA:
[Full content of personas/<agent>.md — including cross-review section]

YOU ARE: [Agent name] — [persona first name]
Speak as [first name]. Own your domain. Push back with evidence.
Start your response with the identity header from agent-protocol.md.
End your response with the status footer from agent-protocol.md.

PROJECT BRIEF:
[Original brief verbatim — never paraphrased]

ALL PRIOR OUTPUTS (chronological):
[Every agent output and reaction, in order, as structured JSON]

CONFLICT CONTEXT:
[If Loop 2+: PM's LOOP_AGAIN conflict list verbatim]
[If Reaction sub-round: the specific output you are reacting to]

WHAT YOU MUST DO THIS SUB-ROUND:
[Exact question(s) this agent must answer]
[If reaction: cite the specific claim/concern you are responding to]

CROSS-REVIEW CHECKLIST (from your persona):
[Relevant cross-review items for the agents whose output you're seeing]

RULES:
1. Open with your identity header (╔══...╗ block). Close with your status footer (━━━ line).
2. If this is a reaction sub-round: address the specific concern. Do not re-state prior positions.
3. If another agent raised a concern about your domain: respond to it directly. "I acknowledge X" is not a response.
4. Change your position if the evidence warrants it. State what changed and why.
5. Do not repeat positions unchanged from a prior loop — explain why they still hold.
6. Output must be valid JSON matching your persona's output schema.
7. The status footer must be the absolute last line of your response.
═══════════════════════════════════════════════════════════
```

---

## Reaction Sub-Round Protocol

### When to trigger a reaction:

After any agent produces output, the orchestrator checks:

| Trigger | Who reacts | What they respond to |
|---------|-----------|----------------------|
| Agent A has `questions_for_team: {B: "..."}` | Agent B | The specific question |
| Agent A has `concerns: ["B: ..."]` | Agent B | The specific concern |
| Agent A's position contradicts Agent B's locked_decision | Both A and B | The conflict |
| QA or DevOps flags CRITICAL risk | Architect + Developer | The risk |
| Developer flags UNREALISTIC timeline | PM | Scope cut options |
| Architect flags requirement as infeasible | BA + PM | Modify requirement or accept constraint |

### Reaction sub-round format:

Reaction outputs use a trimmed schema (faster, focused):
```json
{
  "agent": "<name>",
  "sub_round": "<N><letter>",
  "reacting_to": "<agent name + the specific claim>",
  "response": "<direct response — agree / disagree with evidence / propose compromise>",
  "position_changed": false,
  "position_change_reason": "",
  "new_concern": null,
  "status": "RESOLVED | STILL_OPEN | NEW_CONFLICT"
}
```

`RESOLVED` = the concern is addressed to the reacting agent's satisfaction.
`STILL_OPEN` = response didn't satisfy — needs another sub-round or Loop N+1.
`NEW_CONFLICT` = the response revealed a new problem (triggers new reaction).

### Max reaction sub-rounds:
- Per main round: 2 reaction sub-rounds maximum
- If `STILL_OPEN` after 2 reactions: carry as CONFLICT into next main round or Loop N+1

---

## Conflict Classification and Routing

After every output batch (main round or reaction), classify all conflicts:

```
SEVERITY: HIGH
  → Must resolve before CONVERGE
  → Triggers LOOP_AGAIN if in Round 4
  Conditions:
    - Two agents' locked_decisions are incompatible
    - Any BLOCKED agent
    - Developer says UNREALISTIC and PM hasn't adjusted scope
    - QA or DevOps CRITICAL risk not mitigated
    - Security concern unaddressed

SEVERITY: MEDIUM
  → Should resolve, but PM can override
  → PM documents override reason
  Conditions:
    - Open question unanswered but doesn't block a locked_decision
    - Agents prefer different options but can live with either
    - Risk flagged but classified ACCEPTED by PM

SEVERITY: LOW
  → Log for awareness, not blocking
  → Defer to implementation
  Conditions:
    - Style/preference differences
    - Non-blocking review suggestions
    - Questions about stretch goals
```

Only HIGH conflicts block CONVERGE. MEDIUM requires PM acknowledge. LOW is logged only.

---

## Quality Score

Computed after every round and displayed in narration:

```
locked_decisions_count = total unique decisions locked by any agent
total_decisions_count = total decisions the team must make (estimated from brief)
conflicts_open_high = count of HIGH severity conflicts currently open
conflicts_open_medium = count of MEDIUM severity conflicts currently open

quality_score = (locked_decisions_count / total_decisions_count * 100)
                - (conflicts_open_high * 10)
                - (conflicts_open_medium * 3)

progress = quality_score_this_loop - quality_score_last_loop
```

**Progress interpretation:**
- `progress > 15` per loop: healthy convergence
- `progress 5-15` per loop: slow but moving — flag to user
- `progress < 5` across 2 loops: spinning — escalate to human

---

## Convergence Checklist (all 9 required)

```
□ 1. All agents status == READY_TO_DECIDE
□ 2. Zero HIGH-severity conflicts open
□ 3. Zero BLOCKED agents
□ 4. QA output contains: "architecture is testable — I sign off"
□ 5. DevOps output contains: "architecture is operable — I sign off"
□ 6. Developer timeline_assessment != UNREALISTIC
□ 7. PM has classified every risk (BLOCKER mitigated, ACCEPTED acknowledged, DEFERRED logged)
□ 8. PM has declared MVP scope final
□ 9. No OPEN_QUESTION with HIGH severity remains between any two agents
```

---

## Loop N+1 Targeting

When PM returns LOOP_AGAIN, the orchestrator does NOT run the full 5-round sequence. Instead:

```json
{
  "pm_directive": {
    "agents_to_respawn": ["architect", "developer"],
    "skip_agents": ["researcher", "ba", "qa", "devops"],
    "conflicts": [
      {
        "id": "C1",
        "topic": "database selection",
        "description": "Architect: PostgreSQL. Developer: estimates 2 extra weeks for migration tooling.",
        "question_for_architect": "Is there a simpler schema that works with SQLite for MVP?",
        "question_for_developer": "If Architect simplifies schema, does the estimate change?"
      }
    ],
    "pm_provisional_decisions": [
      "auth: Firebase JWT — locked regardless of loop outcome",
      "api_framework: FastAPI — locked"
    ],
    "pm_forced_deadline": "Loop 3 is the last. I will make the final call then."
  }
}
```

In Loop N+1: only respawned agents run, in a targeted sub-round, with the conflict as their sole context. Other agents' outputs carry forward unchanged.

---

## State File

The orchestrator maintains this state file, updated after every sub-round:

```json
{
  "session_id": "presearch-<date>-<project>",
  "project": "<name>",
  "current_loop": 1,
  "current_round": 2,
  "current_sub_round": "2a",
  "status": "IN_PROGRESS | CONVERGED | ESCALATED",
  "quality_score": 47,
  "quality_progress": [
    { "loop": 1, "after_round_4": 35 },
    { "loop": 2, "after_round_4": 47 }
  ],
  "outputs": {
    "L1_R0": { "researcher": <output> },
    "L1_R0a": { "ba": <reaction>, "pm": <reaction> },
    "L1_R1": { "ba": <output>, "pm": <output> },
    "L1_R1a": { "architect": <reaction>, "developer": <reaction> }
  },
  "conflicts": {
    "HIGH": [<conflict list>],
    "MEDIUM": [<conflict list>],
    "LOW": [<conflict list>]
  },
  "locked_decisions": [<cumulative master list>],
  "loop_history": [
    { "loop": 1, "quality_score": 35, "high_conflicts_in": 5, "high_conflicts_out": 2, "result": "LOOP_AGAIN" },
    { "loop": 2, "quality_score": 47, "high_conflicts_in": 3, "high_conflicts_out": 0, "result": "CONVERGE" }
  ]
}
```
