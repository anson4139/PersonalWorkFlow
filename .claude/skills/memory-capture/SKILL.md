---
name: memory-capture
description: |
  Use this skill to persist new, verified knowledge into the agent's long-term memory.
  Trigger this skill when you have confirmed a fact, decision, or code pattern that should be remembered for future tasks.
  Do NOT use this for temporary scratchpad notes.
  Writes to: docs/knowledge/memory/facts.yaml
---

# Skill Instructions

## When to use
- After successfully fixing a bug (to remember the fix).
- After clarifying a requirement (to remember the spec).
- After making an architectural decision (to remember the rationale).
- After confirming a project-specific constraint that should survive across sessions.

## Steps
1. **Identify the Claim**: What specific fact or decision needs to be stored? (one sentence)
2. **Determine Category**: `architecture | decision | pattern | constraint | workflow | env`
3. **Determine Project Scope**: `_global` if it applies to the whole workspace, or `projects/<name>` if project-specific.
4. **Verify the Source**: File path + line range, or `conversation` if from discussion.
5. **Check for duplicates**: Read `docs/knowledge/memory/facts.yaml` first. If a fact exists, update `updated_at` and the claim instead of adding a duplicate.
6. **Check for superseded facts**: If the new fact contradicts an existing one, set `deprecated: true` on the old entry before adding the new one.
7. **Append Entry**: Add to `facts:` list in `docs/knowledge/memory/facts.yaml`.

## Template (Schema v2)
```yaml
- id: FACT-{YYYYMMDD}-{SEQ}         # SEQ = next number in file
  category: architecture            # architecture | decision | pattern | constraint | workflow | env
  project: _global                  # _global OR projects/<name>
  claim: "One-sentence verified finding or decision."
  source:
    type: file                      # file | conversation
    path: relative/path/to/file    # omit for conversation
    evidence: "L10-L20"             # line range or section anchor
  confidence: high                  # low | medium | high
  created: "{YYYY-MM-DD}"
  updated_at: "{YYYY-MM-DD}"
  expires: null                     # null = never, or YYYY-MM-DD
  deprecated: false
  tags: [tag1, tag2]
```

## Categories
| Category | Use for |
|---|---|
| `architecture` | How the system is structured, folder conventions, platform choices |
| `decision` | Explicit choices made ("We use JWT, NOT cookie auth") |
| `pattern` | Reusable code/design patterns confirmed to work in this project |
| `constraint` | Hard limits ("WebForms = .NET Framework 4.8 only") |
| `workflow` | How tasks are done (CI/CD steps, deployment process) |
| `env` | Environment, toolchain, versions confirmed in use |
