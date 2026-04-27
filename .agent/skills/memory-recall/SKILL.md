---
name: memory-recall
description: |
  Use this skill to retrieve relevant facts and knowledge before answering a query.
  Trigger this skill at the beginning of a complex task to ground your answer in established facts.
  Reads from: docs/knowledge/memory/facts.yaml and docs/knowledge/index.md
---

# Skill Instructions

## When to use
- At the start of a session to understand project context.
- Before answering technical questions about the codebase or specs.
- Before making architectural decisions (check for prior constraints or decisions).

## Steps
1. **Read Index**: Read `docs/knowledge/index.md` for high-level docs map.
2. **Read Memory**: Read `docs/knowledge/memory/facts.yaml`.
3. **Filter by project scope**: Only use facts where `project == _global` OR `project == projects/<current>`.
4. **Exclude deprecated**: Skip any entry with `deprecated: true`.
5. **Exclude expired**: Skip any entry where `expires` is set and the date has passed.
6. **Prioritize by confidence**: `high` > `medium` > `low`.
7. **Synthesize**: Combine docs and facts into a grounded answer.
8. **Cite**: Always cite `source.path` + `source.evidence` when referencing a memory fact.

## Filtering Cheat Sheet

```
Relevant = project IN (_global, projects/<current>)
         AND deprecated == false
         AND (expires == null OR expires > today)
```

## After Recalling

If you find a fact that seems outdated or incorrect, flag it:
- Mark `deprecated: true` on the old entry
- Capture the corrected fact with `memory-capture`
