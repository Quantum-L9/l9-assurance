from __future__ import annotations

import math
import re
from collections.abc import Callable, Mapping, Sequence
from copy import deepcopy
from datetime import timedelta
from typing import Any

from l9_assurance.contracts.time import parse_rfc3339_instant, require_rfc3339_instant

from .digest import sha256_digest, verify_digest
from .limits import AdmissionLimits, resolve_admission_limits
from .replay import (
    InMemoryReplayStore,
    ReplayRecord,
    ReplayStoreCapacityError,
    ReplayStoreConflictError,
)
from .semver import satisfies_range
from .subject import normalize_subject, same_repository, same_revision
from .validation import validate_observation

_CHANNELS = {"local", "ci-artifact", "api", "bundle"}


def admit_observations(values: Sequence[Any], context: Mapping[str, Any]) -> dict[str, Any]:
    limits = resolve_admission_limits(context.get("limits"))
    received_at = require_rfc3339_instant(context.get("receivedAt"), "receivedAt")
    _validate_freshness_configuration(context)
    if len(values) > limits.maximum_observation_count:
        raise ValueError(f"EVIDENCE_LIMIT_EXCEEDED: observation count {len(values)}")
    channel = context.get("channel", "local")
    if channel not in _CHANNELS:
        raise ValueError(f"Unsupported admission channel {channel}")
    subject = normalize_subject(_mapping(context.get("subject"), "subject"))
    producer_registry = _mapping(context.get("producerRegistry"), "producerRegistry")
    check_registry = _mapping(context.get("checkRegistry"), "checkRegistry")
    replay_store = context.get("replayStore")
    if replay_store is None:
        replay_store = InMemoryReplayStore()
    accepted: list[dict[str, Any]] = []
    results: list[dict[str, Any]] = []
    unknowns: list[dict[str, Any]] = []
    for index, value in enumerate(values):
        outcome = _admit_one(
            value,
            subject=subject,
            producer_registry=producer_registry,
            check_registry=check_registry,
            received_at=received_at,
            channel=channel,
            replay_store=replay_store,
            limits=limits,
            index=index,
            maximum_age=context.get("maximumAgeSecondsByCheck", {}),
            future_tolerance=context.get("futureToleranceSeconds", 300),
            policy_admissibility=context.get("policyAdmissibility"),
        )
        results.append(outcome["result"])
        if "accepted" in outcome:
            accepted.append(outcome["accepted"])
        if "unknown" in outcome:
            unknowns.append(outcome["unknown"])
    accepted.sort(key=lambda item: item["envelope"]["evidenceId"])
    unknowns.sort(key=lambda item: item["unknownId"])
    return {
        "subject": subject,
        "receivedAt": received_at,
        "results": results,
        "accepted": accepted,
        "rejectedCount": sum(item["status"] == "rejected" for item in results),
        "quarantinedCount": sum(item["status"] == "quarantined" for item in results),
        "duplicateCount": sum(item["status"] == "duplicate" for item in results),
        "unknowns": unknowns,
    }


def create_evidence_envelope(
    observation: Mapping[str, Any], issued_at: str, channel: str = "local"
) -> dict[str, Any]:
    require_rfc3339_instant(issued_at, "issuedAt")
    if channel not in _CHANNELS:
        raise ValueError(f"Unsupported admission channel {channel}")
    observation_copy = deepcopy(dict(observation))
    subject = normalize_subject(_mapping(observation_copy.get("subject"), "observation.subject"))
    fingerprint = observation_fingerprint(observation_copy)
    return {
        "schema": "l9.evidence-envelope",
        "schemaVersion": "1.0.0",
        "evidenceId": f"ev_{fingerprint[:40]}",
        "subject": subject,
        "producer": deepcopy(observation_copy["producer"]),
        "evidenceType": f"l9.observation/{observation_copy['check']['id']}",
        "observedAt": observation_copy["execution"]["completedAt"],
        "issuedAt": issued_at,
        "payload": observation_copy,
        "payloadDigest": sha256_digest(observation_copy),
        "sourceObservationId": observation_copy["observationId"],
        "lineage": [],
        "admissionContext": {"receivedAt": issued_at, "channel": channel},
    }


def verify_envelope_integrity(envelope: Mapping[str, Any]) -> bool:
    return verify_digest(envelope.get("payload"), envelope.get("payloadDigest"))


def observation_fingerprint(observation: Mapping[str, Any]) -> str:
    value = {key: deepcopy(item) for key, item in observation.items() if key != "observationId"}
    return sha256_digest(value)["value"]


def _admit_one(
    value: Any,
    *,
    subject: Mapping[str, Any],
    producer_registry: Mapping[str, Any],
    check_registry: Mapping[str, Any],
    received_at: str,
    channel: str,
    replay_store: Any,
    limits: AdmissionLimits,
    index: int,
    maximum_age: Mapping[str, Any],
    future_tolerance: float,
    policy_admissibility: Callable[[Mapping[str, Any]], str | None] | None,
) -> dict[str, Any]:
    validations = _empty_validations()
    structural = validate_observation(value, limits)
    if not structural.valid or structural.observation is None:
        validations["schema"] = _validation(
            "fail", "EVIDENCE_SCHEMA_INVALID", "; ".join(structural.errors)
        )
        reasons = [
            _reason(_classify_structural_code(message), message) for message in structural.errors
        ]
        return _terminal(
            "rejected",
            reasons,
            validations,
            unknown=_unknown(index, "invalid-evidence", "; ".join(structural.errors)),
        )
    observation = structural.observation
    validations["schema"] = _validation("pass")
    try:
        normalized_subject = normalize_subject(observation["subject"])
    except ValueError as error:
        validations["subject"] = _validation("fail", "EVIDENCE_SUBJECT_INVALID", str(error))
        return _terminal(
            "rejected",
            [_reason("EVIDENCE_SUBJECT_INVALID", str(error))],
            validations,
            unknown=_unknown(index, "invalid-evidence", str(error)),
        )
    if not same_repository(normalized_subject, subject):
        message = "repository identity differs from evaluated subject"
        validations["subject"] = _validation("fail", "EVIDENCE_SUBJECT_MISMATCH", message)
        return _terminal(
            "rejected",
            [_reason("EVIDENCE_SUBJECT_MISMATCH", message)],
            validations,
            unknown=_unknown(index, "invalid-evidence", "Repository identity mismatch."),
        )
    if not same_revision(normalized_subject, subject):
        message = "revision differs from evaluated subject"
        validations["subject"] = _validation("fail", "EVIDENCE_REVISION_MISMATCH", message)
        return _terminal(
            "rejected",
            [_reason("EVIDENCE_REVISION_MISMATCH", message)],
            validations,
            unknown=_unknown(index, "invalid-evidence", "Revision mismatch."),
        )
    validations["subject"] = _validation("pass")

    producer = next(
        (
            item
            for item in producer_registry.get("producers", [])
            if item.get("id") == observation["producer"]["id"]
        ),
        None,
    )
    if producer is None:
        return _producer_terminal(
            index,
            validations,
            "rejected",
            "EVIDENCE_PRODUCER_UNKNOWN",
            "producer is not registered",
            "Producer is not registered.",
        )
    if producer.get("authorization_status") == "pending" or not producer.get("allowed_versions"):
        return _producer_terminal(
            index,
            validations,
            "quarantined",
            "EVIDENCE_POLICY_INADMISSIBLE",
            "producer trust activation is pending",
            "Producer trust activation is pending.",
        )
    if producer.get("authorization_status") == "revoked" or not satisfies_range(
        observation["producer"]["version"], producer["allowed_versions"]
    ):
        return _producer_terminal(
            index,
            validations,
            "rejected",
            "EVIDENCE_PRODUCER_VERSION_REVOKED",
            "producer version is not authorized",
            "Producer version is not authorized.",
        )
    if observation["subject"]["kind"] not in producer.get("subject_kinds", []):
        return _producer_terminal(
            index,
            validations,
            "rejected",
            "EVIDENCE_POLICY_INADMISSIBLE",
            "producer is not authorized for subject kind",
            "Producer is not authorized for subject kind.",
        )
    producer_repository = observation["producer"].get("repository")
    if producer_repository and _normalize_repository(producer_repository) != _normalize_repository(
        producer["repository"]
    ):
        return _producer_terminal(
            index,
            validations,
            "rejected",
            "EVIDENCE_PRODUCER_UNKNOWN",
            "producer repository does not match registry",
            "Producer repository does not match registry.",
        )
    validations["producer"] = _validation("pass")

    check = next(
        (
            item
            for item in check_registry.get("checks", [])
            if item.get("id") == observation["check"]["id"]
            and item.get("version") == observation["check"]["version"]
        ),
        None,
    )
    unauthorized = (
        check is None
        or observation["check"]["id"] not in producer.get("checks", [])
        or check.get("owner") != producer.get("id")
        or observation["check"]["version"] in check.get("revoked_versions", [])
    )
    if unauthorized or check is None:
        return _authorization_terminal(
            index,
            validations,
            "EVIDENCE_CHECK_UNAUTHORIZED",
            "check identity is not authorized for producer",
            "Check is not authorized.",
        )
    if check.get("output_schema") != "l9.observation/v1":
        return _authorization_terminal(
            index,
            validations,
            "EVIDENCE_SCHEMA_UNSUPPORTED",
            "check output schema is not supported",
            "Check output schema is not supported.",
        )
    if observation["execution"]["status"] not in check.get("accepted_execution_statuses", []):
        return _authorization_terminal(
            index,
            validations,
            "EVIDENCE_CHECK_UNAUTHORIZED",
            "execution status is not authorized for check",
            "Execution status is not authorized for check.",
        )
    if check.get("configuration_digest_required") and not observation["check"].get(
        "configurationDigest"
    ):
        return _authorization_terminal(
            index,
            validations,
            "EVIDENCE_SCHEMA_INVALID",
            "configuration digest is required",
            "Configuration digest is missing.",
        )
    validations["authorization"] = _validation("pass")

    started = parse_rfc3339_instant(observation["execution"]["startedAt"])
    completed = parse_rfc3339_instant(observation["execution"]["completedAt"])
    received = parse_rfc3339_instant(received_at)
    if started is None or completed is None or received is None or started > completed:
        return _freshness_terminal(
            index,
            validations,
            "EVIDENCE_EXECUTION_INTERVAL_INVALID",
            "execution interval is invalid",
            "invalid-evidence",
            "Execution interval is invalid.",
        )
    if completed > received + timedelta(seconds=float(future_tolerance)):
        return _freshness_terminal(
            index,
            validations,
            "EVIDENCE_EXECUTION_INTERVAL_INVALID",
            "observation completion is unreasonably in the future",
            "environment-uncertainty",
            "Observation completion is in the future.",
        )
    age = maximum_age.get(observation["check"]["id"])
    if age is not None and (received - completed).total_seconds() > float(age):
        return _freshness_terminal(
            index,
            validations,
            "EVIDENCE_STALE",
            "observation exceeds configured freshness",
            "stale-evidence",
            "Observation is stale.",
        )
    validations["freshness"] = _validation("pass")

    if policy_admissibility is not None:
        policy_reason = policy_admissibility(observation)
        if policy_reason:
            return _authorization_terminal(
                index,
                validations,
                "EVIDENCE_POLICY_INADMISSIBLE",
                policy_reason,
                policy_reason,
                category="invalid-evidence",
            )

    fingerprint = observation_fingerprint(observation)
    existing = replay_store.find_by_observation_id(observation["observationId"])
    if existing is not None and existing.fingerprint != fingerprint:
        validations["replay"] = _validation(
            "fail", "EVIDENCE_REPLAY_DETECTED", "observation ID was reused with different content"
        )
        return _terminal(
            "rejected",
            [
                _reason(
                    "EVIDENCE_REPLAY_DETECTED", "observation ID was reused with different content"
                )
            ],
            validations,
            evidence_id=existing.evidence_id,
            unknown=_unknown(index, "invalid-evidence", "Observation identity replay detected."),
        )
    duplicate = existing or replay_store.find_by_fingerprint(fingerprint)
    if duplicate is not None:
        validations["replay"] = _validation(
            "pass", "EVIDENCE_REPLAY_DETECTED", "identical evidence already admitted"
        )
        return _terminal(
            "duplicate",
            [_reason("EVIDENCE_REPLAY_DETECTED", "identical evidence already admitted")],
            validations,
            evidence_id=duplicate.evidence_id,
        )
    validations["replay"] = _validation("pass")
    validations["lineage"] = _validation("pass")
    validations["integrity"] = _validation("pass")
    envelope = create_evidence_envelope(observation, received_at, channel)
    evidence_id = envelope["evidenceId"]
    accepted = {
        "envelope": envelope,
        "observation": deepcopy(observation),
        "fingerprint": fingerprint,
    }
    try:
        replay_store.record(ReplayRecord(observation["observationId"], fingerprint, evidence_id))
    except ReplayStoreCapacityError as error:
        validations["replay"] = _validation("fail", "EVIDENCE_LIMIT_EXCEEDED", str(error))
        return _terminal(
            "rejected",
            [_reason("EVIDENCE_LIMIT_EXCEEDED", str(error))],
            validations,
            unknown=_unknown(
                index, "environment-uncertainty", "Replay state capacity is exhausted."
            ),
        )
    except ReplayStoreConflictError as error:
        validations["replay"] = _validation("fail", "EVIDENCE_REPLAY_DETECTED", str(error))
        return _terminal(
            "rejected",
            [_reason("EVIDENCE_REPLAY_DETECTED", str(error))],
            validations,
            unknown=_unknown(
                index,
                "invalid-evidence",
                "Replay state conflicts with immutable evidence identity.",
            ),
        )
    outcome = _terminal("accepted", [], validations, evidence_id=evidence_id)
    outcome["accepted"] = accepted
    return outcome


def _empty_validations() -> dict[str, dict[str, str]]:
    return {
        key: {"status": "skipped"}
        for key in (
            "schema",
            "producer",
            "subject",
            "integrity",
            "freshness",
            "authorization",
            "replay",
            "lineage",
        )
    }


def _validation(status: str, code: str | None = None, message: str | None = None) -> dict[str, str]:
    result = {"status": status}
    if code is not None:
        result["code"] = code
    if message is not None:
        result["message"] = message
    return result


def _reason(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _unknown(index: int, category: str, description: str) -> dict[str, Any]:
    return {
        "unknownId": f"unknown_admission_{index:04d}",
        "category": category,
        "description": description,
        "impact": "decision",
        "relatedControls": [],
        "resolvableBy": ["produce conformant exact-revision evidence"],
    }


def _terminal(
    status: str,
    reasons: list[dict[str, str]],
    validations: Mapping[str, Any],
    *,
    evidence_id: str | None = None,
    unknown: dict[str, Any] | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "status": status,
        "reasons": reasons,
        "validations": deepcopy(dict(validations)),
    }
    if evidence_id is not None:
        result["evidenceId"] = evidence_id
    outcome: dict[str, Any] = {"result": result}
    if unknown is not None:
        outcome["unknown"] = unknown
    return outcome


def _producer_terminal(
    index: int, validations: dict[str, Any], status: str, code: str, message: str, description: str
) -> dict[str, Any]:
    validations["producer"] = _validation("fail", code, message)
    return _terminal(
        status,
        [_reason(code, message)],
        validations,
        unknown=_unknown(index, "unverified-producer", description),
    )


def _authorization_terminal(
    index: int,
    validations: dict[str, Any],
    code: str,
    message: str,
    description: str,
    category: str = "unsupported-check",
) -> dict[str, Any]:
    validations["authorization"] = _validation("fail", code, message)
    return _terminal(
        "rejected",
        [_reason(code, message)],
        validations,
        unknown=_unknown(index, category, description),
    )


def _freshness_terminal(
    index: int,
    validations: dict[str, Any],
    code: str,
    message: str,
    category: str,
    description: str,
) -> dict[str, Any]:
    validations["freshness"] = _validation("fail", code, message)
    return _terminal(
        "rejected",
        [_reason(code, message)],
        validations,
        unknown=_unknown(index, category, description),
    )


def _classify_structural_code(message: str) -> str:
    for prefix in (
        "EVIDENCE_TOO_LARGE",
        "EVIDENCE_LIMIT_EXCEEDED",
        "EVIDENCE_EXTENSION_NAMESPACE_INVALID",
        "EVIDENCE_SCHEMA_UNSUPPORTED",
        "EVIDENCE_CANONICALIZATION_FAILED",
    ):
        if message.startswith(prefix):
            return prefix
    return "EVIDENCE_SCHEMA_INVALID"


def _validate_freshness_configuration(context: Mapping[str, Any]) -> None:
    tolerance = context.get("futureToleranceSeconds")
    if tolerance is not None and (
        isinstance(tolerance, bool)
        or not isinstance(tolerance, (int, float))
        or not math.isfinite(tolerance)
        or tolerance < 0
    ):
        raise ValueError("futureToleranceSeconds must be a finite non-negative number")
    maximum_age = context.get("maximumAgeSecondsByCheck", {})
    if not isinstance(maximum_age, Mapping):
        raise ValueError("maximumAgeSecondsByCheck must be an object")
    for check_id, value in maximum_age.items():
        if not isinstance(check_id, str) or not check_id.strip():
            raise ValueError("maximumAgeSecondsByCheck contains an empty check identity")
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
        ):
            raise ValueError(
                f"maximumAgeSecondsByCheck.{check_id} must be a finite non-negative number"
            )


def _normalize_repository(value: str) -> str:
    return re.sub(
        r"\.git$",
        "",
        re.sub(r"^https?://github\.com/", "", value.strip(), flags=re.IGNORECASE),
        flags=re.IGNORECASE,
    ).lower()


def _mapping(value: Any, label: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise ValueError(f"{label} must be an object")
    return value
