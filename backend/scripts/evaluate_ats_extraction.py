"""Calculate extraction F1 and five-run Jaccard metrics from a reviewed JSON dataset.

Input is a JSON array. Each item has:
  {"job_id": "job-01", "expected": ["python", ...],
   "runs": [["python", ...], ["python", ...], ...]}

Skill names must be manually canonicalized consistently before comparison.
This script does not call an AI provider or create evaluation labels.
"""

from __future__ import annotations

import argparse
import itertools
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any


def normalize_skill(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Skill names must be non-empty strings")
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"\s+", " ", normalized).strip()


def as_skill_set(values: Any, field: str) -> set[str]:
    if not isinstance(values, list):
        raise ValueError(f"{field} must be a list")
    return {normalize_skill(value) for value in values}


def f1(expected: set[str], predicted: set[str]) -> float:
    if not expected and not predicted:
        return 1.0
    if not expected or not predicted:
        return 0.0
    true_positive = len(expected & predicted)
    precision = true_positive / len(predicted)
    recall = true_positive / len(expected)
    return 2 * precision * recall / (precision + recall) if precision + recall else 0.0


def jaccard(left: set[str], right: set[str]) -> float:
    union = left | right
    return len(left & right) / len(union) if union else 1.0


def evaluate(rows: Any) -> dict[str, Any]:
    if not isinstance(rows, list) or not rows:
        raise ValueError("Input must be a non-empty JSON array")

    results = []
    seen_ids: set[str] = set()
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ValueError(f"row {index + 1} must be an object")
        job_id = row.get("job_id")
        if not isinstance(job_id, str) or not job_id.strip() or job_id in seen_ids:
            raise ValueError(f"row {index + 1} needs a unique, non-empty job_id")
        seen_ids.add(job_id)

        expected = as_skill_set(row.get("expected"), f"{job_id}.expected")
        raw_runs = row.get("runs")
        if not isinstance(raw_runs, list) or len(raw_runs) != 5:
            raise ValueError(f"{job_id}.runs must contain exactly five prediction lists")
        runs = [as_skill_set(values, f"{job_id}.runs[{run_index}]") for run_index, values in enumerate(raw_runs)]
        pair_scores = [jaccard(a, b) for a, b in itertools.combinations(runs, 2)]
        results.append({
            "job_id": job_id,
            "mean_f1": sum(f1(expected, prediction) for prediction in runs) / len(runs),
            "mean_pairwise_jaccard": sum(pair_scores) / len(pair_scores),
        })

    return {
        "job_count": len(results),
        "minimum_job_target": 10,
        "minimum_job_target_met": len(results) >= 10,
        "mean_f1": sum(item["mean_f1"] for item in results) / len(results),
        "mean_pairwise_jaccard": sum(item["mean_pairwise_jaccard"] for item in results) / len(results),
        "targets": {"f1": 0.80, "mean_pairwise_jaccard": 0.80},
        "targets_met": {
            "f1": len(results) >= 10 and sum(item["mean_f1"] for item in results) / len(results) >= 0.80,
            "mean_pairwise_jaccard": len(results) >= 10 and sum(item["mean_pairwise_jaccard"] for item in results) / len(results) >= 0.80,
        },
        "per_job": results,
        "note": "Metrics are meaningful only for manually reviewed labels and consistently canonicalized skill names.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", type=Path, help="Reviewed JSON dataset with 10 or more job records")
    args = parser.parse_args()
    try:
        rows = json.loads(args.dataset.read_text(encoding="utf-8"))
        result = evaluate(rows)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Evaluation input error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
