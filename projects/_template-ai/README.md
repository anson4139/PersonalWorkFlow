# MyApp (AI Agent)

## Overview

[One paragraph describing what this AI agent does and its target use case.]

## Prerequisites

- Python 3.11+
- conda or venv

## Getting Started

```powershell
conda create -n myapp python=3.11
conda activate myapp
pip install -r src/requirements.txt
pip install -r src/requirements-dev.txt

# Run the agent
python src/main.py

# Run unit tests
pytest tests/unit/ -v

# Run evals
python evals/run_evals.py
```

## Project Structure

```
specs/
  ai/
    model-config.yaml   Lock model versions (provider, model name, temperature)
    prompts.yaml        Versioned prompt templates
    eval-criteria.yaml  Thresholds for correctness, hallucination rate, latency
  api/                  REST API contracts (if the agent exposes an HTTP API)
  behavior/             Feature behavior and acceptance criteria
  schema/               Data models and DB schema
src/
  main.py               Entry point
  agent.py              Agent class — orchestrates tools and LLM calls
  config.py             Load model-config.yaml + .env
  requirements.txt      Runtime dependencies
  requirements-dev.txt  Test/eval dependencies
tests/
  unit/                 pytest — unit tests for tools and utilities
  int/                  pytest — integration tests (may call real LLM)
evals/
  run_evals.py          Eval runner — scores agent against eval-criteria.yaml
  dataset.jsonl         JSONL test cases: {id, input, expected}
  results.jsonl         Generated eval results (gitignored)
docs/                   ADRs and architecture decisions
```

## Eval Workflow

1. Add cases to `evals/dataset.jsonl`
2. Run `python evals/run_evals.py`
3. Check `evals/results.jsonl` — all metrics must be above thresholds in `specs/ai/eval-criteria.yaml`
4. Before merging to main: `[PASS] eval — N/N cases above threshold`

## Rename Checklist

1. Replace `myapp` with actual project name in all files
2. Update `model-config.yaml` with the actual LLM provider/model to use
3. Update `prompts.yaml` with actual system and user prompt templates
4. Set API keys in `.env` (never commit)
