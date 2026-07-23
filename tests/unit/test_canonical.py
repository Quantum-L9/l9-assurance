from __future__ import annotations

import json
from pathlib import Path

import pytest

from l9_assurance.evidence import CanonicalizationError, canonical_json, sha256_digest


def test_canonicalization_vectors() -> None:
    path = (
        Path(__file__).resolve().parents[2]
        / "fixtures"
        / "conformance"
        / "canonicalization-v1.json"
    )
    vectors = json.loads(path.read_text(encoding="utf-8"))
    for case in vectors["cases"]:
        assert canonical_json(json.loads(case["inputJson"])) == case["canonicalJson"], case["id"]


@pytest.mark.parametrize("value", [float("inf"), float("-inf"), float("nan")])
def test_non_finite_numbers_rejected(value: float) -> None:
    with pytest.raises(CanonicalizationError):
        canonical_json(value)


def test_cycles_rejected() -> None:
    value: list[object] = []
    value.append(value)
    with pytest.raises(CanonicalizationError):
        canonical_json(value)


def test_digest_is_stable_under_key_order() -> None:
    assert sha256_digest({"b": 2, "a": 1}) == sha256_digest({"a": 1, "b": 2})
