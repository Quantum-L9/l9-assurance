#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from time import perf_counter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from l9_assurance.cli import AssuranceEngine, load_configuration  # noqa: E402
from l9_assurance.testing import build_observation, build_subject  # noqa: E402


def build_report() -> dict[str, object]:
    config = load_configuration()
    config["producerRegistry"] = json.loads(
        (ROOT / "fixtures" / "compatibility" / "producer-registry.trusted.json").read_text(
            encoding="utf-8"
        )
    )
    config["checkRegistry"] = json.loads(
        (ROOT / "fixtures" / "compatibility" / "check-registry.json").read_text(encoding="utf-8")
    )
    engine = AssuranceEngine(config)
    subject = build_subject()
    observations = [
        build_observation(observation_id=f"obs_{index}", subject=subject) for index in range(1_000)
    ]

    started = perf_counter()
    admission = engine.admit(
        subject,
        observations,
        received_at="2026-07-21T00:00:02Z",
    )
    admission_seconds = perf_counter() - started

    started = perf_counter()
    for index in range(500):
        engine.evaluate(
            subject,
            admission["accepted"],
            evaluation_time="2026-07-21T00:00:03Z",
            decision_id=f"dec_bench_{index}",
        )
    evaluation_seconds = perf_counter() - started

    return {
        "schema": "l9.assurance-benchmark",
        "schemaVersion": "1.0.0",
        "admission": {
            "observations": 1_000,
            "seconds": round(admission_seconds, 6),
            "objectiveSeconds": 5.0,
            "passed": admission_seconds < 5.0,
        },
        "evaluation": {
            "decisions": 500,
            "seconds": round(evaluation_seconds, 6),
            "objectiveSeconds": 2.0,
            "passed": evaluation_seconds < 2.0,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run deterministic Assurance performance objectives."
    )
    parser.add_argument("--output", type=Path, help="Optional report destination.")
    args = parser.parse_args()

    report = build_report()
    text = json.dumps(report, indent=2) + "\n"
    if args.output is not None:
        destination = args.output if args.output.is_absolute() else ROOT / args.output
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding="utf-8")
    print(text, end="")
    return 0 if report["admission"]["passed"] and report["evaluation"]["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
