from __future__ import annotations

import re
from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Mapping

from l9_assurance.contracts.schema import validate_instance
from l9_assurance.contracts.time import is_rfc3339_instant

from .canonical import CanonicalizationError, canonical_json
from .limits import AdmissionLimits, measure_json, resolve_admission_limits

_EXTENSION = re.compile(r"^[a-z0-9]+(?:\.[a-z0-9-]+)+$")


@dataclass(frozen=True, slots=True)
class StructuralValidation:
    valid: bool
    errors: tuple[str, ...]
    observation: dict[str, Any] | None = None


def validate_observation(
    value: Any,
    partial_limits: Mapping[str, Any] | AdmissionLimits | None = None,
) -> StructuralValidation:
    limits = partial_limits if isinstance(partial_limits, AdmissionLimits) else resolve_admission_limits(partial_limits)
    errors: list[str] = []
    if not isinstance(value, dict):
        return StructuralValidation(False, ("$ must be an object",))
    try:
        serialized = canonical_json(value)
        byte_count = len(serialized.encode("utf-8"))
        if byte_count > limits.maximum_single_observation_bytes:
            errors.append(f"EVIDENCE_TOO_LARGE: {byte_count} bytes")
    except CanonicalizationError as error:
        serialized = ""
        errors.append(f"EVIDENCE_CANONICALIZATION_FAILED: {error}")
    try:
        depth, maximum_string_bytes = measure_json(value)
        if depth > limits.maximum_json_depth:
            errors.append(f"EVIDENCE_LIMIT_EXCEEDED: depth {depth}")
        if maximum_string_bytes > limits.maximum_string_bytes:
            errors.append(f"EVIDENCE_LIMIT_EXCEEDED: string bytes {maximum_string_bytes}")
    except ValueError as error:
        errors.append(f"EVIDENCE_CANONICALIZATION_FAILED: {error}")

    schema_errors = validate_instance(value, "observation.schema.json")
    for error in schema_errors:
        if "schemaVersion" in error and value.get("schemaVersion") != "1.0.0":
            errors.append(f"EVIDENCE_SCHEMA_UNSUPPORTED: {error}")
        elif "extensions" in error and "does not match" in error:
            errors.append(f"EVIDENCE_EXTENSION_NAMESPACE_INVALID: {error}")
        else:
            errors.append(error)

    execution = value.get("execution")
    if isinstance(execution, dict):
        for field in ("startedAt", "completedAt"):
            if not is_rfc3339_instant(execution.get(field)):
                errors.append(
                    f"$.execution.{field} must be an RFC3339 instant with an explicit known offset"
                )
    extensions = value.get("extensions")
    if isinstance(extensions, dict):
        if len(extensions) > limits.maximum_extension_namespaces:
            errors.append(f"EVIDENCE_LIMIT_EXCEEDED: extension namespaces {len(extensions)}")
        for namespace in extensions:
            if _EXTENSION.fullmatch(namespace) is None:
                errors.append(
                    f"EVIDENCE_EXTENSION_NAMESPACE_INVALID: $.extensions.{namespace} is invalid"
                )
    findings = value.get("findings")
    if isinstance(findings, list) and len(findings) > limits.maximum_findings_per_observation:
        errors.append(f"EVIDENCE_LIMIT_EXCEEDED: findings {len(findings)}")
    summary = value.get("summary")
    if isinstance(findings, list) and isinstance(summary, dict):
        declared = summary.get("findingCount")
        classified = sum(
            item if isinstance(item, int) and not isinstance(item, bool) else -10**9
            for item in (
                summary.get("errorCount"),
                summary.get("warningCount"),
                summary.get("informationalCount"),
            )
        )
        if declared != len(findings):
            errors.append("$.summary.findingCount does not match findings length")
        if declared != classified:
            errors.append("$.summary category counts do not sum to findingCount")

    if errors:
        return StructuralValidation(False, tuple(dict.fromkeys(errors)))
    return StructuralValidation(True, (), deepcopy(value))
