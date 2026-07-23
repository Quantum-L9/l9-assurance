#!/usr/bin/env python3
from __future__ import annotations

import ast
import json
import sys
import tomllib
from pathlib import Path

import yaml
from repository_files import repository_files

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "l9_assurance"
SPEC = ROOT / ".l9" / "repo-spec.yaml"
META = ROOT / ".l9" / "L9_META.jsonl"
FORBIDDEN_IMPORTS = {
    "ftplib",
    "http",
    "httpx",
    "requests",
    "smtplib",
    "socket",
    "subprocess",
    "urllib",
}
FORBIDDEN_CALLS = {"compile", "eval", "exec"}
FORBIDDEN_STATE_NAMES = {"gate_state", "node_url", "peer_url", "workflow_state"}


def main() -> int:
    failures: list[str] = []
    spec = _load_spec(failures)
    _validate_identity(spec, failures)
    _validate_metadata(failures)
    _validate_runtime(failures)
    _validate_protocol_files(failures)
    _validate_replay_contract(failures)

    if failures:
        print("\n".join(sorted(set(failures))), file=sys.stderr)
        return 1
    print(
        "L9 alignment: PASS (metadata, transport applicability, boundaries, replay, schema policy)"
    )
    return 0


def _load_spec(failures: list[str]) -> dict:
    if not SPEC.is_file():
        failures.append("Missing .l9/repo-spec.yaml")
        return {}
    try:
        value = yaml.safe_load(SPEC.read_text(encoding="utf-8"))
    except yaml.YAMLError as error:
        failures.append(f"Invalid .l9/repo-spec.yaml: {error}")
        return {}
    if not isinstance(value, dict):
        failures.append(".l9/repo-spec.yaml must be an object")
        return {}
    return value


def _validate_identity(spec: dict, failures: list[str]) -> None:
    metadata = spec.get("metadata") if isinstance(spec.get("metadata"), dict) else {}
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    version = pyproject.get("project", {}).get("version")
    if metadata.get("repository") != "Quantum-L9/l9-assurance":
        failures.append("repo spec repository identity mismatch")
    if metadata.get("release") != version:
        failures.append("repo spec release does not match pyproject")
    transport = spec.get("transport") if isinstance(spec.get("transport"), dict) else {}
    if transport.get("inter_node_wire_format") != "TransportPacket":
        failures.append("repo spec must preserve TransportPacket as the inter-node wire format")
    if transport.get("packet_envelope") != "forbidden":
        failures.append("repo spec must forbid PacketEnvelope")
    if transport.get("runtime_egress") != "none":
        failures.append("Assurance runtime egress must remain none")
    if transport.get("gate_egress") != "not_applicable_no_egress":
        failures.append("Gate applicability must be explicit for the no-egress Assurance plane")
    schema_policy = (
        spec.get("schema_field_policy") if isinstance(spec.get("schema_field_policy"), dict) else {}
    )
    if schema_policy.get("internal_python_style") != "snake_case":
        failures.append("internal Python field policy must be snake_case")
    if schema_policy.get("canonical_public_contract_style") != "external_contract_preserved":
        failures.append("locked external schema field style exception is not recorded")
    yaml_policy = spec.get("yaml_policy") if isinstance(spec.get("yaml_policy"), dict) else {}
    if yaml_policy.get("accepted_subset") != "deterministic_json_compatible_yaml":
        failures.append("deterministic JSON-compatible YAML policy is not locked")


def _validate_metadata(failures: list[str]) -> None:
    if not META.is_file():
        failures.append("Missing .l9/L9_META.jsonl")
        return
    records: list[dict] = []
    for index, line in enumerate(META.read_text(encoding="utf-8").splitlines(), start=1):
        try:
            value = json.loads(line)
        except json.JSONDecodeError as error:
            failures.append(f"Invalid L9_META line {index}: {error}")
            continue
        if (
            not isinstance(value, dict)
            or not isinstance(value.get("path"), str)
            or not isinstance(value.get("L9_META"), dict)
        ):
            failures.append(f"Invalid L9_META record at line {index}")
            continue
        records.append(value)
    paths = [record["path"] for record in records]
    if len(paths) != len(set(paths)):
        failures.append("L9_META contains duplicate file paths")
    expected = {path.as_posix() for path in repository_files(ROOT)}
    actual = set(paths)
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing:
        failures.append("L9_META missing files: " + ", ".join(missing))
    if extra:
        failures.append("L9_META references absent files: " + ", ".join(extra))
    for record in records:
        meta = record["L9_META"]
        if meta.get("schema") != "l9.file-meta/v1":
            failures.append(f"Invalid L9_META schema for {record['path']}")
        if meta.get("repository") != "Quantum-L9/l9-assurance":
            failures.append(f"Invalid L9_META repository for {record['path']}")
        if not all(
            meta.get(key) not in (None, "")
            for key in ("release", "artifact_type", "owner_layer", "authority")
        ):
            failures.append(f"Incomplete L9_META for {record['path']}")


def _validate_runtime(failures: list[str]) -> None:
    for path in sorted(SRC.rglob("*.py")):
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT)
        if "PacketEnvelope" in text:
            failures.append(f"Deprecated PacketEnvelope reference: {relative}")
        tree = ast.parse(text, filename=str(path))
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in FORBIDDEN_CALLS:
                    failures.append(f"Forbidden dynamic execution in {relative}: {node.func.id}")
                if node.func.id == "print":
                    failures.append(f"Runtime print call bypasses CLI I/O boundary: {relative}")
            elif isinstance(node, ast.Name) and node.id.lower() in FORBIDDEN_STATE_NAMES:
                failures.append(f"Forbidden routing/workflow state name in {relative}: {node.id}")
        if imported & FORBIDDEN_IMPORTS:
            failures.append(
                f"Runtime network/process import in {relative}: {sorted(imported & FORBIDDEN_IMPORTS)}"
            )
        external_l9 = {
            name for name in imported if name.startswith("l9_") and name != "l9_assurance"
        }
        if external_l9:
            failures.append(
                f"Direct sibling-repository import in {relative}: {sorted(external_l9)}"
            )


def _validate_protocol_files(failures: list[str]) -> None:
    for directory in (ROOT / "controls", ROOT / "profiles", ROOT / "registry"):
        for path in sorted(directory.rglob("*.yaml")):
            try:
                value = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as error:
                failures.append(
                    f"{path.relative_to(ROOT)} is not deterministic JSON-compatible YAML: {error}"
                )
                continue
            if not isinstance(value, dict):
                failures.append(f"{path.relative_to(ROOT)} must contain an object")


def _validate_replay_contract(failures: list[str]) -> None:
    from l9_assurance.evidence import (
        DEFAULT_REPLAY_CAPACITY,
        InMemoryReplayStore,
        ReplayRecord,
        ReplayStoreCapacityError,
        ReplayStoreConflictError,
    )

    if DEFAULT_REPLAY_CAPACITY != 100_000:
        failures.append("Default replay capacity drift")
        return
    store = InMemoryReplayStore(maximum_records=1)
    original = ReplayRecord("obs-1", "fingerprint-1", "evidence-1")
    store.record(original)
    store.record(original)
    try:
        store.record(ReplayRecord("obs-1", "fingerprint-2", "evidence-2"))
    except ReplayStoreConflictError:
        pass
    else:
        failures.append("Replay store is not append-only for observation identities")
    try:
        store.record(ReplayRecord("obs-2", "fingerprint-2", "evidence-2"))
    except ReplayStoreCapacityError:
        pass
    else:
        failures.append("Replay store does not fail closed at capacity")


if __name__ == "__main__":
    raise SystemExit(main())
