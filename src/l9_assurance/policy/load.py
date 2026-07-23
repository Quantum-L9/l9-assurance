from __future__ import annotations

import json
from copy import deepcopy
from typing import Any

from l9_assurance.contracts.schema import require_valid_instance
from l9_assurance.contracts.time import parse_rfc3339_instant


def parse_assurance_policy(text: str) -> dict[str, Any]:
    value = _parse(text, "policy")
    require_valid_instance(value, "policy.schema.json", "policy")
    if value.get("hardProhibitions"):
        raise ValueError(
            "policy.hardProhibitions are unsupported in Release zero without a positive trigger contract"
        )
    override_ids = [item["controlId"] for item in value.get("controlOverrides", [])]
    if len(override_ids) != len(set(override_ids)):
        raise ValueError("policy.controlOverrides contains duplicate controlId")
    return deepcopy(value)


def parse_waiver(text: str) -> dict[str, Any]:
    value = _parse(text, "waiver")
    require_valid_instance(value, "waiver.schema.json", "waiver")
    issued = parse_rfc3339_instant(value.get("issuedAt"))
    expires = parse_rfc3339_instant(value.get("expiresAt"))
    if issued is None:
        raise ValueError("waiver.issuedAt must be an RFC3339 instant with an explicit known offset")
    if expires is None:
        raise ValueError(
            "waiver.expiresAt must be an RFC3339 instant with an explicit known offset"
        )
    if expires <= issued:
        raise ValueError("waiver.expiresAt must be after issuedAt")
    signature = value.get("signature")
    if isinstance(signature, dict) and parse_rfc3339_instant(signature.get("signedAt")) is None:
        raise ValueError(
            "waiver.signature.signedAt must be an RFC3339 instant with an explicit known offset"
        )
    return deepcopy(value)


def _parse(text: str, label: str) -> dict[str, Any]:
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid deterministic JSON-compatible YAML {label}: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value
