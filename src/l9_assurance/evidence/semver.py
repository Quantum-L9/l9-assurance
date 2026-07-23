from __future__ import annotations

import re
from dataclasses import dataclass

_PATTERN = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)


@dataclass(frozen=True, slots=True)
class SemVer:
    major: int
    minor: int
    patch: int
    prerelease: str | None = None


def parse_semver(value: str) -> SemVer | None:
    match = _PATTERN.fullmatch(value)
    if match is None:
        return None
    return SemVer(int(match[1]), int(match[2]), int(match[3]), match[4])


def compare_semver(left_value: str, right_value: str) -> int:
    left = parse_semver(left_value)
    right = parse_semver(right_value)
    if left is None or right is None:
        raise ValueError(f"Invalid semantic version: {left_value if left is None else right_value}")
    for a, b in ((left.major, right.major), (left.minor, right.minor), (left.patch, right.patch)):
        if a != b:
            return a - b
    if left.prerelease == right.prerelease:
        return 0
    if left.prerelease is None:
        return 1
    if right.prerelease is None:
        return -1
    return _compare_prerelease(left.prerelease, right.prerelease)


def satisfies_range(version: str, expression: str) -> bool:
    if parse_semver(version) is None:
        return False
    clauses = [item for item in expression.strip().split() if item]
    if not clauses:
        return False
    for clause in clauses:
        match = re.fullmatch(r"(>=|<=|>|<|=)?(.+)", clause)
        if match is None or parse_semver(match[2]) is None:
            return False
        operator = match[1] or "="
        comparison = compare_semver(version, match[2])
        if not {
            ">=": comparison >= 0,
            "<=": comparison <= 0,
            ">": comparison > 0,
            "<": comparison < 0,
            "=": comparison == 0,
        }[operator]:
            return False
    return True


def _compare_prerelease(left: str, right: str) -> int:
    a = left.split(".")
    b = right.split(".")
    for index in range(max(len(a), len(b))):
        if index >= len(a):
            return -1
        if index >= len(b):
            return 1
        if a[index] == b[index]:
            continue
        left_numeric = a[index].isdigit()
        right_numeric = b[index].isdigit()
        if left_numeric and right_numeric:
            return int(a[index]) - int(b[index])
        if left_numeric:
            return -1
        if right_numeric:
            return 1
        return -1 if a[index] < b[index] else 1
    return 0
