from __future__ import annotations

import json
from pathlib import Path

from l9_assurance.conformance import run_consumer_conformance, run_producer_conformance
from l9_assurance.evaluator import render_decision_summary
from l9_assurance.evidence import canonical_json

REPO = Path(__file__).resolve().parents[2]


def test_producer_conformance_passes(trusted_config, subject, valid_observations) -> None:
    report = run_producer_conformance(valid_observations, producer_id="l9-ci-sdk", subject=subject, producer_registry=trusted_config["producerRegistry"], check_registry=trusted_config["checkRegistry"], received_at="2026-07-21T00:00:02Z")
    assert report["passed"]


def test_consumer_conformance_passes(engine, subject, valid_observations) -> None:
    admission = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")
    report = run_consumer_conformance(consumer_id="l9-ci-core", canonical_decision=decision, transported_decision_text=canonical_json(decision) + "\n", published_verdict=decision["verdict"], published_summary=render_decision_summary(decision))
    assert report["passed"]


def test_consumer_byte_mutation_fails(engine, subject, valid_observations) -> None:
    admission = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    decision = engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")
    report = run_consumer_conformance(consumer_id="l9-ci-core", canonical_decision=decision, transported_decision_text=json.dumps(decision, indent=2), published_verdict=decision["verdict"], published_summary=render_decision_summary(decision))
    assert not report["passed"]
