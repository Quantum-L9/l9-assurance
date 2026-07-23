from __future__ import annotations

from collections.abc import Mapping, Sequence
from copy import deepcopy
from typing import Any

from l9_assurance.constants import (
    ASSURANCE_ID,
    ASSURANCE_REPOSITORY,
    ASSURANCE_VERSION,
    CANONICALIZATION_ALGORITHM,
    CAPABILITIES_SCHEMA,
    EXIT_CODES,
    SCHEMA_VERSION,
)

CLI_COMMANDS: tuple[dict[str, Any], ...] = (
    {
        "id": "capabilities",
        "path": ("capabilities",),
        "flags": ("json", "root"),
        "loadsProtocol": True,
        "authority": "read-only",
    },
    {
        "id": "verify",
        "path": ("verify",),
        "flags": ("decision",),
        "loadsProtocol": False,
        "authority": "read-only",
    },
    {
        "id": "verify-plan",
        "path": ("verify-plan",),
        "flags": ("plan",),
        "loadsProtocol": False,
        "authority": "read-only",
    },
    {
        "id": "conformance.producer",
        "path": ("conformance", "producer"),
        "flags": (
            "check-registry",
            "input",
            "producer",
            "producer-registry",
            "received-at",
            "root",
            "subject",
        ),
        "loadsProtocol": True,
        "authority": "read-only",
    },
    {
        "id": "conformance.consumer",
        "path": ("conformance", "consumer"),
        "flags": ("consumer", "fixture", "root"),
        "loadsProtocol": False,
        "authority": "read-only",
    },
    {
        "id": "plan",
        "path": ("plan",),
        "flags": ("output", "profile", "root", "subject"),
        "loadsProtocol": True,
        "authority": "read-only",
    },
    {
        "id": "evidence.admit",
        "path": ("evidence", "admit"),
        "flags": ("input", "output", "received-at", "root", "subject"),
        "loadsProtocol": True,
        "authority": "read-only",
    },
    {
        "id": "evaluate",
        "path": ("evaluate",),
        "flags": (
            "evidence",
            "evaluation-time",
            "output",
            "policy",
            "profile",
            "root",
            "subject",
            "waivers",
        ),
        "loadsProtocol": True,
        "authority": "decision-producing",
    },
    {
        "id": "simulate",
        "path": ("simulate",),
        "flags": (
            "evidence",
            "evaluation-time",
            "output",
            "policy",
            "profile",
            "root",
            "subject",
            "waivers",
        ),
        "loadsProtocol": True,
        "authority": "simulation-only",
    },
)


def resolve_cli_command(positionals: Sequence[str]) -> Mapping[str, Any]:
    supplied = tuple(positionals)
    for descriptor in CLI_COMMANDS:
        if descriptor["path"] == supplied:
            return descriptor
    commands = ", ".join(" ".join(item["path"]) for item in CLI_COMMANDS)
    raise ValueError(
        f"Unknown command {' '.join(supplied) if supplied else '<none>'}. Supported: {commands}."
    )


def describe_capabilities(configuration: Mapping[str, Any]) -> dict[str, Any]:
    manifest = configuration["protocolManifest"]
    return {
        "schema": CAPABILITIES_SCHEMA,
        "schemaVersion": SCHEMA_VERSION,
        "assurance": {
            "id": ASSURANCE_ID,
            "version": ASSURANCE_VERSION,
            "repository": ASSURANCE_REPOSITORY,
        },
        "protocol": {
            "bundleDigest": deepcopy(configuration["protocolBundleDigest"]),
            "canonicalization": CANONICALIZATION_ALGORITHM,
            "schemaVersion": SCHEMA_VERSION,
            "authorityFileCount": len(manifest["files"]),
        },
        "singleIngress": {
            "entrypoint": "l9_assurance.cli.app.run_cli",
            "normalizer": "parse_argv",
            "router": "resolve_cli_command",
            "tracePolicy": "external-coordinator-owned",
            "failClosed": True,
        },
        "profiles": [
            {
                "id": configuration["profile"]["id"],
                "version": configuration["profile"]["version"],
                "policy": {
                    "id": configuration["policy"]["id"],
                    "version": configuration["policy"]["version"],
                },
                "subjectKinds": sorted(configuration["profile"]["subjectKinds"]),
            }
        ],
        "producers": [
            {
                "id": item["id"],
                "repository": item["repository"],
                "authorizationStatus": item["authorization_status"],
                "allowedVersions": item.get("allowed_versions"),
                "candidateVersionRange": item.get("candidate_version_range"),
            }
            for item in sorted(
                configuration["producerRegistry"]["producers"], key=lambda value: value["id"]
            )
        ],
        "checks": [
            {
                "id": item["id"],
                "version": item["version"],
                "owner": item["owner"],
                "outputSchema": item["output_schema"],
            }
            for item in sorted(
                configuration["checkRegistry"]["checks"],
                key=lambda value: (value["id"], value["version"]),
            )
        ],
        "commands": [
            {
                "id": item["id"],
                "path": list(item["path"]),
                "flags": sorted(item["flags"]),
                "loadsProtocol": item["loadsProtocol"],
                "authority": item["authority"],
            }
            for item in CLI_COMMANDS
        ],
        "exitCodes": dict(EXIT_CODES),
    }
