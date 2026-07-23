#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from l9_assurance.cli.config import load_configuration  # noqa: E402


def main() -> int:
    config = load_configuration()
    if len(config["producerRegistry"]["producers"]) != 1:
        raise SystemExit("Release zero must define exactly one producer")
    if len(config["checkRegistry"]["checks"]) != 6:
        raise SystemExit("Release zero must define exactly six checks")
    if len(config["controls"]) != 7:
        raise SystemExit("Release zero must define exactly seven controls")
    print("Registries and relationships valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
