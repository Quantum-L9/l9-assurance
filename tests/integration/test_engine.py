from __future__ import annotations

import json
from pathlib import Path

from l9_assurance.evaluator import render_decision_summary, verify_decision

REPO = Path(__file__).resolve().parents[2]


def test_pass_vertical_slice(engine, subject, valid_observations) -> None:
    admission = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z", admission_report=admission)
    assert decision["verdict"] == "pass"
    assert len(decision["controlResults"]) == 7
    assert verify_decision(decision)["valid"]
    assert render_decision_summary(decision).startswith("# L9 Assurance Decision\n")


def test_failure_and_waiver(engine, subject, valid_observations) -> None:
    failed = json.loads((REPO / "fixtures/adversarial/lint-failed.observation.json").read_text())
    observations = [item for item in valid_observations if item["check"]["id"] != "l9.lint"] + [failed]
    admission = engine.admit(subject, observations, received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")
    assert decision["verdict"] == "fail"
    waiver = json.loads((REPO / "fixtures/valid/lint-waiver.json").read_text())
    conditional = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z", waivers=[waiver])
    assert conditional["verdict"] == "conditional"


def test_missing_evidence_is_indeterminate(engine, subject, valid_observations) -> None:
    admission = engine.admit(subject, valid_observations[:1], received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")
    assert decision["verdict"] == "indeterminate"
    assert decision["unknowns"]


def test_mandatory_finding_fails(engine, subject, valid_observations) -> None:
    finding = json.loads((REPO / "fixtures/adversarial/mandatory-finding.observation.json").read_text())
    observations = [item for item in valid_observations if item["check"]["id"] != "l9.mandatory-findings"] + [finding]
    admission = engine.admit(subject, observations, received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")
    assert decision["verdict"] == "fail"
