#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from l9_assurance.evidence import canonical_json, validate_observation  # noqa: E402


def main() -> int:
    failures: list[str] = []
    valid = sorted((ROOT / "fixtures" / "valid").glob("*.observation.json"))
    invalid = sorted((ROOT / "fixtures" / "invalid").glob("*.observation.json"))
    for path in valid:
        result = validate_observation(json.loads(path.read_text()))
        if not result.valid:
            failures.append(f"Expected valid: {path.name}: {result.errors}")
    for path in invalid:
        result = validate_observation(json.loads(path.read_text()))
        if result.valid:
            failures.append(f"Expected invalid: {path.name}")
    vectors = json.loads((ROOT / "fixtures" / "conformance" / "canonicalization-v1.json").read_text())
    for case in vectors["cases"]:
        actual = canonical_json(json.loads(case["inputJson"]))
        if actual != case["canonicalJson"]:
            failures.append(f"Canonicalization mismatch: {case['id']}")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"Fixtures valid: {len(valid)} positive, {len(invalid)} negative, {len(vectors['cases'])} canonicalization vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
