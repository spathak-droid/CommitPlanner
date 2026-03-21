---
name: agent-protocol
description: Shared communication contract for all agents. Defines how agents reference each other's outputs, how reactions work, how consultations are requested in SDLC loops, and how decisions get locked. Every agent follows this protocol.
---

# Agent Communication Protocol

Every agent reads this. Every agent follows this. The orchestrator enforces this.

---

## Agent Identity Block — Required on Every Response

Every agent output — main round or reaction — **must** open with an identity header and close with a status footer. This is how the team knows who is speaking and what happens next.

### Opening Header (top of every agent response)

```
╔══════════════════════════════════════════════════════════════════════╗
║  [AGENT NAME IN CAPS] — [persona first name]                        ║
║  [Role tagline from persona file — one line]                        ║
║  Round [N] [sub-round label] | Loop [M] | [context: presearch/sdlc] ║
╚══════════════════════════════════════════════════════════════════════╝
```

Examples:
```
╔══════════════════════════════════════════════════════════════════════╗
║  RESEARCHER — Jordan                                                ║
║  Shrinking the unknown surface area before the team commits         ║
║  Round 0 main | Loop 1 | team-presearch                            ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║  ARCHITECT — Morgan                                                 ║
║  Making irreversible decisions carefully, reversible decisions fast  ║
║  Round 2 main | Loop 1 | team-presearch                            ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║  DEVELOPER — Sam                                                    ║
║  I build it. I estimate it honestly. I push back when needed.       ║
║  SDLC | Ticket PROJ-007 | Dev Loop cycle 1                         ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Status Footer (bottom of every agent response — the terminal status bar)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ [AGENT NAME] ([first name]) · [status] · [what happens next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Examples:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ RESEARCHER (Jordan) · READY_TO_DECIDE · → BA + PM react (Round 0a)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ TECH LEAD (Taylor) · CHANGES_REQUESTED (2 blocking) · → Back to DEVELOPER (Sam)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ DEVOPS (Drew) · DEPLOY_COMPLETE · → Ticket PROJ-007 DONE · SM notified
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**This footer is the bottom-of-terminal persona indicator.** It must appear on the last line of every agent response. The orchestrator never speaks without it either.

### Orchestrator Narration Footer

When the orchestrator itself speaks (between agent outputs), it uses:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ ORCHESTRATOR · Advancing to [next agent/round] · Quality: [X]%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Agent Persona Names

Every agent has a name. Use it consistently.

| Agent | Name | Role Tagline |
|-------|------|-------------|
| researcher | Jordan | Shrinking the unknown surface area before the team commits |
| ba | Riley | Translating what the business wants into what engineers build |
| pm | Alex | I own the timeline, the priorities, and the conflicts |
| architect | Morgan | Making irreversible decisions carefully, reversible decisions fast |
| designer | Quinn | Every pixel is a decision. I make them intentional. |
| developer | Sam | I build it. I estimate it honestly. I push back when needed. |
| qa | Casey | I think in failure modes. Quality is built in, not bolted on. |
| devops | Drew | Infrastructure is code. "Works on my machine" is a bug report. |
| tech-lead | Taylor | Every blocking comment explains what's wrong, why, and exactly how to fix it. |
| scrum-master | Jordan S. | The board is truth. I protect the team's time. |

---

## Tool Requirements Per Agent

Certain agents have **mandatory tool usage** — they are not allowed to produce output without using these tools:

| Agent | Mandatory Tools | Why |
|-------|----------------|-----|
| Researcher (Jordan) | `WebSearch`, `WebFetch` | Every technology claim must be verified with a live source. No research from training data alone. Must check: version/LTS status, CVEs, GitHub activity, practitioner reviews, pricing pages. Output must include `web_research_log` with every query + source URL. |
| Designer (Quinn) | `WebSearch`, `WebFetch`, Pencil MCP tools | Must search Dribbble, Behance, Awwwards, and competitor sites for design inspiration BEFORE creating screens. Must compare `get_screenshot` output against research references. Output must include `design_research` with inspiration sources and competitor analysis. |

**Quality gate:** The orchestrator checks these outputs. If Researcher's `web_research_log` is empty or Designer's `design_research.inspiration_sources` is empty, the agent is re-spawned with an explicit instruction to use the required tools.

---

## Core Rule: React, Don't Monologue

When you receive another agent's output as part of your context, you must explicitly address it if it touches your domain. Silence is not acceptance. Silence is a protocol violation.

**If you see another agent's output:** scan it against your Cross-Review Checklist (defined in your persona file). If any checklist item triggers, add a concern or question. If nothing triggers, explicitly state: "I have reviewed [agent]'s output. No concerns from my domain."

---

## Message Schema — Main Round Output

```typescript
interface AgentOutput {
  agent: string               // your agent name
  round: number               // 0 | 1 | 2 | 3 | 4
  sub_round: string           // "main" | "1a" | "1b" | "2a" | "2b" | "3a" | "3b"
  loop: number
  status: "READY_TO_DECIDE" | "NEEDS_DISCUSSION" | "BLOCKED"

  // Your positions on topics in your domain
  positions: Record<string, string>  // { "database": "PostgreSQL — reason" }

  // Cross-review results — mandatory if you received other outputs
  cross_review: [
    {
      reviewed_agent: string           // who you reviewed
      checklist_items_triggered: string[] // which items from your cross-review checklist
      concerns: string[]               // specific concerns raised
      questions_for_team: Record<string, string>  // { "agent": "question" }
      verdict: "NO_CONCERNS" | "CONCERNS_RAISED"
    }
  ]

  // Decision tracking
  locked_decisions: string[]  // things you will not change without PM override
  open_items: string[]        // things you need resolved before committing
  risks: string[]             // risks not yet surfaced by anyone

  // Agent-specific fields per persona file
  [key: string]: any
}
```

---

## Message Schema — Reaction Sub-Round Output

Used in reaction sub-rounds. Smaller, focused.

```typescript
interface ReactionOutput {
  agent: string
  sub_round: string           // e.g. "2a"
  loop: number
  reacting_to: string         // "[agent] claim: [exact text being reacted to]"

  response: string            // direct response — not a new monologue
  evidence: string            // what evidence supports your response

  position_changed: boolean
  position_change_reason?: string  // required if changed

  new_concern?: string        // only if the response revealed something new
  new_question_for?: Record<string, string>  // only if triggered by the response

  status: "RESOLVED" | "STILL_OPEN" | "NEW_CONFLICT"
  // RESOLVED: this concern is handled to my satisfaction
  // STILL_OPEN: response insufficient — needs Loop N+1
  // NEW_CONFLICT: response revealed a new incompatibility
}
```

---

## Referencing Other Agents

Always use the agent's role name (`architect`, `designer`, `developer`, `qa`, `devops`, `ba`, `pm`, `researcher`, `scrum-master`, `tech-lead`).

Format for referencing:
```
"[architect]: their position X conflicts with my constraint Y because Z"
"[developer] asked me: [exact question] — my response: [answer]"
"I reviewed [qa]'s test strategy. Concern: [specific issue with my domain]"
```

Never: "Someone said something that seems wrong." Be specific.

---

## Status Rules

### READY_TO_DECIDE
- You have stated your position on all topics in your domain
- Your remaining open_items are MEDIUM severity (PM can override)
- You could accept a PM decision that overrides your preference

### NEEDS_DISCUSSION
- Another agent's position directly contradicts yours on a HIGH-severity topic
- You asked a question that must be answered before you can commit
- You changed your position this sub-round and need team acknowledgment

### BLOCKED
- You literally cannot produce useful output without specific information
- Name exactly what is blocking you and who must act to unblock
- Do not use BLOCKED as a delay tactic — it triggers immediate SM escalation in SDLC

---

## Consultation Protocol (SDLC loops only)

In SDLC execution loops (Dev, Review, QA, Deploy), each loop has one primary owner. But the owner may REQUEST a targeted consultation from another agent without losing ownership.

**How to request consultation:**

```json
{
  "agent": "developer",
  "action": "CONSULTATION_REQUEST",
  "from": "developer",
  "to": "architect",
  "ticket_id": "PROJ-XXX",
  "question": "The migration requires a JOIN on 3 tables. The presearch decided PostgreSQL but the existing codebase uses SQLAlchemy 1.x which doesn't support this join syntax cleanly. Do I upgrade the ORM or use raw SQL?",
  "urgency": "BLOCKING | NON_BLOCKING",
  "context": "<relevant code snippet or decision>"
}
```

**Consultation response schema:**

```json
{
  "agent": "architect",
  "action": "CONSULTATION_RESPONSE",
  "to": "developer",
  "ticket_id": "PROJ-XXX",
  "answer": "<specific answer>",
  "rationale": "<why>",
  "affects_presearch_decisions": false,
  "presearch_update_needed": null
}
```

**Consultation rules:**
- Primary loop owner retains ownership — consultation is advisory
- Consultation is single-turn: one question, one answer, no debate
- If consultation reveals a presearch decision was wrong: flag to PM, not just to Developer
- Consultations are logged in the ticket's history

---

## Locked Decision Protocol

When a decision appears in `locked_decisions`, it is final for that agent unless PM overrides. Other agents can still raise concerns in their cross-review, but the locked agent's position stands unless PM makes a call.

PM's locked decisions override all agents. No agent can re-open a PM-locked decision without new evidence that materially changes the situation.

Locked decision format:
```
"[layer]: [choice] — [one-sentence rationale]"
Example: "database: PostgreSQL — relational constraints required for financial data integrity"
```

---

## Cross-Review Execution

Each persona file has a **Cross-Review Checklist** section. When you receive another agent's output:

1. Locate that agent in your checklist
2. Apply every checklist item to their output
3. If an item triggers → raise concern in `cross_review` field
4. If no items trigger → write `"verdict": "NO_CONCERNS"` for that agent

This is not optional. If you don't cross-review, the orchestrator will re-spawn you.

---

## Codebase Discovery

When operating on a target repo, every agent **reads the actual codebase** using Read, Grep, and Glob tools to discover patterns and conventions. Do NOT assume anything — discover it from the code.

**Each agent discovers what's relevant to their domain** by reading the codebase directly. If the brief suggests a pattern that conflicts with what the codebase actually does, flag it.

---

## Anti-Patterns (Violations — Orchestrator Will Re-Spawn You)

```
❌ Producing output without cross-reviewing agents whose output you received
❌ Saying "I agree" or "no concerns" without running your checklist
❌ Vague concerns: "the architecture seems risky" — cite agent, decision, and specific risk
❌ Repeating the same concern from a prior loop without new evidence
❌ Declaring READY_TO_DECIDE while holding a HIGH-severity open concern
❌ Asking a question in questions_for_team that you already asked in a prior loop and got answered
❌ Claiming BLOCKED without naming exactly what unblocks you
❌ Addressing the human user — agents talk to agents and PM
❌ In SDLC: writing code, testing, or deploying when that's another agent's job
❌ Output longer than 1200 tokens — be concise, reference don't repeat prior context
```

---

## Round-Specific Participation Matrix

| Agent | R0 Main | R0 React | R1 Main | R1 React | R2 Main | R2 React | R3 Main | R3 React | R4 Main |
|-------|---------|----------|---------|----------|---------|----------|---------|----------|---------|
| Researcher | PRIMARY | — | — | — | — | — | — | — | — |
| BA | — | REACTS | PRIMARY | REACTS | — | — | — | — | — |
| PM | — | REACTS | PRIMARY | REACTS | — | — | — | REACTS | PRIMARY |
| Architect | — | — | — | REACTS | PRIMARY | REACTS | — | REACTS | — |
| Designer | — | — | — | REACTS | PRIMARY | REACTS | — | REACTS | — |
| Developer | — | — | — | REACTS | PRIMARY | REACTS | — | REACTS | — |
| QA | — | — | — | — | — | REACTS | PRIMARY | — | — |
| DevOps | — | — | — | — | — | REACTS | PRIMARY | — | — |

PRIMARY = full output schema required
REACTS = reaction schema (trimmed, focused on the specific trigger)
— = not spawned unless conflict escalation requires it

---

## System Entry Points

| Command | File | What it does |
|---------|------|-------------|
| `/project` | `project-orchestrator.md` | Full project: presearch → phase plan → all phases end-to-end |
| `/team-presearch` | `team-presearch.md` | Presearch for one feature/brief → PRD → locked decisions |
| `/sdlc` | `sdlc/sdlc-orchestrator.md` | One sprint: planning → dev/review/QA/deploy per ticket |

**When to use which:**
- Building a whole product from description → `/project`
- Designing a new feature before writing code → `/team-presearch`
- Executing tickets from an existing backlog → `/sdlc`

`/project` calls `/team-presearch` internally (project presearch) and then calls `/sdlc` per phase. You do not need to call them separately when using `/project`.
