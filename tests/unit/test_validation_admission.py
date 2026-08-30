from __future__ import annotations

import json
from pathlib import Path

import pytest

from l9_assurance.evidence import InMemoryReplayStore, admit_observations, validate_observation

REPO = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize("path", sorted((REPO / "fixtures" / "valid").glob("*.observation.json")))
def test_valid_observations(path: Path) -> None:
    assert validate_observation(json.loads(path.read_text())).valid


@pytest.mark.parametrize("path", sorted((REPO / "fixtures" / "invalid").glob("*.observation.json")))
def test_invalid_observations(path: Path) -> None:
    assert not validate_observation(json.loads(path.read_text())).valid


def test_pending_producer_is_quarantined(
    pending_config: dict, subject: dict, valid_observations: list[dict]
) -> None:
    report = admit_observations(
        valid_observations[:1],
        {
            "subject": subject,
            "producerRegistry": pending_config["producerRegistry"],
            "checkRegistry": pending_config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
        },
    )
    assert report["quarantinedCount"] == 1
    assert report["results"][0]["reasons"][0]["code"] == "EVIDENCE_POLICY_INADMISSIBLE"


def test_live_registry_admits_the_trusted_sdk_producer(
    subject: dict, valid_observations: list[dict]
) -> None:
    """The LIVE registry -- not a fixture -- must admit the SDK producer.

    DECISION D-009 activated ``l9-ci-sdk`` trust. Reading the live
    ``registry/producers.yaml`` here is deliberate: the v0.1 seam is only real
    if the checked-in registry admits, and a fixture cannot prove that.
    """
    from l9_assurance.cli import load_configuration

    config = load_configuration()
    report = admit_observations(
        valid_observations[:1],
        {
            "subject": subject,
            "producerRegistry": config["producerRegistry"],
            "checkRegistry": config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
        },
    )
    assert report["quarantinedCount"] == 0
    assert report["rejectedCount"] == 0


def test_revision_substitution_is_rejected(trusted_config: dict, subject: dict) -> None:
    value = json.loads(
        (REPO / "fixtures/adversarial/revision-substitution.observation.json").read_text()
    )
    report = admit_observations(
        [value],
        {
            "subject": subject,
            "producerRegistry": trusted_config["producerRegistry"],
            "checkRegistry": trusted_config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
        },
    )
    assert report["rejectedCount"] == 1
    assert report["results"][0]["reasons"][0]["code"] == "EVIDENCE_REVISION_MISMATCH"


def test_duplicate_observations_are_detected(trusted_config: dict, subject: dict) -> None:
    first = json.loads((REPO / "fixtures/adversarial/duplicate-a.observation.json").read_text())
    second = json.loads((REPO / "fixtures/adversarial/duplicate-b.observation.json").read_text())
    report = admit_observations(
        [first, second],
        {
            "subject": subject,
            "producerRegistry": trusted_config["producerRegistry"],
            "checkRegistry": trusted_config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
            "replayStore": InMemoryReplayStore(),
        },
    )
    assert len(report["accepted"]) == 1
    assert report["duplicateCount"] == 1


def test_unknown_check_is_rejected(trusted_config: dict, subject: dict) -> None:
    value = json.loads(
        (REPO / "fixtures/adversarial/unauthorized-check.observation.json").read_text()
    )
    report = admit_observations(
        [value],
        {
            "subject": subject,
            "producerRegistry": trusted_config["producerRegistry"],
            "checkRegistry": trusted_config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
        },
    )
    assert report["rejectedCount"] == 1
    assert any(
        reason["code"] == "EVIDENCE_CHECK_UNAUTHORIZED"
        for reason in report["results"][0]["reasons"]
    )
