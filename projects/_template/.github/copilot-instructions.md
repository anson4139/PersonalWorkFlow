# [Project Name] — Development Rules

> These rules are self-contained. They apply whether this project is opened standalone or as part of the PersonalWorkFlow workspace.

## Mandatory First Steps

Before any task in this project:
1. Read all relevant files under `specs/`
2. Check `docs/` for existing ADRs that may affect the task
3. Do NOT read files from other projects under `projects/`

## AI Change Verification Protocol

After completing any implementation task, output a Change Summary:
- **Spec reference**: which `specs/` file(s) the task implements
- **Scope**: what was implemented
- **Self-verification**: `[PASS/FAIL] tests/<layer>/<name> — N/N passed`
- **Gaps**: `[WARNING] specs/<file> L<n> — reason`

## Engineering Standards

### Environment & Execution
- Use the project's designated virtual environment (see README).
- Never run scripts in base or system Python unless explicitly documented.

### File Encodings & Style
- Encoding: STRICTLY UTF-8.
- Python scripts MUST include: `sys.stdout.reconfigure(encoding='utf-8')`
- No emojis in filenames, code comments, or terminal output.

### Security & Credentials
- NEVER hardcode API tokens, passwords, or keys in code.
- Use `.env` for local secrets (must be in `.gitignore`).
- Maintain `.env.example` with placeholder values.
- Use `python-dotenv` to load environment variables.

### Markdown Document Structure
- ALL `.md` documents with multiple chapters MUST wrap each `##` section in `<details>` collapsible blocks.
- Exceptions: document header, TOC, single-section utility files.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
