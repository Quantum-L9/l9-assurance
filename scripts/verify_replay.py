#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from l9_assurance.cli import AssuranceEngine, load_configuration  # noqa: E402
from l9_assurance.evaluator import render_decision_summary  # noqa: E402
from l9_assurance.evidence import canonical_json  # noqa: E402


def build() -> tuple[dict, str]:
    config = load_configuration()
    config["producerRegistry"] = json.loads(
        (ROOT / "fixtures" / "compatibility" / "producer-registry.trusted.json").read_text()
    )
    config["checkRegistry"] = json.loads(
        (ROOT / "fixtures" / "compatibility" / "check-registry.json").read_text()
    )
    subject = json.loads((ROOT / "fixtures" / "valid" / "subject.json").read_text())
    names = [
        "repository-metadata",
        "transport-packet",
        "sdk-validation",
        "lint",
        "tests",
        "mandatory-findings",
    ]
    observations = [
        json.loads((ROOT / "fixtures" / "valid" / f"{name}.observation.json").read_text())
        for name in names
    ]
    engine = AssuranceEngine(config)
    admission = engine.admit(subject, observations, received_at="2026-07-21T00:00:02.000Z")
    decision = engine.evaluate(
        subject,
        admission["accepted"],
        evaluation_time="2026-07-21T00:00:03.000Z",
        admission_report=admission,
    )
    return decision, render_decision_summary(decision)


def main() -> int:
    decision, summary = build()
    replay = ROOT / "fixtures" / "replay" / "pull-request-pass"
    expected_decision = replay / "expected-decision.canonical.json"
    expected_summary = replay / "expected-summary.md"
    actual_decision = canonical_json(decision) + "\n"
    failures = []
    if expected_decision.read_text(encoding="utf-8") != actual_decision:
        failures.append("decision replay mismatch")
    if expected_summary.read_text(encoding="utf-8") != summary:
        failures.append("summary replay mismatch")
    if failures:
        print("; ".join(failures), file=sys.stderr)
        return 1
    print("Replay verified: decision and summary byte-identical")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
