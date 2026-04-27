# MyApp (AI Agent)

## Rules

- Read `specs/ai/` before any implementation.
- Prompts MUST live in `specs/ai/prompts.yaml` — never hardcode in Python.
- Models MUST be locked in `specs/ai/model-config.yaml` — no floating versions.
- After every task, output Change Summary including eval result.
- Do NOT read files from other projects under `projects/`.

## Run Commands

```powershell
python src/main.py
pytest tests/unit/ -v
pytest tests/int/ -v
python evals/run_evals.py
```

## Project Layout

| Path | Purpose |
|---|---|
| `specs/ai/model-config.yaml` | Lock model versions |
| `specs/ai/prompts.yaml` | Versioned prompt templates |
| `specs/ai/eval-criteria.yaml` | Quality thresholds |
| `src/main.py` | Entry point |
| `src/agent.py` | Agent class |
| `src/config.py` | Config loader |
| `tests/unit/` | pytest unit tests |
| `tests/int/` | Integration tests |
| `evals/run_evals.py` | Eval runner |
| `evals/dataset.jsonl` | Eval test cases |
| `docs/` | ADRs |
