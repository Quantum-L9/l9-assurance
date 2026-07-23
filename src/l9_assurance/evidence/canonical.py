from __future__ import annotations

import json
import math
import re
from decimal import Decimal
from typing import Any


class CanonicalizationError(ValueError):
    """Raised when a value cannot be represented by l9.canonical-json/v1."""


def canonical_json(value: Any) -> str:
    return _serialize(value, set(), "$")


def _serialize(value: Any, seen: set[int], path: str) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        _validate_unicode(value, path)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return _serialize_number(value, path)
    if isinstance(value, (bytes, bytearray, memoryview)):
        raise CanonicalizationError(f"{path}: unsupported value type bytes")
    if isinstance(value, (list, tuple)):
        identity = id(value)
        if identity in seen:
            raise CanonicalizationError(f"{path}: cyclic value")
        seen.add(identity)
        try:
            return "[" + ",".join(
                _serialize(item, seen, f"{path}[{index}]") for index, item in enumerate(value)
            ) + "]"
        finally:
            seen.remove(identity)
    if isinstance(value, dict):
        identity = id(value)
        if identity in seen:
            raise CanonicalizationError(f"{path}: cyclic value")
        seen.add(identity)
        try:
            if any(not isinstance(key, str) for key in value):
                raise CanonicalizationError(f"{path}: object keys must be strings")
            entries: list[str] = []
            for key in sorted(value):
                _validate_unicode(key, f"{path}.<key>")
                encoded_key = json.dumps(key, ensure_ascii=False, separators=(",", ":"))
                entries.append(f"{encoded_key}:{_serialize(value[key], seen, f'{path}.{key}')}")
            return "{" + ",".join(entries) + "}"
        finally:
            seen.remove(identity)
    raise CanonicalizationError(f"{path}: unsupported value type {type(value).__name__}")


def _serialize_number(value: float, path: str) -> str:
    if not math.isfinite(value):
        raise CanonicalizationError(f"{path}: non-finite numbers are forbidden")
    if value == 0.0:
        return "0"
    absolute = abs(value)
    representation = repr(value).lower()
    if 1e-6 <= absolute < 1e21:
        if "e" in representation:
            fixed = format(Decimal(representation), "f")
        else:
            fixed = representation
        if "." in fixed:
            fixed = fixed.rstrip("0").rstrip(".")
        return fixed
    if "e" not in representation:
        representation = format(value, ".15e").lower()
        mantissa, exponent = representation.split("e", 1)
        mantissa = mantissa.rstrip("0").rstrip(".")
        representation = f"{mantissa}e{exponent}"
    representation = re.sub(r"e([+-])0+(\d+)$", r"e\1\2", representation)
    representation = re.sub(r"e0+(\d+)$", r"e\1", representation)
    if "e" in representation and not re.search(r"e[+-]", representation):
        exponent = int(representation.split("e", 1)[1])
        if exponent >= 0:
            representation = representation.replace("e", "e+", 1)
    return representation


def _validate_unicode(value: str, path: str) -> None:
    for index, character in enumerate(value):
        code = ord(character)
        if 0xD800 <= code <= 0xDFFF:
            raise CanonicalizationError(f"{path}[{index}]: malformed Unicode surrogate")
