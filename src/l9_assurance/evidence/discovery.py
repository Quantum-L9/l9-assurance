from __future__ import annotations

import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any


def discover_json_artifacts(
    root: str | os.PathLike[str],
    limits: int | Mapping[str, int] = 1_000,
) -> list[dict[str, Any]]:
    if isinstance(limits, int):
        maximum_count = limits
        maximum_file_bytes = 1_048_576
    else:
        maximum_count = limits.get("maximumCount", limits.get("maximum_count", 1_000))
        maximum_file_bytes = limits.get(
            "maximumFileBytes", limits.get("maximum_file_bytes", 1_048_576)
        )
    _positive(maximum_count, "maximumCount")
    _positive(maximum_file_bytes, "maximumFileBytes")
    start = Path(root).absolute()
    if start.is_symlink():
        raise ValueError(f"EVIDENCE_POLICY_INADMISSIBLE: symbolic link is prohibited: {start}")
    if not start.exists():
        raise FileNotFoundError(start)
    real_root = start.resolve(strict=True)
    output: list[dict[str, Any]] = []

    def add_file(candidate: Path) -> None:
        if candidate.suffix.lower() != ".json":
            raise ValueError(f"EVIDENCE_MEDIA_TYPE_UNSUPPORTED: expected .json: {candidate}")
        if len(output) >= maximum_count:
            raise ValueError(f"EVIDENCE_LIMIT_EXCEEDED: artifact count exceeds {maximum_count}")
        if candidate.is_symlink() or not candidate.is_file():
            raise ValueError(f"EVIDENCE_POLICY_INADMISSIBLE: expected regular file: {candidate}")
        size = candidate.stat().st_size
        if size > maximum_file_bytes:
            raise ValueError(f"EVIDENCE_TOO_LARGE: {candidate} is {size} bytes")
        raw = candidate.read_bytes()
        if len(raw) > maximum_file_bytes:
            raise ValueError(f"EVIDENCE_TOO_LARGE: {candidate} is {len(raw)} bytes")
        try:
            value = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ValueError(f"EVIDENCE_SCHEMA_INVALID: {candidate}: {error}") from error
        output.append({"path": str(candidate), "value": value, "bytes": len(raw)})

    if start.is_file():
        add_file(real_root)
    else:
        for directory, names, files in os.walk(real_root, followlinks=False):
            names.sort()
            files.sort()
            directory_path = Path(directory)
            for name in names:
                candidate = directory_path / name
                if candidate.is_symlink():
                    raise ValueError(
                        f"EVIDENCE_POLICY_INADMISSIBLE: symbolic link is prohibited: {candidate}"
                    )
                _contained(real_root, candidate.resolve(strict=True), candidate)
            for name in files:
                candidate = directory_path / name
                if candidate.is_symlink():
                    raise ValueError(
                        f"EVIDENCE_POLICY_INADMISSIBLE: symbolic link is prohibited: {candidate}"
                    )
                _contained(real_root, candidate.resolve(strict=True), candidate)
                if candidate.suffix.lower() == ".json":
                    add_file(candidate)
    return output


def _contained(root: Path, candidate: Path, display: Path) -> None:
    try:
        candidate.relative_to(root)
    except ValueError as error:
        raise ValueError(
            f"EVIDENCE_POLICY_INADMISSIBLE: path escapes evidence root: {display}"
        ) from error


def _positive(value: object, name: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ValueError(f"{name} must be a positive integer")
