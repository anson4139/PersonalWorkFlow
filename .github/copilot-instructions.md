---
name: project-rules
description: Enforce portable workflow framework rules (Folder Structure, Naming Conventions & Engineering Standards)
---

# Project Rules & Standards

Use this skill whenever you need to organize files, create new documents, or verify project structure.

## 1. Lifecycle-Based Folder Structure (SDLC)

Each project follows this structure. Paths are relative to the project root.

| Lifecycle Stage | Directory | Description |
|---|---|---|
| **DEFINE / DESIGN** | `specs/` | Specifications — API contracts, behavior definitions, data schemas |
| **IMPLEMENTATION** | `src/` | Source code and scripts |
| **VERIFICATION** | `tests/` | Unit, integration, and e2e tests |
| **RELEASE** | `docs/` | ADRs, architecture diagrams, design decisions |

> Actual paths may be overridden in the project's own `.github/copilot-instructions.md`.

## 2. Project Isolation Rules

### Rule A: Cross-Project Read Prohibition
When working inside `projects/<name>/`, do NOT read files from any other project directory (`projects/<other>/`) unless the user explicitly requests it.

### Rule B: Mandatory Spec Loading
When the working directory is inside any `projects/<name>/`, you MUST read the following before taking any action (if they exist):
1. `projects/<name>/.github/copilot-instructions.md`
2. Relevant spec files under `projects/<name>/specs/`

## 3. AI Change Verification Protocol

After completing any implementation task, output a Change Summary:

- **Spec reference**: which `specs/` file(s) the task implements
- **Scope**: what was implemented
- **Self-verification**: test results — `[PASS/FAIL] tests/<layer>/<name> — N/N passed`
- **Gaps**: spec requirements not yet implemented — `[WARNING] specs/<file> L<n> — reason`

### Skill Synchronization (Cross-LLM)
*   **Trigger**: Whenever a skill in `.agent/skills` is created or updated.
*   **Action**: Run `python .agent/skills/project-rules/scripts/sync_to_doc.py`
*   **Purpose**: Ensures project AI context docs always reflect the latest agent capabilities.

## 4. Engineering Standards

### A. Environment & Execution
*   **Virtual Environment**: Use the project's designated environment (check project README).
*   **Activation**: Always activate the correct environment before running scripts.
*   **Never run scripts in base or system Python unless explicitly documented.**

### B. File Encodings & Style
*   **Encoding**: STRICTLY `UTF-8`.
    *   Python Scripts MUST include: `sys.stdout.reconfigure(encoding='utf-8')` to prevent mojibake in terminals.
*   **No Emojis**: Do NOT use emojis in filenames, code comments, or terminal outputs. Keep it professional and clean.
*   **Bat Files**: Ensure strictly ANSI/UTF-8 compatible without BOM if possible, or handle code page `chcp 65001`.

### D. Markdown Document Structure
*   **Collapsible Chapters**: ALL `.md` documents with multiple chapters/sections MUST wrap each top-level chapter (`##` level) in HTML `<details>` collapsible blocks for readability.
*   **Required Format**:
    ```markdown
    <details>
    <summary>## Chapter Title</summary>

    (Chapter content in normal Markdown)

    </details>
    ```
*   **Exceptions**: The document header (title, version, status), TOC, and single-section utility files do NOT need `<details>` wrapping.
*   **Reason**: Long design documents are hard to navigate without collapsible sections in VS Code Preview and GitHub.

### C. Security & Credentials
*   **Secrets**: NEVER hardcode API tokens, passwords, or keys in code.
*   **Configuration**: Use `.env` file for local secrets (must be in `.gitignore`).
*   **Templates**: Maintain `.env.example` with placeholder values for Git tracking.
*   **Loading**: Use `python-dotenv` to load environment variables in Python scripts.

### E. Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/) format:
```
<type>(<scope>): <short description>
```
Allowed types: `feat` | `fix` | `docs` | `chore` | `refactor` | `test` | `ci` | `perf` | `style`

Examples:
*   `feat(auth): add JWT refresh token`
*   `fix(db): handle null user in query`
*   `chore(deps): update dotnet SDK to 9.0.200`
*   `docs(adr): record decision to use Azure App Service`

### F. Documentation Sync
After completing any implementation task, you MUST selectively update documentation — only when the change warrants it:

1.  **CHANGELOG** — Append to `CHANGELOG.md` under `[Unreleased]` when:
    *   A new feature is added (`### Added`)
    *   An existing behaviour changes (`### Changed`)
    *   A bug is fixed (`### Fixed`)
    *   Something is removed (`### Removed`)
    *   Do NOT add entries for refactors, typo fixes, or test-only changes.

2.  **ADR** — Create `docs/decisions/adr-NNN-<kebab-title>.md` (from `docs/decisions/adr-template.md`) when:
    *   A non-trivial architecture or technology decision is made (e.g. "chose JWT over session", "switched ORM").
    *   Do NOT create ADRs for routine implementation choices.

3.  **Memory** — Invoke `memory-capture` skill when:
    *   A confirmed fact, constraint, or pattern should persist across future sessions.
    *   Only for verified knowledge — not assumptions.

> If no documentation update is warranted, state explicitly in the Change Summary: `[DOCS] No documentation update required — reason`.

