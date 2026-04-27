# MyApp (AI Agent) — Development Rules

> These rules are self-contained. They apply whether this project is opened standalone or as part of the PersonalWorkFlow workspace.

## Mandatory First Steps

Before any task in this project:
1. Read `specs/ai/model-config.yaml` — confirm which model is in use
2. Read `specs/ai/prompts.yaml` — confirm current prompt versions
3. Read `specs/ai/eval-criteria.yaml` — confirm quality thresholds
4. Check `docs/` for existing ADRs
5. Do NOT read files from other projects under `projects/`

## AI Change Verification Protocol

After completing any implementation task, output a Change Summary:
- **Spec reference**: which `specs/` file(s) the task implements
- **Scope**: what was implemented
- **Self-verification**: `[PASS/FAIL] tests/<layer>/<name> — N/N passed`
- **Eval result**: `[PASS/FAIL] evals/run_evals.py — N/N cases above threshold`
- **Gaps**: `[WARNING] specs/<file> L<n> — reason`

## Prompt Engineering Rules

- All prompt templates MUST be in `specs/ai/prompts.yaml` — never hardcode prompts in Python.
- When changing a prompt template, bump its `version` field.
- Add eval cases to `evals/dataset.jsonl` to cover the changed behavior.

## Model Version Rules

- All model names/versions MUST be locked in `specs/ai/model-config.yaml`.
- Do NOT use `latest` or floating model references in production code.

## Engineering Standards

### Environment & Execution
- Use the project's conda environment (see README).
- Never run scripts in base or system Python.
- All scripts MUST include: `sys.stdout.reconfigure(encoding='utf-8')`

### Security & Credentials
- NEVER hardcode API keys or tokens.
- Use `.env` + `python-dotenv` for all credentials.
- Maintain `.env.example` with placeholder values.

### File Encodings & Style
- Encoding: STRICTLY UTF-8.
- No emojis in filenames, code comments, or terminal output.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
