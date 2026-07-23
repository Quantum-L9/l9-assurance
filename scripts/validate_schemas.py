#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from l9_assurance.contracts.schema import schema_store  # noqa: E402


def main() -> int:
    schemas, _ = schema_store()
    if len(schemas) != 20:
        raise SystemExit(f"Expected 20 schemas, found {len(schemas)}")
    ids: set[str] = set()
    for name, schema in schemas.items():
        Draft202012Validator.check_schema(schema)
        identity = schema.get("$id")
        if not isinstance(identity, str) or identity in ids:
            raise SystemExit(f"Invalid or duplicate schema id in {name}")
        ids.add(identity)
    registry = json.loads((ROOT / "schemas" / "registry.json").read_text())
    if len(registry.get("schemas", [])) != len(schemas):
        raise SystemExit("Schema registry count does not match schema files")
    print(f"Schemas valid: {len(schemas)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
