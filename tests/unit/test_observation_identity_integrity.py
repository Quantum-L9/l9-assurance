"""Admission must bind a content-addressed observationId to its own content.

Assurance already computes exactly the value that ``l9-ci`` puts in
``observationId``: ``observation_fingerprint`` is the sha256 of the canonical
observation with ``observationId`` removed, which is the SDK's own construction.
It simply never compared the two, so an observation mutated in transit while
retaining the original ID was admitted with every validation passing --
``integrity`` included.

``verify_envelope_integrity`` could not catch it. It re-checks the payloadDigest
assurance itself computed over the payload it just received, which is
self-consistent by construction and cannot fail for freshly admitted evidence.

The replay store *does* catch the same mismatch, but only once the genuine
original has been admitted in the same execution context. ``InMemoryReplayStore``
documents itself as state "for one Assurance execution context" and is not
persisted, so in the ordinary one-admit-per-CI-run topology a tampered
observation arriving alone has no history to contradict it. The tests below
therefore cover the no-history case explicitly.
"""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest

from l9_assurance.evidence import InMemoryReplayStore, admit_observations
from l9_assurance.evidence.admission import (
    observation_fingerprint,
    verify_observation_identity,
)

REPO = Path(__file__).resolve().parents[2]


def _content_addressed(observation: dict[str, Any]) -> dict[str, Any]:
    """Stamp the observation with the ID its own content actually supports."""
    value = deepcopy(observation)
    value["observationId"] = f"sha256:{observation_fingerprint(value)}"
    return value


def _admit(value: dict[str, Any], trusted_config: dict, subject: dict) -> dict[str, Any]:
    return admit_observations(
        [value],
        {
            "subject": subject,
            "producerRegistry": trusted_config["producerRegistry"],
            "checkRegistry": trusted_config["checkRegistry"],
            "receivedAt": "2026-07-21T00:00:02Z",
            "channel": "local",
            "replayStore": InMemoryReplayStore(),
        },
    )


@pytest.fixture
def mandatory_findings() -> dict[str, Any]:
    """A mandatory-findings observation that actually carries a finding.

    ``fixtures/valid/mandatory-findings.observation.json`` reports zero findings,
    so "delete the findings" is a no-op against it and would fingerprint
    identically -- a tamper test built on it proves nothing. The adversarial
    fixture carries one ``critical`` finding, which is what a downgrade attack
    would target.
    """
    return json.loads(
        (REPO / "fixtures/adversarial/mandatory-finding.observation.json").read_text()
    )


def _downgraded(observation: dict[str, Any]) -> dict[str, Any]:
    """Erase the finding and zero the summary -- a real content change."""
    tampered = deepcopy(observation)
    tampered["findings"] = []
    tampered["summary"] = {
        "errorCount": 0,
        "findingCount": 0,
        "informationalCount": 0,
        "warningCount": 0,
    }
    return tampered


def test_content_addressed_id_matching_its_content_is_admitted(
    trusted_config: dict, subject: dict, mandatory_findings: dict[str, Any]
) -> None:
    """The control. Without it, the rejection tests below prove nothing."""
    report = _admit(_content_addressed(mandatory_findings), trusted_config, subject)

    assert report["rejectedCount"] == 0
    assert len(report["accepted"]) == 1
    assert report["results"][0]["validations"]["integrity"]["status"] == "pass"


def test_tampered_payload_retaining_the_original_id_is_rejected(
    trusted_config: dict, subject: dict, mandatory_findings: dict[str, Any]
) -> None:
    """The regression. This is the exact shape that used to be admitted.

    No replay history exists in this store, so the replay guard cannot fire --
    the rejection has to come from the identity check itself.
    """
    original = _content_addressed(mandatory_findings)
    tampered = _downgraded(original)
    # The forged part: keep the identity the untampered observation earned.
    tampered["observationId"] = original["observationId"]

    # Guard the guard: if the mutation did not change the content there is
    # nothing for the identity check to catch and the assertions below would
    # pass vacuously.
    assert observation_fingerprint(tampered) != observation_fingerprint(original)

    report = _admit(tampered, trusted_config, subject)

    assert report["rejectedCount"] == 1
    assert report["results"][0]["reasons"][0]["code"] == "EVIDENCE_PAYLOAD_DIGEST_MISMATCH"
    assert report["results"][0]["validations"]["integrity"]["status"] == "fail"


def test_identity_is_checked_before_the_replay_store_binds_it(
    trusted_config: dict, subject: dict, mandatory_findings: dict[str, Any]
) -> None:
    """A forged ID must never reach the replay store.

    If it did, it would bind evidence under an identity its content does not
    support, and the genuine observation carrying that ID would afterwards be
    rejected as a replay -- the forgery would evict the truth.
    """
    original = _content_addressed(mandatory_findings)
    tampered = _downgraded(original)
    tampered["observationId"] = original["observationId"]
    assert observation_fingerprint(tampered) != observation_fingerprint(original)

    store = InMemoryReplayStore()
    context = {
        "subject": subject,
        "producerRegistry": trusted_config["producerRegistry"],
        "checkRegistry": trusted_config["checkRegistry"],
        "receivedAt": "2026-07-21T00:00:02Z",
        "channel": "local",
        "replayStore": store,
    }

    rejected = admit_observations([tampered], context)
    assert rejected["rejectedCount"] == 1
    assert store.find_by_observation_id(original["observationId"]) is None

    genuine = admit_observations([original], context)
    assert genuine["rejectedCount"] == 0
    assert len(genuine["accepted"]) == 1


def test_opaque_observation_id_is_not_treated_as_a_content_claim(
    mandatory_findings: dict[str, Any],
) -> None:
    """``observationId`` is ``{"type": "string", "minLength": 1}`` in the schema.

    An opaque producer identifier makes no claim about content, so there is
    nothing to verify and admission must not start rejecting it. The shipped
    fixtures use this form (``obs_l9_lint`` and friends).
    """
    fingerprint = observation_fingerprint(mandatory_findings)

    assert verify_observation_identity({"observationId": "obs_l9_lint"}, fingerprint) is None
    assert verify_observation_identity({}, fingerprint) is None
    assert verify_observation_identity({"observationId": 17}, fingerprint) is None


@pytest.mark.parametrize(
    "observation_id",
    [
        "sha256:" + "F" * 64,  # uppercase is not the emitted form
        "sha256:" + "a" * 63,  # too short
        "sha256:" + "a" * 65,  # too long
        "sha512:" + "a" * 64,  # different algorithm
        "prefix-sha256:" + "a" * 64,  # must not match on a substring
    ],
)
def test_near_miss_identifiers_are_treated_as_opaque(
    observation_id: str, mandatory_findings: dict[str, Any]
) -> None:
    """Only the exact emitted form is a checkable claim.

    Anything else is opaque. It must not be silently accepted *as verified*
    either -- these return None because there is no claim, not because the claim
    passed.
    """
    fingerprint = observation_fingerprint(mandatory_findings)
    assert verify_observation_identity({"observationId": observation_id}, fingerprint) is None


def test_verifier_reports_both_digests(mandatory_findings: dict[str, Any]) -> None:
    """The message has to name what was declared and what was computed.

    A bare "mismatch" leaves an operator unable to tell tampering from a producer
    that computes its identity differently.
    """
    fingerprint = observation_fingerprint(mandatory_findings)
    forged = "sha256:" + "b" * 64

    message = verify_observation_identity({"observationId": forged}, fingerprint)

    assert message is not None
    assert forged in message
    assert f"sha256:{fingerprint}" in message
