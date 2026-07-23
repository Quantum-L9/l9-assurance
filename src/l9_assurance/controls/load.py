from __future__ import annotations

import json
from copy import deepcopy
from typing import Any

from l9_assurance.contracts.schema import require_valid_instance


def parse_control_definition(text: str) -> dict[str, Any]:
    value = _parse(text, "control")
    require_valid_instance(value, "control.schema.json", "control")
    return deepcopy(value)


def parse_assurance_profile(text: str) -> dict[str, Any]:
    value = _parse(text, "profile")
    require_valid_instance(value, "profile.schema.json", "profile")
    return deepcopy(value)


def _parse(text: str, label: str) -> dict[str, Any]:
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid deterministic JSON-compatible YAML {label}: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value
