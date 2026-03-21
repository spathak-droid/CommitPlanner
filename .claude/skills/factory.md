---
name: factory
description: Invoke the Software Factory from any project. Detects the target repo from the current working directory, loads Factory personas, and runs the full presearch → SDLC pipeline. Use /factory from any repo that has Factory in additionalDirectories.
---

# Factory — Remote Entry Point

When invoked via `/factory` from any project directory:

## Setup

1. **Factory home**: `/Users/san/Desktop/Gauntlet/Factory`
   - Personas: `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/personas/`
   - Artifacts: `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/artifacts/`

2. **Target repo**: The current working directory (where the user invoked `/factory`)

3. **Codebase discovery**: Agents read the target repo directly using Read, Grep, Glob to discover patterns, conventions, and stack. No hardcoded conventions files.

## Commands

Present these options:

```
Software Factory — Ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target: <current working directory>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:
  1. /factory presearch  — Run team presearch for a feature
  2. /factory sdlc       — Run SDLC from an existing PRD
  3. /factory project     — Full lifecycle (presearch → all sprints)

What would you like to do?
```

## Execution

- **presearch**: Load `team-presearch.md` orchestrator. Pass the target repo path to all agents. Run the full 4-round presearch with reactions.
- **sdlc**: Load `sdlc/sdlc-orchestrator.md`. Expects a PRD.md path. Run sprint planning through deploy.
- **project**: Load `project-orchestrator.md`. Full lifecycle end-to-end.

## Path Resolution

All skill files use absolute paths when loading:
- Persona files: Read from `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/personas/<agent>.md`
- Protocol: Read from `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/agent-protocol.md`
- Loop engine: Read from `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/loop-engine.md`
- SDLC loops: Read from `/Users/san/Desktop/Gauntlet/Factory/.claude/skills/sdlc/`

Target repo code is read from the current working directory.
