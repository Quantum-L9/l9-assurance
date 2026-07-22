# Generated from schemas/v1 by scripts/generate-bindings.mjs. Do not edit.
from __future__ import annotations

import hashlib
import json
from typing import Any, Literal, NotRequired, Required, TypedDict


class ArtifactReference(TypedDict, total=False):
    name: Required[str]
    digest: Required[Digest]
    mediaType: NotRequired[str]
    path: NotRequired[str]
    uri: NotRequired[str]


class AuditBundleManifest(TypedDict, total=False):
    schema: Required[Literal["l9.audit-bundle-manifest"]]
    schemaVersion: Required[Literal["1.0.0"]]
    bundleId: Required[str]
    decisionId: Required[str]
    completeness: Required[Literal["complete", "partial", "review-limited"]]
    entries: Required[list[dict[str, Any]]]
    createdAt: Required[str]
    extensions: NotRequired[dict[str, Any]]


class CheckIdentity(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    configurationDigest: Required[Digest]
    mode: NotRequired[str]


class ClaimDefinition(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    title: Required[str]
    description: Required[str]
    subjectKinds: Required[list[str]]
    limitations: NotRequired[list[str]]


class ControlResult(TypedDict, total=False):
    controlId: Required[str]
    controlVersion: Required[str]
    status: Required[
        Literal["pass", "fail", "conditional", "indeterminate", "not-applicable"]
    ]
    severity: Required[Literal["mandatory", "advisory"]]
    evidenceRefs: Required[list[str]]
    waiverRefs: Required[list[str]]
    unknownRefs: Required[list[str]]
    reasons: Required[list[dict[str, Any]]]
    evaluatedAt: Required[str]


class ControlDefinition(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    claim: Required[str]
    title: Required[str]
    description: Required[str]
    severity: Required[Literal["mandatory", "advisory"]]
    applicability: NotRequired[dict[str, Any]]
    evidenceRequirements: Required[list[dict[str, Any]]]
    dependencies: NotRequired[list[dict[str, Any]]]
    evaluation: Required[dict[str, Any]]
    freshness: NotRequired[dict[str, Any]]
    waiver: NotRequired[dict[str, Any]]


class AssuranceDecision(TypedDict, total=False):
    schema: Required[Literal["l9.assurance-decision"]]
    schemaVersion: Required[Literal["1.0.0"]]
    decisionId: Required[str]
    subject: Required[SubjectReference]
    profile: Required[dict[str, Any]]
    policy: Required[dict[str, Any]]
    verdict: Required[Literal["pass", "fail", "conditional", "indeterminate"]]
    controlResults: Required[list[ControlResult]]
    claims: Required[list[dict[str, Any]]]
    evidenceManifest: Required[list[dict[str, Any]]]
    waivers: Required[list[dict[str, Any]]]
    unknowns: Required[list[Unknown]]
    dimensions: NotRequired[dict[str, Any]]
    issuedAt: Required[str]
    evaluator: Required[dict[str, Any]]
    supersedes: NotRequired[str]
    signature: NotRequired[dict[str, Any]]
    extensions: NotRequired[dict[str, Any]]


class Digest(TypedDict, total=False):
    algorithm: Required[Literal["sha256"]]
    value: Required[str]


class EvidenceAdmissionResult(TypedDict, total=False):
    evidenceId: NotRequired[str]
    status: Required[Literal["accepted", "rejected", "quarantined", "duplicate"]]
    reasons: Required[list[dict[str, Any]]]
    validations: Required[dict[str, Any]]


class EvidenceEnvelope(TypedDict, total=False):
    schema: Required[Literal["l9.evidence-envelope"]]
    schemaVersion: Required[Literal["1.0.0"]]
    evidenceId: Required[str]
    subject: Required[SubjectReference]
    producer: Required[ProducerIdentity]
    evidenceType: Required[str]
    observedAt: Required[str]
    issuedAt: Required[str]
    payload: Required[Any]
    payloadDigest: Required[Digest]
    sourceObservationId: NotRequired[str]
    lineage: Required[list[dict[str, Any]]]
    admissionContext: NotRequired[dict[str, Any]]
    signature: NotRequired[dict[str, Any]]
    redaction: NotRequired[dict[str, Any]]
    extensions: NotRequired[dict[str, Any]]


class Finding(TypedDict, total=False):
    findingId: Required[str]
    ruleId: Required[str]
    ruleVersion: NotRequired[str]
    severity: Required[Literal["critical", "high", "medium", "low", "informational"]]
    disposition: Required[
        Literal["open", "accepted", "suppressed", "resolved", "not-applicable"]
    ]
    message: Required[str]
    location: NotRequired[dict[str, Any]]
    fingerprint: NotRequired[str]
    evidence: NotRequired[list[ArtifactReference]]
    remediation: NotRequired[dict[str, Any]]
    metadata: NotRequired[dict[str, Any]]


class Observation(TypedDict, total=False):
    schema: Required[Literal["l9.observation"]]
    schemaVersion: Required[Literal["1.0.0"]]
    observationId: Required[str]
    producer: Required[ProducerIdentity]
    subject: Required[SubjectReference]
    check: Required[CheckIdentity]
    execution: Required[dict[str, Any]]
    summary: Required[dict[str, Any]]
    findings: Required[list[Finding]]
    artifacts: Required[list[ArtifactReference]]
    provenance: NotRequired[dict[str, Any]]
    extensions: NotRequired[dict[str, Any]]


class AssurancePolicy(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    title: Required[str]
    controlOverrides: Required[list[dict[str, Any]]]
    mandatoryFindingSeverities: Required[
        list[Literal["critical", "high", "medium", "low", "informational"]]
    ]
    unknownHandling: Required[dict[str, Any]]
    waiverAuthorization: Required[dict[str, Any]]
    hardProhibitions: Required[list[dict[str, Any]]]
    minimumPolicyVersion: NotRequired[str]
    extensions: NotRequired[dict[str, Any]]


class ProducerIdentity(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    buildDigest: NotRequired[Digest]
    executionIdentity: NotRequired[str]
    repository: NotRequired[str]


class AssuranceProfile(TypedDict, total=False):
    id: Required[str]
    version: Required[str]
    title: Required[str]
    subjectKinds: Required[list[str]]
    controls: Required[list[dict[str, Any]]]
    defaultPolicy: Required[dict[str, Any]]
    outputClaims: Required[list[dict[str, Any]]]
    compatibility: NotRequired[dict[str, Any]]


class SubjectReference(TypedDict, total=False):
    kind: Required[Literal["git-revision"]]
    repository: Required[dict[str, Any]]
    revision: Required[dict[str, Any]]
    metadata: NotRequired[dict[str, Any]]


class Unknown(TypedDict, total=False):
    unknownId: Required[str]
    category: Required[
        Literal[
            "missing-evidence",
            "invalid-evidence",
            "stale-evidence",
            "unsupported-check",
            "unverified-producer",
            "policy-ambiguity",
            "environment-uncertainty",
            "external-dependency",
            "other",
        ]
    ]
    description: Required[str]
    impact: Required[Literal["none", "advisory", "control", "decision"]]
    relatedControls: Required[list[str]]
    resolvableBy: NotRequired[list[str]]


class Waiver(TypedDict, total=False):
    waiverId: Required[str]
    controlId: Required[str]
    subjectScope: Required[dict[str, Any]]
    rationale: Required[str]
    riskAcceptance: Required[str]
    authorizedBy: Required[dict[str, Any]]
    issuedAt: Required[str]
    expiresAt: Required[str]
    constraints: NotRequired[dict[str, Any]]
    signature: NotRequired[dict[str, Any]]


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )


def sha256_digest(value: Any) -> Digest:
    payload = canonical_json(value).encode("utf-8")
    return {"algorithm": "sha256", "value": hashlib.sha256(payload).hexdigest()}
