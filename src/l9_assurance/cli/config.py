from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml

from l9_assurance.constants import ASSURANCE_VERSION, CANONICALIZATION_ALGORITHM
from l9_assurance.controls.load import parse_assurance_profile, parse_control_definition
from l9_assurance.controls.resolve import resolve_profile
from l9_assurance.evidence.semver import parse_semver
from l9_assurance.policy.load import parse_assurance_policy


def embedded_protocol_root() -> Path:
    return Path(__file__).resolve().parents[1] / "protocol" / "release-zero"


def load_configuration(root: str | Path | None = None) -> dict[str, Any]:
    protocol_root = Path(root).resolve() if root is not None else embedded_protocol_root()
    manifest = _validate_manifest(protocol_root)
    controls = [
        parse_control_definition(path.read_text(encoding="utf-8"))
        for path in sorted((protocol_root / "controls" / "ci").glob("*.yaml"))
    ]
    producer_registry = _load_data(protocol_root / "registry" / "producers.yaml")
    check_registry = _load_data(protocol_root / "registry" / "checks.yaml")
    profile = parse_assurance_profile(
        (protocol_root / "profiles" / "pull-request" / "profile.yaml").read_text(encoding="utf-8")
    )
    policy = parse_assurance_policy(
        (protocol_root / "profiles" / "pull-request" / "policy.yaml").read_text(encoding="utf-8")
    )
    _validate_registries(producer_registry, check_registry)
    if profile["defaultPolicy"] != {"id": policy["id"], "version": policy["version"]}:
        raise ValueError("Profile default policy does not match loaded policy")
    resolve_profile(profile, controls)
    return {
        "root": protocol_root,
        "producerRegistry": producer_registry,
        "checkRegistry": check_registry,
        "profile": profile,
        "policy": policy,
        "controls": controls,
        "protocolBundleDigest": deepcopy(manifest["protocolDigest"]),
        "protocolManifest": manifest,
    }


def _load_data(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream)


def _validate_manifest(root: Path) -> dict[str, Any]:
    path = root / "manifest.json"
    if not path.is_file():
        raise ValueError(f"Protocol manifest missing: {path}")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "schema",
        "schemaVersion",
        "assuranceVersion",
        "canonicalization",
        "files",
        "sourceRepository",
        "sourceBaselineCommit",
        "protocolDigest",
    }
    if set(manifest) != required:
        raise ValueError("Protocol manifest keys are invalid")
    if manifest["schema"] != "l9.assurance-protocol-bundle" or manifest["schemaVersion"] != "1.0.0":
        raise ValueError("Protocol manifest schema mismatch")
    if manifest["canonicalization"] != CANONICALIZATION_ALGORITHM:
        raise ValueError("Protocol manifest canonicalization mismatch")
    if manifest["assuranceVersion"] != ASSURANCE_VERSION:
        raise ValueError(
            f"Protocol manifest assuranceVersion {manifest['assuranceVersion']} does not match runtime {ASSURANCE_VERSION}"
        )
    if not isinstance(manifest["files"], list) or not manifest["files"]:
        raise ValueError("Protocol manifest files must be non-empty")
    normalized_files: list[dict[str, str]] = []
    for index, item in enumerate(manifest["files"]):
        if not isinstance(item, Mapping) or set(item) != {"path", "digest"}:
            raise ValueError(f"Protocol manifest file entry {index} is invalid")
        relative = Path(str(item["path"]))
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError(f"Protocol manifest path escapes bundle: {relative}")
        target = (root / relative).resolve()
        try:
            target.relative_to(root.resolve())
        except ValueError as error:
            raise ValueError(f"Protocol manifest path escapes bundle: {relative}") from error
        if not target.is_file() or target.is_symlink():
            raise ValueError(f"Protocol bundle file missing or unsafe: {relative}")
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
        if actual != item["digest"]:
            raise ValueError(f"Protocol bundle digest mismatch: {relative}")
        normalized_files.append({"path": relative.as_posix(), "digest": str(item["digest"])})
    digest = manifest["protocolDigest"]
    if (
        not isinstance(digest, Mapping)
        or digest.get("algorithm") != "sha256"
        or not _is_sha256(digest.get("value"))
    ):
        raise ValueError("Protocol manifest aggregate digest is invalid")
    preimage = {
        "schema": manifest["schema"],
        "schemaVersion": manifest["schemaVersion"],
        "assuranceVersion": manifest["assuranceVersion"],
        "canonicalization": manifest["canonicalization"],
        "files": normalized_files,
    }
    expected = hashlib.sha256(
        json.dumps(preimage, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    if digest["value"] != expected:
        raise ValueError("Protocol manifest aggregate digest mismatch")
    return deepcopy(manifest)


def _validate_registries(producers: Any, checks: Any) -> None:
    if not isinstance(producers, Mapping) or producers.get("schema_version") != "1.0.0":
        raise ValueError("Producer registry schema_version must be 1.0.0")
    if not isinstance(checks, Mapping) or checks.get("schema_version") != "1.0.0":
        raise ValueError("Check registry schema_version must be 1.0.0")
    producer_items = producers.get("producers")
    check_items = checks.get("checks")
    if not isinstance(producer_items, list) or not producer_items:
        raise ValueError("Producer registry must contain producers")
    if not isinstance(check_items, list) or not check_items:
        raise ValueError("Check registry must contain checks")
    producer_by_id: dict[str, Mapping[str, Any]] = {}
    for producer in producer_items:
        if not isinstance(producer, Mapping):
            raise ValueError("Producer entry must be an object")
        identity = producer.get("id")
        if not isinstance(identity, str) or not identity:
            raise ValueError("Producer id is required")
        if identity in producer_by_id:
            raise ValueError(f"Duplicate producer {identity}")
        if producer.get("authorization_status") not in {"trusted", "pending", "revoked"}:
            raise ValueError(f"Producer {identity} authorization_status is invalid")
        if producer.get("authorization_status") == "trusted" and not isinstance(
            producer.get("allowed_versions"), str
        ):
            raise ValueError(f"Producer {identity} allowed_versions is required when trusted")
        producer_by_id[identity] = producer
    identities: set[str] = set()
    check_ids: set[str] = set()
    for check in check_items:
        if not isinstance(check, Mapping):
            raise ValueError("Check entry must be an object")
        identity = f"{check.get('id')}@{check.get('version')}"
        if identity in identities:
            raise ValueError(f"Duplicate check {identity}")
        identities.add(identity)
        check_ids.add(str(check.get("id")))
        if parse_semver(str(check.get("version"))) is None:
            raise ValueError(f"Check {identity} version must be semantic")
        owner = producer_by_id.get(str(check.get("owner")))
        if owner is None:
            raise ValueError(f"Check {identity} references unknown owner")
        if check.get("id") not in owner.get("checks", []):
            raise ValueError(f"Check {identity} is not authorized by owner")
    for producer in producer_items:
        unknown = set(producer.get("checks", [])) - check_ids
        if unknown:
            raise ValueError(
                f"Producer {producer['id']} references unknown checks {sorted(unknown)}"
            )


def _is_sha256(value: Any) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(ch in "0123456789abcdef" for ch in value)
    )
