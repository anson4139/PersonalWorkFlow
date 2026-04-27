# [Project Name]

## Overview

[One paragraph describing what this project does, its goals, and key stakeholders.]

## Environment Setup

```bash
# Example: create and activate environment
conda create -n <env-name> python=3.11
conda activate <env-name>
pip install -r src/requirements.txt
```

## Project Structure

```
specs/          Specifications (API contracts, behavior, schemas)
src/            Source code and scripts
tests/          Tests (unit/, int/, e2e/)
docs/           ADRs and design decisions
```

## AI Development Rules

This project uses the [PersonalWorkFlow](../../README.md) framework.

- Read `specs/` before implementing anything.
- After every implementation task, output a Change Summary.
- Do not read files from other projects under `projects/`.
