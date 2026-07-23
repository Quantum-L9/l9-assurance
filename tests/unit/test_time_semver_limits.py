from __future__ import annotations

import pytest

from l9_assurance.contracts.time import parse_rfc3339_instant, require_rfc3339_instant
from l9_assurance.evidence import compare_semver, resolve_admission_limits, satisfies_range


@pytest.mark.parametrize(
    "value", ["2026-07-21T00:00:00Z", "2026-07-21T00:00:00.123+00:00", "2026-07-20T20:00:00-04:00"]
)
def test_valid_rfc3339(value: str) -> None:
    assert parse_rfc3339_instant(value) is not None


@pytest.mark.parametrize(
    "value",
    [
        "2026-07-21",
        "2026-07-21T00:00:00",
        "2026-02-30T00:00:00Z",
        "2026-07-21T00:00:60Z",
        "2026-07-21T00:00:00-00:00",
    ],
)
def test_invalid_rfc3339(value: str) -> None:
    assert parse_rfc3339_instant(value) is None
    with pytest.raises(ValueError):
        require_rfc3339_instant(value, "timestamp")


def test_semver_order_and_ranges() -> None:
    assert compare_semver("2.0.0", "1.9.9") > 0
    assert compare_semver("2.0.0-alpha", "2.0.0") < 0
    assert satisfies_range("2.1.1", ">=2.0.0 <3.0.0")
    assert not satisfies_range("3.0.0", ">=2.0.0 <3.0.0")


@pytest.mark.parametrize(
    "limits",
    [
        {"maximumObservationCount": 0},
        {"maximumJsonDepth": -1},
        {"maximumSingleObservationBytes": True},
    ],
)
def test_invalid_limits_fail_closed(limits: dict) -> None:
    with pytest.raises(ValueError):
        resolve_admission_limits(limits)
