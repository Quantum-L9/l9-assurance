#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from repository_files import repository_files

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "FINAL_TREE.md"


def render() -> str:
    files = repository_files(ROOT)
    lines = [
        "# Final Source Tree",
        "",
        "Generated from the Python-authoritative source tree. Dependencies, build output, caches, temporary files, Git metadata, and nested archives are excluded.",
        "",
        f"Tracked release files: **{len(files)}**",
        "",
        "```text",
        "l9-assurance/",
    ]
    lines.extend(f"  {path.as_posix()}" for path in files)
    lines.extend(["```", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify FINAL_TREE.md.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()

    expected = render()
    if args.write:
        OUTPUT.write_text(expected, encoding="utf-8")
        print(f"Wrote {OUTPUT.relative_to(ROOT)}")
        return 0
    actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    if actual != expected:
        print(
            "FINAL_TREE.md is stale; run python scripts/generate_inventory.py --write",
            file=sys.stderr,
        )
        return 1
    print("Final tree inventory: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
