#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from repository_files import classify_path, repository_files

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".l9" / "L9_META.jsonl"
RELEASE = "2.1.1"
REPOSITORY = "Quantum-L9/l9-assurance"


def render() -> str:
    paths = repository_files(ROOT, extra_paths=(Path(".l9/L9_META.jsonl"),))
    lines: list[str] = []
    for path in paths:
        artifact_type, owner_layer, generated = classify_path(path)
        record = {
            "path": path.as_posix(),
            "L9_META": {
                "schema": "l9.file-meta/v1",
                "repository": REPOSITORY,
                "release": RELEASE,
                "artifact_type": artifact_type,
                "owner_layer": owner_layer,
                "authority": _authority(path),
                "generated": generated,
            },
        }
        lines.append(json.dumps(record, sort_keys=True, separators=(",", ":")))
    return "\n".join(lines) + "\n"


def _authority(path: Path) -> str:
    value = path.as_posix()
    if value.startswith(("schemas/", "controls/", "profiles/", "registry/")):
        return "canonical"
    if value in {"pyproject.toml", ".l9/repo-spec.yaml", "REWRITE_EXECUTION_SPEC.md"}:
        return "canonical"
    if value.startswith("src/l9_assurance/protocol/release-zero/") or value in {
        ".l9/L9_META.jsonl",
        "FINAL_TREE.md",
        "validation-benchmark.json",
        "validation-report.json",
    }:
        return "derived"
    if value.startswith(("tests/", "fixtures/", "scripts/")):
        return "validation"
    return "supporting"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify centralized per-file L9 metadata.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()

    expected = render()
    if args.write:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(expected, encoding="utf-8")
        print(f"Wrote {OUTPUT.relative_to(ROOT)}")
        return 0
    actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.is_file() else ""
    if actual != expected:
        print("L9 metadata manifest is stale; run python scripts/generate_l9_meta.py --write", file=sys.stderr)
        return 1
    print(f"L9 metadata coverage: PASS ({len(expected.splitlines())} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
