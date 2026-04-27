"""
Eval runner — compares agent output against eval-criteria.yaml thresholds.
Usage: python evals/run_evals.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import json
import time
from pathlib import Path

import yaml

CRITERIA_FILE = Path(__file__).parent.parent / "specs" / "ai" / "eval-criteria.yaml"
DATASET_FILE = Path(__file__).parent / "dataset.jsonl"
RESULTS_FILE = Path(__file__).parent / "results.jsonl"


def load_criteria() -> list[dict]:
    with open(CRITERIA_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f)["capabilities"]


def load_dataset() -> list[dict]:
    if not DATASET_FILE.exists():
        return []
    with open(DATASET_FILE, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def run_evals() -> None:
    criteria = load_criteria()
    dataset = load_dataset()

    if not dataset:
        print("[WARNING] evals/dataset.jsonl is empty — add test cases first.")
        return

    results = []
    for case in dataset:
        # TODO: call agent and score output against criteria
        result = {"case_id": case.get("id"), "status": "pending"}
        results.append(result)

    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"[INFO] Eval complete — {len(results)} cases written to evals/results.jsonl")


if __name__ == "__main__":
    run_evals()
