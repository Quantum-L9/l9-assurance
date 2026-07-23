from __future__ import annotations

from copy import deepcopy

from l9_assurance.evaluator import verify_decision
from l9_assurance.testing import sign_for_test


def _decision(engine, subject, valid_observations):
    admission = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    return engine.evaluate(subject, admission["accepted"], evaluation_time="2026-07-21T00:00:03Z")


def test_decision_tamper_rejected(engine, subject, valid_observations) -> None:
    value = _decision(engine, subject, valid_observations)
    value["verdict"] = "fail"
    report = verify_decision(value)
    assert not report["valid"]
    assert any("does not match control reduction" in reason for reason in report["reasons"])


def test_missing_cross_reference_rejected(engine, subject, valid_observations) -> None:
    value = _decision(engine, subject, valid_observations)
    value["controlResults"][0]["evidenceRefs"] = ["missing"]
    report = verify_decision(value)
    assert not report["valid"]
    assert any("missing evidence" in reason for reason in report["reasons"])


def test_test_signature_rejected(engine, subject, valid_observations) -> None:
    signed = sign_for_test(_decision(engine, subject, valid_observations), b"secret")
    report = verify_decision(signed)
    assert report["signatureStatus"] == "invalid"
    assert not report["valid"]
