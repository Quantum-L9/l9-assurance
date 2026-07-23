from __future__ import annotations

from pathlib import Path

import pytest

from l9_assurance.policy import (
    PolicyResolutionError,
    evaluate_waiver,
    parse_assurance_policy,
    parse_waiver,
    resolve_policy,
)

REPO = Path(__file__).resolve().parents[2]


def test_policy_parses() -> None:
    value = parse_assurance_policy((REPO / "profiles/pull-request/policy.yaml").read_text())
    assert value["id"] == "l9.organization-default"


def test_conflicting_overlays_rejected() -> None:
    base = parse_assurance_policy((REPO / "profiles/pull-request/policy.yaml").read_text())
    overlays = [
        {
            "id": "a",
            "precedence": 1,
            "policy": {"unknownHandling": {"mandatory": "fail", "advisory": "indeterminate"}},
        },
        {
            "id": "b",
            "precedence": 1,
            "policy": {"unknownHandling": {"mandatory": "ignore", "advisory": "indeterminate"}},
        },
    ]
    with pytest.raises(PolicyResolutionError):
        resolve_policy(base, overlays)


def test_active_and_expired_waiver(subject: dict, trusted_config: dict) -> None:
    waiver = parse_waiver((REPO / "fixtures/valid/lint-waiver.json").read_text())
    control = next(item for item in trusted_config["controls"] if item["id"] == "L9.CI.LINT")
    policy = trusted_config["policy"]
    assert evaluate_waiver(waiver, control, subject, policy, "2026-07-21T00:00:03Z")["valid"]
    assert not evaluate_waiver(waiver, control, subject, policy, "2026-08-21T00:00:03Z")["valid"]
