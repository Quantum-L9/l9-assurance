from __future__ import annotations

import re
from datetime import datetime

_RFC3339 = re.compile(
    r"^(?P<date>\d{4}-\d{2}-\d{2})T(?P<time>\d{2}:\d{2}:\d{2})(?P<fraction>\.\d+)?(?P<offset>Z|[+-]\d{2}:\d{2})$"
)


def parse_rfc3339_instant(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    match = _RFC3339.fullmatch(value)
    if match is None or match.group("offset") == "-00:00":
        return None
    if match.group("time").endswith(":60"):
        return None
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed


def is_rfc3339_instant(value: object) -> bool:
    return parse_rfc3339_instant(value) is not None


def require_rfc3339_instant(value: object, label: str) -> str:
    if not is_rfc3339_instant(value):
        raise ValueError(f"{label} must be an RFC3339 instant with an explicit known offset")
    assert isinstance(value, str)
    return value
