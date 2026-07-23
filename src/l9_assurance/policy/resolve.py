from __future__ import annotations

import json
from copy import deepcopy
from typing import Any, Mapping, Sequence

from l9_assurance.evidence.semver import compare_semver


class PolicyResolutionError(ValueError):
    """Raised when policy overlays conflict or violate rollback protection."""


def resolve_policy(
    base: Mapping[str, Any],
    overlays: Sequence[Mapping[str, Any]] = (),
    waivers: Sequence[Mapping[str, Any]] = (),
) -> dict[str, Any]:
    sorted_overlays = sorted(overlays, key=lambda item: (item["precedence"], item["id"]))
    by_precedence: dict[int, list[Mapping[str, Any]]] = {}
    for overlay in sorted_overlays:
        by_precedence.setdefault(int(overlay["precedence"]), []).append(overlay)
    for precedence, group in by_precedence.items():
        _detect_conflicts(precedence, group)
    resolved = deepcopy(dict(base))
    for overlay in sorted_overlays:
        resolved = _merge_policy(resolved, overlay["policy"])
    minimum = resolved.get("minimumPolicyVersion", "0.0.0")
    if compare_semver(resolved["version"], minimum) < 0:
        raise PolicyResolutionError(
            f"Policy rollback: {resolved['version']} below minimum {minimum}"
        )
    return {
        "policy": resolved,
        "waivers": sorted((deepcopy(dict(item)) for item in waivers), key=lambda item: item["waiverId"]),
    }


def _merge_policy(base: Mapping[str, Any], overlay: Mapping[str, Any]) -> dict[str, Any]:
    resolved = {**deepcopy(dict(base)), **deepcopy(dict(overlay))}
    for key in (
        "controlOverrides",
        "mandatoryFindingSeverities",
        "unknownHandling",
        "waiverAuthorization",
        "hardProhibitions",
    ):
        if key not in overlay:
            resolved[key] = deepcopy(base[key])
    resolved["extensions"] = {**deepcopy(base.get("extensions", {})), **deepcopy(overlay.get("extensions", {}))}
    return resolved


def _detect_conflicts(precedence: int, group: Sequence[Mapping[str, Any]]) -> None:
    seen: dict[str, str] = {}
    for overlay in group:
        for key, value in overlay["policy"].items():
            serialized = json.dumps(value, sort_keys=True, separators=(",", ":"))
            previous = seen.get(key)
            if previous is not None and previous != serialized:
                raise PolicyResolutionError(
                    f"Conflicting overlays at precedence {precedence} for {key}"
                )
            seen[key] = serialized
