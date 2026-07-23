from __future__ import annotations

import hashlib
import hmac
from typing import Any

from .canonical import canonical_json


def sha256_bytes(data: str | bytes | bytearray | memoryview) -> dict[str, str]:
    payload = data.encode("utf-8") if isinstance(data, str) else bytes(data)
    return {"algorithm": "sha256", "value": hashlib.sha256(payload).hexdigest()}


def sha256_digest(value: Any) -> dict[str, str]:
    return sha256_bytes(canonical_json(value))


def verify_digest(value: Any, digest: object) -> bool:
    if not isinstance(digest, dict):
        return False
    if digest.get("algorithm") != "sha256":
        return False
    expected = digest.get("value")
    if not isinstance(expected, str) or len(expected) != 64:
        return False
    actual = sha256_digest(value)["value"]
    return hmac.compare_digest(actual, expected)
