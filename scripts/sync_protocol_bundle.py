#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src" / "l9_assurance" / "protocol" / "release-zero"
VERSION = "2.1.1"
SOURCE_GROUPS = (
    (ROOT / "controls", Path("controls")),
    (ROOT / "profiles", Path("profiles")),
    (ROOT / "registry", Path("registry")),
    (ROOT / "schemas", Path("schemas")),
)
FIXTURES = (
    (
        ROOT / "fixtures" / "compatibility" / "producer-registry.trusted.json",
        Path("fixtures/compatibility/producer-registry.trusted.json"),
    ),
    (
        ROOT / "fixtures" / "compatibility" / "check-registry.json",
        Path("fixtures/compatibility/check-registry.json"),
    ),
    (
        ROOT / "fixtures" / "conformance" / "canonicalization-v1.json",
        Path("fixtures/conformance/canonicalization-v1.json"),
    ),
)


def expected_files() -> dict[str, bytes]:
    output: dict[str, bytes] = {}
    for source_root, destination_root in SOURCE_GROUPS:
        for source in sorted(path for path in source_root.rglob("*") if path.is_file()):
            output[(destination_root / source.relative_to(source_root)).as_posix()] = (
                source.read_bytes()
            )
    for source, destination in FIXTURES:
        output[destination.as_posix()] = source.read_bytes()
    return output


def manifest(files: dict[str, bytes]) -> dict:
    entries = [
        {"path": path, "digest": hashlib.sha256(content).hexdigest()}
        for path, content in sorted(files.items())
    ]
    preimage = {
        "schema": "l9.assurance-protocol-bundle",
        "schemaVersion": "1.0.0",
        "assuranceVersion": VERSION,
        "canonicalization": "l9.canonical-json/v1",
        "files": entries,
    }
    digest = hashlib.sha256(
        json.dumps(preimage, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()
    return {
        **preimage,
        "sourceRepository": "Quantum-L9/l9-assurance",
        "sourceBaselineCommit": "python-authoritative-v2.1.1",
        "protocolDigest": {"algorithm": "sha256", "value": digest},
    }


def write_bundle(files: dict[str, bytes]) -> None:
    if TARGET.exists():
        shutil.rmtree(TARGET)
    for relative, content in files.items():
        target = TARGET / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    (TARGET / "manifest.json").write_text(
        json.dumps(manifest(files), indent=2) + "\n", encoding="utf-8"
    )


def check_bundle(files: dict[str, bytes]) -> list[str]:
    failures: list[str] = []
    for relative, content in files.items():
        target = TARGET / relative
        if not target.is_file() or target.read_bytes() != content:
            failures.append(relative)
    expected_manifest = json.dumps(manifest(files), indent=2) + "\n"
    actual_manifest = (
        (TARGET / "manifest.json").read_text(encoding="utf-8")
        if (TARGET / "manifest.json").is_file()
        else ""
    )
    if actual_manifest != expected_manifest:
        failures.append("manifest.json")
    visible = {
        path.relative_to(TARGET).as_posix()
        for path in TARGET.rglob("*")
        if path.is_file() and path.name != "__init__.py"
    }
    expected = set(files) | {"manifest.json"}
    failures.extend(sorted(visible - expected))
    return sorted(set(failures))


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = expected_files()
    if args.write:
        write_bundle(files)
        return 0
    failures = check_bundle(files)
    if failures:
        print("Protocol bundle drift: " + ", ".join(failures), file=sys.stderr)
        return 1
    print(f"Protocol bundle verified: {len(files)} authority files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
