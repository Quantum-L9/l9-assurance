from __future__ import annotations

import hashlib
import hmac
from collections.abc import Mapping
from copy import deepcopy
from typing import Any

from l9_assurance.evidence import canonical_json


def sign_for_test(
    value: Mapping[str, Any],
    key: bytes,
    *,
    key_id: str = "test-key",
    signed_at: str = "2026-07-21T00:00:00Z",
) -> dict[str, Any]:
    output = deepcopy(dict(value))
    output.pop("signature", None)
    signature = hmac.new(key, canonical_json(output).encode("utf-8"), hashlib.sha256).hexdigest()
    output["signature"] = {
        "keyId": key_id,
        "algorithm": "TEST_HMAC_SHA256",
        "value": signature,
        "signedAt": signed_at,
    }
    return output
