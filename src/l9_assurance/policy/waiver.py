from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from l9_assurance.contracts.time import parse_rfc3339_instant


def evaluate_waiver(
    waiver: Mapping[str, Any],
    control: Mapping[str, Any],
    subject: Mapping[str, Any],
    policy: Mapping[str, Any],
    evaluation_time: str,
) -> dict[str, Any]:
    if not control.get("waiver", {}).get("allowed"):
        return {"valid": False, "reason": "control-disallows"}
    if waiver.get("controlId") != control.get("id") or not _scope_matches(waiver, subject):
        return {"valid": False, "reason": "subject-mismatch"}
    now = parse_rfc3339_instant(evaluation_time)
    issued = parse_rfc3339_instant(waiver.get("issuedAt"))
    expires = parse_rfc3339_instant(waiver.get("expiresAt"))
    if now is None or issued is None or expires is None:
        return {"valid": False, "reason": "expired"}
    if now < issued:
        return {"valid": False, "reason": "not-yet-active"}
    if now >= expires:
        return {"valid": False, "reason": "expired"}
    maximum = control.get("waiver", {}).get("maximumDurationSeconds")
    if maximum is not None and (expires - issued).total_seconds() > maximum:
        return {"valid": False, "reason": "duration-exceeded"}
    accepted_roles = set(policy["waiverAuthorization"]["acceptedRoles"])
    required_roles = set(control.get("waiver", {}).get("requiredRoles", []))
    actual_roles = set(waiver["authorizedBy"]["roles"])
    if not actual_roles.intersection(accepted_roles) or (
        required_roles and not actual_roles.intersection(required_roles)
    ):
        return {"valid": False, "reason": "role-unauthorized"}
    if policy["waiverAuthorization"]["requireSignature"] and not waiver.get("signature"):
        return {"valid": False, "reason": "signature-required"}
    return {"valid": True, "reason": "active"}


def find_active_waiver(
    waivers: Sequence[Mapping[str, Any]],
    control: Mapping[str, Any],
    subject: Mapping[str, Any],
    policy: Mapping[str, Any],
    evaluation_time: str,
) -> dict[str, Any] | None:
    for waiver in sorted(waivers, key=lambda item: item["waiverId"]):
        if evaluate_waiver(waiver, control, subject, policy, evaluation_time)["valid"]:
            return dict(waiver)
    return None


def _scope_matches(waiver: Mapping[str, Any], subject: Mapping[str, Any]) -> bool:
    scope = waiver["subjectScope"]
    return bool(
        scope["repository"]["host"].lower() == subject["repository"]["host"].lower()
        and scope["repository"]["owner"] == subject["repository"]["owner"]
        and scope["repository"]["name"].removesuffix(".git")
        == subject["repository"]["name"].removesuffix(".git")
        and (
            scope["commit"] == "*"
            or scope["commit"].lower() == subject["revision"]["commit"].lower()
        )
    )
