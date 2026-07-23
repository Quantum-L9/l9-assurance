from __future__ import annotations

from copy import deepcopy
from typing import Any, Mapping

_ZERO_DIGEST = {"algorithm": "sha256", "value": "0" * 64}
_DEFAULT_COMMIT = "a" * 40


def build_subject(overrides: Mapping[str, Any] | None = None) -> dict[str, Any]:
    overrides = overrides or {}
    base = {
        "kind": "git-revision",
        "repository": {"host": "github.com", "owner": "Quantum-L9", "name": "example"},
        "revision": {"commit": _DEFAULT_COMMIT},
    }
    output = {**base, **deepcopy(dict(overrides))}
    output["repository"] = {**base["repository"], **deepcopy(dict(overrides.get("repository", {})))}
    output["revision"] = {**base["revision"], **deepcopy(dict(overrides.get("revision", {})))}
    return output


def build_observation(**overrides: Any) -> dict[str, Any]:
    findings = deepcopy(overrides.get("findings", []))
    counts = _count_findings(findings)
    check_id = overrides.get("check_id", "l9.tests")
    return {
        "schema": "l9.observation",
        "schemaVersion": "1.0.0",
        "observationId": overrides.get("observation_id", f"obs_{check_id.replace('.', '_')}"),
        "producer": {"id": "l9-ci-sdk", "version": overrides.get("producer_version", "2.0.0"), "repository": "Quantum-L9/l9-ci-sdk"},
        "subject": deepcopy(overrides.get("subject", build_subject())),
        "check": {"id": check_id, "version": overrides.get("check_version", "1.0.0"), "configurationDigest": deepcopy(_ZERO_DIGEST)},
        "execution": {"runId": "run_fixture", "attempt": 1, "status": overrides.get("status", "passed"), "startedAt": overrides.get("started_at", "2026-07-21T00:00:00.000Z"), "completedAt": overrides.get("completed_at", "2026-07-21T00:00:01.000Z")},
        "summary": {"findingCount": len(findings), "errorCount": counts["error"], "warningCount": counts["warning"], "informationalCount": counts["informational"]},
        "findings": findings,
        "artifacts": [],
    }


def _count_findings(findings: list[Mapping[str, Any]]) -> dict[str, int]:
    counts = {"error": 0, "warning": 0, "informational": 0}
    for item in findings:
        if item.get("severity") in {"critical", "high"}:
            counts["error"] += 1
        elif item.get("severity") == "informational":
            counts["informational"] += 1
        else:
            counts["warning"] += 1
    return counts
