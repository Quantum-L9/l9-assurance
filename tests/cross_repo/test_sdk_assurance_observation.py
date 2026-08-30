"""Executed producer/consumer proof for the one live v0.1 seam.

The SDK's finding-carrying observation was rejected by assurance admission at
the schema gate because ``l9_ci`` attaches ``sdkVersion`` to the finding-bundle
artifact while ``artifact-reference.schema.json`` set ``unevaluatedProperties:
false`` without listing it. Neither repository could catch that: the SDK
validated its output against the SDK's own schema, and no assurance fixture
ever carried the field.

This module closes that blind spot by running the **real** producer and the
**real** consumer in one process. It is deliberately not fixture-driven; a
hand-authored observation would re-create exactly the gap it exists to prevent.

Requires ``l9-ci`` to be importable. The dedicated cross-repo CI job installs
it and sets ``L9_CROSS_REPO_SDK_REQUIRED=1``, which turns the absence of the
SDK from a skip into a failure -- so the seam cannot silently stop being
proven. Everywhere else (a plain ``pytest -q`` in an assurance-only checkout)
the SDK is genuinely unavailable and the module skips.
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

try:  # pragma: no cover - import guard, exercised by the cross-repo CI job
    import l9_ci
    from l9_ci.contracts import (
        Confidence,
        EvidenceRecord,
        Finding,
        FindingBundle,
        FindingClassification,
        ResolutionStatus,
        RuleMode,
        Severity,
        SnapshotDescriptor,
        SourceLocation,
    )
    from l9_ci.integration import (
        project_mandatory_findings_observation,
        validate_observation,
    )
except ImportError as exc:  # pragma: no cover - see module docstring
    if _SDK_REQUIRED:
        raise RuntimeError(
            "L9_CROSS_REPO_SDK_REQUIRED=1 but l9-ci is not importable; "
            "the SDK->assurance seam cannot be proven"
        ) from exc
    pytest.skip(
        f"l9-ci is not installed ({exc}); run the cross-repo CI job to prove this seam",
        allow_module_level=True,
    )


def _sdk_finding_bundle() -> FindingBundle:
    """Build a canonical bundle with the SDK's own frozen contracts."""
    evidence = EvidenceRecord(
        evidence_id="ev-1",
        snapshot_id="snapshot-1",
        provider_id="semgrep",
        provider_rule_id="python.example",
        evidence_type="static-analysis",
        message="example evidence",
        locations=(SourceLocation("src/example.py", start_line=7),),
        severity=Severity.HIGH,
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
        severity=Severity.HIGH,
        confidence=Confidence.HIGH,
    )
    classification = FindingClassification(
        finding_id="finding-1",
        mode=RuleMode.BLOCKING,
        resolution_status=ResolutionStatus.DEFAULTED,
        used_default=True,
    )
    return FindingBundle(
        SDK_version=l9_ci.__version__,
        generated_at=STARTED,
        snapshot=SnapshotDescriptor(
            snapshot_id="snapshot-1",
            repository_root=".",
            revision=REVISION,
            dirty=False,
        ),
        providers=(),
        evidence=(evidence,),
        findings=(finding,),
        classifications=(classification,),
        provider_failures=(),
        coverage=(),
    )


@pytest.fixture
def sdk_observation() -> dict[str, Any]:
    """A real ``l9.mandatory-findings`` observation from the installed SDK."""
    observation = project_mandatory_findings_observation(
        _sdk_finding_bundle(),
        repository="Quantum-L9/example",
        configuration_digest=CONFIGURATION_DIGEST,
        run_id="12345",
        attempt=1,
        started_at=STARTED,
        completed_at=COMPLETED,
    )
    # The SDK must still consider its own output valid; a producer-side
    # regression would otherwise be misreported here as a consumer failure.
    validate_observation(observation)
    return dict(observation)


def _admit(observation: dict[str, Any]) -> dict[str, Any]:
    from l9_assurance.cli import load_configuration
    from l9_assurance.evidence import admit_observations

    configuration = load_configuration()
    subject = json.loads((REPO / "fixtures/valid/subject.json").read_text(encoding="utf-8"))
    report: dict[str, Any] = admit_observations(
        [observation],
        {
            "subject": subject,
            "producerRegistry": configuration["producerRegistry"],
            "checkRegistry": configuration["checkRegistry"],
            "receivedAt": RECEIVED,
            "channel": "local",
        },
    )
    return report


def _codes(report: dict[str, Any]) -> list[str]:
    return [reason["code"] for result in report["results"] for reason in result["reasons"]]


def test_sdk_attaches_sdk_version_to_the_finding_bundle_artifact(
    sdk_observation: dict[str, Any],
) -> None:
    """Anchor the field that broke the seam.

    If the SDK stops emitting ``sdkVersion`` this test fails loudly rather than
    letting the consumer schema quietly carry a property nothing sends.
    """
    artifact = sdk_observation["artifacts"][0]
    assert artifact["sdkVersion"] == l9_ci.__version__


def test_real_sdk_observation_is_not_schema_rejected(sdk_observation: dict[str, Any]) -> None:
    """The release-blocking assertion: no ``EVIDENCE_SCHEMA_INVALID``."""
    report = _admit(sdk_observation)
    assert "EVIDENCE_SCHEMA_INVALID" not in _codes(report)
    assert report["results"][0]["validations"]["schema"]["status"] == "pass"


def test_real_sdk_observation_is_admitted_by_the_live_registry(
    sdk_observation: dict[str, Any],
) -> None:
    """Producer trust is activated for ``l9-ci-sdk`` (DECISION D-009).

    Read against the live ``registry/producers.yaml``, not a trusted fixture:
    a fixture cannot prove the checked-in registry admits.
    """
    report = _admit(sdk_observation)
    assert _codes(report) == []
    assert report["rejectedCount"] == 0
    assert report["quarantinedCount"] == 0
    assert report["results"][0]["status"] == "accepted"


def test_unknown_artifact_fields_are_still_refused(sdk_observation: dict[str, Any]) -> None:
    """Allowing ``sdkVersion`` must not have opened the artifact reference.

    ``unevaluatedProperties: false`` still has to reject anything not listed.
    """
    tampered = dict(sdk_observation)
    artifacts = [dict(item) for item in tampered["artifacts"]]
    artifacts[0]["unexpectedField"] = "should-not-be-admitted"
    tampered["artifacts"] = artifacts
    report = _admit(tampered)
    assert "EVIDENCE_SCHEMA_INVALID" in _codes(report)
