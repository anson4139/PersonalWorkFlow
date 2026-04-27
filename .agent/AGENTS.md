---
name: agents
description: Agent roster for the PersonalWorkFlow framework. Lists all available role-based agents, their trigger conditions, and skill file locations.
---

# Agent Roster

9 core agents covering the full software delivery lifecycle.
Each agent has a `SKILL.md` in `.agent/skills/<name>/`.

---

## Quick Reference

| Agent | Role | Trigger |
|---|---|---|
| `fullstack-dev` | Full-Stack Developer | Building APIs, UI components, or end-to-end features |
| `ai-engineer` | AI / ML Engineer | LLM integration, RAG, MLOps, inference APIs |
| `cloud-devops` | Cloud & DevOps | CI/CD, IaC, K8s, SLOs, observability |
| `dba` | Database Expert | Schema design, query optimization, migrations |
| `sa` | System Architect | Architecture decisions, ADRs, workflow specs |
| `pm` | Product Manager | PRDs, roadmap, prioritization, stakeholder alignment |
| `security` | Security Engineer | Threat modeling, code security review, auth design |
| `code-reviewer` | Code Reviewer | PR review, quality audit, review standards |
| `decision-advisor` | Decision Advisor | Strategic trade-offs, blind spot detection, stress-testing plans |

---

## Decision Advisor Activation Phrases

| Phrase | Perspective |
|---|---|
| "Munger view" / "逆向思考" / "芒格" | Charlie Munger (inversion, cognitive bias) |
| "PG view" / "Paul Graham" / "創業視角" | Paul Graham (startup thinking, first principles) |
| "Jobs view" / "乔布斯" / "產品直覺" | Steve Jobs (product vision, user obsession) |
| *(no trigger)* | All three synthesized |

---

## Skill File Locations

```
.agent/skills/
├── fullstack-dev/SKILL.md
├── ai-engineer/SKILL.md
├── cloud-devops/SKILL.md
├── dba/SKILL.md
├── sa/SKILL.md
├── pm/SKILL.md
├── security/SKILL.md
├── code-reviewer/SKILL.md
└── decision-advisor/SKILL.md
```

---

## Usage Notes

- Agents can be combined. Example: `sa` designs the system, `fullstack-dev` implements, `security` reviews, `code-reviewer` audits the PR.
- `decision-advisor` is always available as a second opinion on any major decision.
- Each `SKILL.md` specifies the agent's identity, core rules, responsibilities, and deliverable templates.
- After using any agent in production, note what worked or didn't in `docs/knowledge/memory/facts.yaml` via `memory-capture`.
