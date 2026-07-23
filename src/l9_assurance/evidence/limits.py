from __future__ import annotations

from collections.abc import Mapping
from dataclasses import asdict, dataclass, fields
from typing import Any


@dataclass(frozen=True, slots=True)
class AdmissionLimits:
    maximum_single_observation_bytes: int = 1_048_576
    maximum_observation_count: int = 1_000
    maximum_findings_per_observation: int = 10_000
    maximum_lineage_depth: int = 32
    maximum_json_depth: int = 64
    maximum_string_bytes: int = 1_048_576
    maximum_extension_namespaces: int = 64


DEFAULT_ADMISSION_LIMITS = AdmissionLimits()
_CAMEL_TO_SNAKE = {
    "maximumSingleObservationBytes": "maximum_single_observation_bytes",
    "maximumObservationCount": "maximum_observation_count",
    "maximumFindingsPerObservation": "maximum_findings_per_observation",
    "maximumLineageDepth": "maximum_lineage_depth",
    "maximumJsonDepth": "maximum_json_depth",
    "maximumStringBytes": "maximum_string_bytes",
    "maximumExtensionNamespaces": "maximum_extension_namespaces",
}


def resolve_admission_limits(partial: Mapping[str, Any] | None = None) -> AdmissionLimits:
    values = asdict(DEFAULT_ADMISSION_LIMITS)
    for key, value in (partial or {}).items():
        normalized = _CAMEL_TO_SNAKE.get(key, key)
        if normalized not in values:
            raise ValueError(f"Unknown admission limit {key}")
        values[normalized] = value
    for field in fields(AdmissionLimits):
        value = values[field.name]
        if isinstance(value, bool) or not isinstance(value, int) or value < 1:
            label = next(
                (camel for camel, snake in _CAMEL_TO_SNAKE.items() if snake == field.name),
                field.name,
            )
            raise ValueError(f"{label} must be a positive integer")
    return AdmissionLimits(**values)


def measure_json(value: Any) -> tuple[int, int]:
    seen: set[int] = set()
    maximum_depth = 0
    maximum_string_bytes = 0

    def visit(node: Any, depth: int) -> None:
        nonlocal maximum_depth, maximum_string_bytes
        maximum_depth = max(maximum_depth, depth)
        if isinstance(node, str):
            maximum_string_bytes = max(maximum_string_bytes, len(node.encode("utf-8")))
            return
        if isinstance(node, (dict, list, tuple)):
            identity = id(node)
            if identity in seen:
                raise ValueError("Cyclic JSON value")
            seen.add(identity)
            try:
                if isinstance(node, dict):
                    for key, item in node.items():
                        visit(key, depth + 1)
                        visit(item, depth + 1)
                else:
                    for item in node:
                        visit(item, depth + 1)
            finally:
                seen.remove(identity)

    visit(value, 1)
    return maximum_depth, maximum_string_bytes
