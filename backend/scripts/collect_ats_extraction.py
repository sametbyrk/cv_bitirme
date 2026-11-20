"""Collect five live ATS skill-extraction runs for manually labeled job ads.

Input JSON format:
  [{"job_id": "job-01", "job_description": "...", "expected": ["Python", ...]}]

Labels must be manually reviewed and canonicalized. This script makes Gemini
requests and writes predictions only; it does not create or infer ground truth.
Run it from the backend directory so the project's environment settings load.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Any

from fastapi import HTTPException

# Support both `python backend/scripts/...` from the repo root and
# `python scripts/...` from the backend directory.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.ai_service import AIService
from app.services.ats_service import ATSService, clean_job_description
from evaluate_ats_extraction import evaluate

RUNS_PER_JOB = 5
MINIMUM_JOBS = 10
MAX_JOB_DESCRIPTION_CHARS = 20_000
NO_SKILL_CODES = {"NO_JOB_SKILLS", "NO_REQUIRED_SKILLS", "REQUIRED_UNVERIFIED"}
TRANSIENT_CODES = {"ATS_PROVIDER_UNAVAILABLE", "ATS_EXTRACTION_TIMEOUT"}
MAX_TRANSIENT_RETRIES = 3
RETRY_DELAYS_SECONDS = (5, 15, 30)


def _write_json_atomically(path: Path, value: Any) -> None:
    temporary_path = path.with_name(f"{path.name}.tmp")
    temporary_path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(path)


def _load_checkpoint(path: Path, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        checkpoint = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Could not read partial checkpoint {path}: {exc}") from exc
    if not isinstance(checkpoint, list) or len(checkpoint) > len(rows):
        raise ValueError(f"Partial checkpoint has an invalid structure: {path}")
    for index, item in enumerate(checkpoint):
        source = rows[index]
        if (
            not isinstance(item, dict)
            or item.get("job_id") != source["job_id"]
            or item.get("expected") != source["expected"]
            or not isinstance(item.get("runs"), list)
            or len(item["runs"]) > RUNS_PER_JOB
            or any(not isinstance(run, list) or any(not isinstance(skill, str) for skill in run) for run in item["runs"])
        ):
            raise ValueError(f"Partial checkpoint does not match the labeled input at row {index + 1}.")
    return checkpoint


def load_labeled_jobs(path: Path) -> list[dict[str, Any]]:
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Could not read labeled input JSON: {exc}") from exc
    if not isinstance(rows, list) or len(rows) < MINIMUM_JOBS:
        raise ValueError(f"Input must contain at least {MINIMUM_JOBS} manually labeled job descriptions.")

    seen_ids: set[str] = set()
    validated: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        label = f"row {index + 1}"
        if not isinstance(row, dict):
            raise ValueError(f"{label} must be a JSON object.")
        job_id = row.get("job_id")
        job_description = row.get("job_description")
        expected = row.get("expected")
        if not isinstance(job_id, str) or not job_id.strip() or job_id in seen_ids:
            raise ValueError(f"{label} needs a unique, non-empty job_id.")
        if not isinstance(job_description, str) or len(job_description) > MAX_JOB_DESCRIPTION_CHARS:
            raise ValueError(f"{job_id}: job_description must be text up to {MAX_JOB_DESCRIPTION_CHARS} characters.")
        if len(clean_job_description(job_description)) < 30:
            raise ValueError(f"{job_id}: normalized job_description must contain at least 30 characters.")
        if not isinstance(expected, list) or not expected:
            raise ValueError(f"{job_id}: expected must be a non-empty manually reviewed skill list.")
        if any(not isinstance(skill, str) or not skill.strip() for skill in expected):
            raise ValueError(f"{job_id}: expected must contain only non-empty skill names.")
        seen_ids.add(job_id)
        validated.append({"job_id": job_id, "job_description": job_description, "expected": expected})
    return validated


async def collect_predictions(
    rows: list[dict[str, Any]],
    checkpoint_path: Path,
    initial_predictions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    generator = AIService()
    output = initial_predictions
    for row_index, row in enumerate(rows):
        if row_index < len(output) and len(output[row_index]["runs"]) == RUNS_PER_JOB:
            continue
        if row_index == len(output):
            output.append({"job_id": row["job_id"], "expected": row["expected"], "runs": []})
        job_text = clean_job_description(row["job_description"])
        runs = output[row_index]["runs"]
        for run_index in range(len(runs), RUNS_PER_JOB):
            # A new service instance avoids its per-process extraction cache, so
            # repeated runs really call the model instead of copying one result.
            extractor = ATSService(generator=generator)
            for attempt in range(MAX_TRANSIENT_RETRIES + 1):
                try:
                    skills, _excluded_count = await extractor._extract_skills(job_text)
                    runs.append(list(dict.fromkeys(skill.name for skill in skills)))
                    _write_json_atomically(checkpoint_path, output)
                    break
                except HTTPException as exc:
                    detail = exc.detail if isinstance(exc.detail, dict) else {}
                    code = detail.get("code")
                    if code in NO_SKILL_CODES:
                        runs.append([])
                        _write_json_atomically(checkpoint_path, output)
                        break
                    if code in TRANSIENT_CODES and attempt < MAX_TRANSIENT_RETRIES:
                        delay = RETRY_DELAYS_SECONDS[attempt]
                        print(
                            f"{row['job_id']} run {run_index + 1}: geçici AI servis hatası; "
                            f"{delay} saniye sonra tekrar denenecek ({attempt + 1}/{MAX_TRANSIENT_RETRIES}).",
                            file=sys.stderr,
                        )
                        await asyncio.sleep(delay)
                        continue
                    raise RuntimeError(
                        f"{row['job_id']} run {run_index + 1} HTTP {exc.status_code} ile başarısız oldu. "
                        f"Tamamlanan çalışmalar {checkpoint_path} dosyasına kaydedildi."
                    ) from exc
                except Exception as exc:
                    raise RuntimeError(
                        f"{row['job_id']} run {run_index + 1} başarısız oldu. "
                        f"Tamamlanan çalışmalar {checkpoint_path} dosyasına kaydedildi."
                    ) from exc
    return output


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("labeled_jobs", type=Path, help="JSON file with >=10 manually labeled job descriptions")
    parser.add_argument("--output", type=Path, default=Path("ats_extraction_runs.json"))
    parser.add_argument("--force", action="store_true", help="Allow replacing the output file")
    args = parser.parse_args()

    try:
        input_path = args.labeled_jobs.resolve()
        output_path = args.output.resolve()
        checkpoint_path = output_path.with_name(f"{output_path.stem}.partial{output_path.suffix or '.json'}")
        if input_path == output_path:
            raise ValueError("Output path must differ from the labeled input path.")
        if output_path.exists() and not args.force:
            raise ValueError(f"Output already exists: {output_path}. Choose another path or pass --force.")
        rows = load_labeled_jobs(input_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        checkpoint = _load_checkpoint(checkpoint_path, rows)
        if checkpoint:
            completed_runs = sum(len(item["runs"]) for item in checkpoint)
            print(f"Kaldığı yerden devam ediliyor: {completed_runs}/{len(rows) * RUNS_PER_JOB} tahmin hazır.")
        predictions = await collect_predictions(rows, checkpoint_path, checkpoint)
        report = evaluate(predictions)
        _write_json_atomically(output_path, predictions)
        checkpoint_path.unlink(missing_ok=True)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        print(f"Prediction runs saved to: {output_path}")
        return 0
    except (ValueError, RuntimeError) as exc:
        print(f"ATS extraction evaluation failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
