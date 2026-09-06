"""Executed proof that `L9.CI.SDK_VALIDATION` has a real producer.

Five of the seven controls in the pull-request profile had no producer at all,
so every evaluation returned CONTROL_CARDINALITY_VIOLATION for them and the
profile verdict was indeterminate. `l9.sdk-validation` is the first of those to
be closed.

What makes it closed rather than merely populated is that the SDK *derives* the
verdict: `project_sdk_validation_observation` runs both halves of `l9-ci bundle
validate` and reports what they did. It takes no status argument. Wiring the
generic `build_observation` up instead would have satisfied cardinality with a
value nobody checked -- a determinate verdict backed by a caller's assertion,
which is worse than the honest indeterminate it replaced.

So this module proves three things against the real consumer: a derived
observation is admitted and evaluates the control to `pass`; a *failing*
validation is admitted too and is not silently dropped; and tampering with any
of it still fails closed.

Same import contract as `test_sdk_assurance_observation`: the cross-repo CI job
sets L9_CROSS_REPO_SDK_REQUIRED=1 so a missing SDK is a failure, not a skip.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

REPO = Path(__file__).resolve().parents[2]
REVISION = "a" * 40
CONFIGURATION_DIGEST = "b" * 64
STARTED = "2026-07-21T00:00:00Z"
COMPLETED = "2026-07-21T00:00:01Z"
RECEIVED = "2026-07-21T00:00:02Z"

_SDK_REQUIRED = os.environ.get("L9_CROSS_REPO_SDK_REQUIRED") == "1"

# Two different absences, which the first version of this guard conflated and
# reported as "l9-ci is not importable" when l9-ci imported perfectly well.
#
#   1. The SDK is not installed at all. Under L9_CROSS_REPO_SDK_REQUIRED=1 that
#      is a hard failure, exactly as in `test_sdk_assurance_observation`: the
#      seam must not silently stop being proven.
#   2. The SDK is installed but predates `project_sdk_validation_observation`.
#      Then there is no producer for this control on that revision, and there
#      is nothing to prove yet -- the cross-repo job checks the SDK out at
#      `main`, so this is the state until the producer lands there.
#
# Failing (2) would make this PR permanently red on an ordering dependency it
# cannot resolve from inside this repository. Skipping (1) would give away the
# guarantee the job exists for. The SDK's own suite imports the projector
# directly, so its removal fails loudly there rather than quietly here.
try:  # pragma: no cover - import guard, exercised by the cross-repo CI job
    from l9_ci.contracts import (
        Confidence,
        Coverage,
        CoverageStatus,
        EvidenceRecord,
        Finding,
        FindingBundle,
        ProviderRun,
        Severity,
        SnapshotDescriptor,
        SourceLocation,
    )
except ImportError as exc:  # pragma: no cover - see module docstring
    if _SDK_REQUIRED:
        raise RuntimeError(
            "L9_CROSS_REPO_SDK_REQUIRED=1 but l9-ci is not importable; "
            "the sdk-validation control cannot be proven"
        ) from exc
    pytest.skip(
        f"l9-ci is not installed ({exc}); run the cross-repo CI job to prove this",
        allow_module_level=True,
    )

try:  # pragma: no cover - producer-availability guard, see the note above
    from l9_ci.commands.observations import project_sdk_validation_observation
except ImportError as exc:  # pragma: no cover
    pytest.skip(
        "the installed l9-ci has no project_sdk_validation_observation "
        f"({exc}); L9.CI.SDK_VALIDATION has no producer on this SDK revision, "
        "so there is nothing to prove yet",
        allow_module_level=True,
    )


def _valid_bundle_payload(revision: str = REVISION) -> dict[str, Any]:
    """A bundle the SDK's own validator accepts, built from frozen contracts."""
    evidence = EvidenceRecord(
        evidence_id="ev-1",
        snapshot_id="snapshot-1",
        provider_id="semgrep",
        provider_rule_id="python.example",
        evidence_type="static-analysis",
        message="example evidence",
        locations=(SourceLocation("src/example.py", start_line=7),),
        severity=Severity.LOW,
        confidence=Confidence.HIGH,
    )
    finding = Finding(
        finding_id="finding-1",
        snapshot_id="snapshot-1",
        provider_id="semgrep",
        provider_rule_id="python.example",
        canonical_rule_id="l9.example.rule",
        category="security",
        message="example finding",
        evidence_ids=("ev-1",),
        locations=(SourceLocation("src/example.py", start_line=7, end_line=7),),
        fingerprint="fingerprint-1",
        severity=Severity.LOW,
        confidence=Confidence.HIGH,
    )
    bundle = FindingBundle(
        SDK_version="2.0.0",
        generated_at=STARTED,
        snapshot=SnapshotDescriptor(
            snapshot_id="snapshot-1",
            repository_root=".",
            revision=revision,
            dirty=False,
        ),
        providers=(
            ProviderRun(
                provider_id="semgrep",
                adapter_version="1.0.0",
                provider_version="1.176.1",
                mode="execute",
                required=True,
            ),
        ),
        evidence=(evidence,),
        findings=(finding,),
        classifications=(),
        provider_failures=(),
        coverage=(
            Coverage(
                provider_id="semgrep",
                status=CoverageStatus.COMPLETE,
                files_considered=1,
                files_analyzed=1,
                limitations=(),
            ),
        ),
    )
    return bundle.to_dict()


def _project(tmp_path: Path, payload: dict[str, Any]) -> dict[str, Any]:
    path = tmp_path / "bundle.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return dict(
        project_sdk_validation_observation(
            path,
            repository="Quantum-L9/example",
            revision=REVISION,
            configuration_digest=CONFIGURATION_DIGEST,
            run_id="12345",
            attempt=1,
            started_at=STARTED,
            completed_at=COMPLETED,
        )
    )


@pytest.fixture
def passing_observation(tmp_path: Path) -> dict[str, Any]:
    observation = _project(tmp_path, _valid_bundle_payload())
    assert observation["execution"]["status"] == "passed"
    return observation


@pytest.fixture
def failing_observation(tmp_path: Path) -> dict[str, Any]:
    """A real validation failure: an absolute path defeats redaction."""
    payload = _valid_bundle_payload()
    payload["snapshot"]["repository_root"] = "/home/someone/checkout"
    observation = _project(tmp_path, payload)
    assert observation["execution"]["status"] == "failed"
    return observation


def _configuration() -> dict[str, Any]:
    from l9_assurance.cli import load_configuration

    return load_configuration()


def _subject() -> dict[str, Any]:
    subject: dict[str, Any] = json.loads(
        (REPO / "fixtures/valid/subject.json").read_text(encoding="utf-8")
    )
    return subject


def _admit(observation: dict[str, Any]) -> dict[str, Any]:
    from l9_assurance.evidence import admit_observations

    configuration = _configuration()
    report: dict[str, Any] = admit_observations(
        [observation],
        {
            "subject": _subject(),
            "producerRegistry": configuration["producerRegistry"],
            "checkRegistry": configuration["checkRegistry"],
            "receivedAt": RECEIVED,
            "channel": "local",
        },
    )
    return report


def _codes(report: dict[str, Any]) -> list[str]:
    return [reason["code"] for result in report["results"] for reason in result["reasons"]]


def _control(observation: dict[str, Any]) -> dict[str, Any]:
    from l9_assurance.controls.resolve import resolve_profile
    from l9_assurance.evaluator import evaluate

    configuration = _configuration()
    report = _admit(observation)
    decision = evaluate(
        _subject(),
        resolve_profile(configuration["profile"], configuration["controls"]),
        # `waivers` is only read on the failing path, so omitting it passes
        # every green test and raises KeyError on the one that matters.
        {"policy": configuration["policy"], "waivers": []},
        report["accepted"],
        {
            "decisionId": "dec_sdk_validation_cross_repo",
            "evaluationTime": "2026-07-21T00:00:03Z",
        },
    )
    result: dict[str, Any] = next(
        item for item in decision["controlResults"] if item["controlId"] == "L9.CI.SDK_VALIDATION"
    )
    return result


def test_the_live_check_registry_already_admits_sdk_validation(
    passing_observation: dict[str, Any],
) -> None:
    """Read against the checked-in registry, not a trusted fixture.

    If `l9.sdk-validation` were absent from `registry/checks.yaml` the
    projector would produce evidence no consumer accepts, and the control would
    stay indeterminate for a different reason than before.
    """
    report = _admit(passing_observation)
    assert _codes(report) == []
    assert report["rejectedCount"] == 0


def test_a_derived_pass_satisfies_the_control(
    passing_observation: dict[str, Any],
) -> None:
    """The row that used to read CONTROL_CARDINALITY_VIOLATION."""
    result = _control(passing_observation)
    assert result["status"] == "pass"
    assert [reason["code"] for reason in result["reasons"]] == ["CONTROL_REQUIREMENT_SATISFIED"]


def test_a_real_validation_failure_is_admitted_and_fails_the_control(
    failing_observation: dict[str, Any],
) -> None:
    """A failure is evidence, and must not be suppressed.

    Dropping it would turn a revision known to fail SDK validation into one
    with no evidence -- indeterminate rather than failed, which reads as a
    missing producer instead of a real defect.
    """
    report = _admit(failing_observation)
    assert report["rejectedCount"] == 0

    result = _control(failing_observation)
    assert result["status"] == "fail"
    assert "CONTROL_POSITIVE_FAILURE" in [reason["code"] for reason in result["reasons"]]


class TestTamperedEvidenceStillFailsClosed:
    def test_a_flipped_status_is_rejected(self, failing_observation: dict[str, Any]) -> None:
        """Turning a failure into a pass after the fact does not survive.

        `observationId` is a content address and admission recomputes it.
        """
        tampered = json.loads(json.dumps(failing_observation))
        tampered["execution"]["status"] = "passed"
        report = _admit(tampered)
        assert "EVIDENCE_PAYLOAD_DIGEST_MISMATCH" in _codes(report)
        assert report["rejectedCount"] == 1

    def test_evidence_bound_to_another_revision_is_rejected(
        self, passing_observation: dict[str, Any]
    ) -> None:
        tampered = json.loads(json.dumps(passing_observation))
        tampered["subject"]["revision"]["commit"] = "c" * 40
        report = _admit(tampered)
        assert "EVIDENCE_REVISION_MISMATCH" in _codes(report)
        assert report["rejectedCount"] == 1

    def test_a_malformed_payload_is_rejected(self, passing_observation: dict[str, Any]) -> None:
        tampered = json.loads(json.dumps(passing_observation))
        del tampered["summary"]
        report = _admit(tampered)
        assert "EVIDENCE_SCHEMA_INVALID" in _codes(report)
        assert report["rejectedCount"] == 1
