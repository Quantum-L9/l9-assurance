"""The harness_to_assurance seam fails closed at the consumer.

`l9-harness` emits `l9.assurance-invocation-record` documents that carry
`authoritative: false` by contract: they say an Assurance invocation happened
and how it exited, and nothing else. The audit found no negative test proving
a caller cannot conflate such a record with an Assurance verdict. These tests
pin the consumer side of that seam against the LIVE registries: an invocation
record is not structurally an observation, it is rejected at admission, and
even when dressed as an observation the Harness is not a registered producer.

The record below mirrors `l9-harness/schemas/v1/assurance-invocation-record`
field for field. It is deliberately a negative fixture: the point is that no
shape of it may become admitted evidence, so it is never presented as real
producer evidence.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from l9_assurance.cli import load_configuration
from l9_assurance.evidence import admit_observations, validate_observation

RECEIVED_AT = "2026-07-21T00:00:02Z"


def _invocation_record(*, authoritative: bool = False, exit_code: int = 0) -> dict[str, Any]:
    return {
        "schema": "l9.assurance-invocation-record",
        "schemaVersion": "1.0.0",
        "invocationId": "assurance-invocation:00000000-0000-0000-0000-000000000000",
        "argvDigest": {"algorithm": "sha256", "value": "1" * 64},
        "startedAt": "2026-07-21T00:00:00.000Z",
        "completedAt": "2026-07-21T00:00:01.000Z",
        "exitCode": exit_code,
        "stdoutDigest": {"algorithm": "sha256", "value": "2" * 64},
        "stderrDigest": {"algorithm": "sha256", "value": "3" * 64},
        "authoritative": authoritative,
    }


def _live_context(subject: dict[str, Any]) -> dict[str, Any]:
    configuration = load_configuration()
    return {
        "subject": subject,
        "producerRegistry": configuration["producerRegistry"],
        "checkRegistry": configuration["checkRegistry"],
        "receivedAt": RECEIVED_AT,
        "channel": "local",
    }


def _codes(report: dict[str, Any]) -> set[str]:
    return {reason["code"] for result in report["results"] for reason in result["reasons"]}


def test_an_invocation_record_is_not_an_observation() -> None:
    assert not validate_observation(_invocation_record()).valid


def test_a_passing_invocation_record_is_rejected_at_admission(subject: dict[str, Any]) -> None:
    """Exit code 0 from the Assurance binary is an execution fact, not evidence."""
    report = admit_observations([_invocation_record(exit_code=0)], _live_context(subject))
    assert report["accepted"] == []
    assert report["rejectedCount"] == 1
    assert "EVIDENCE_SCHEMA_INVALID" in _codes(report)


def test_a_forged_authoritative_record_is_still_rejected(subject: dict[str, Any]) -> None:
    report = admit_observations([_invocation_record(authoritative=True)], _live_context(subject))
    assert report["accepted"] == []
    assert report["rejectedCount"] == 1


def test_the_harness_is_not_a_registered_producer(
    subject: dict[str, Any], valid_observations: list[dict[str, Any]]
) -> None:
    """A structurally valid observation attributed to l9-harness is not admitted."""
    dressed = deepcopy(valid_observations[0])
    dressed["producer"] = {
        "id": "l9-harness",
        "version": "2.0.4",
        "repository": "Quantum-L9/l9-harness",
    }
    report = admit_observations([dressed], _live_context(subject))
    assert report["accepted"] == []
    assert "EVIDENCE_PRODUCER_UNKNOWN" in _codes(report)
