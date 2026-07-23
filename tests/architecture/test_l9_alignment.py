from __future__ import annotations

import ast
import json
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "src" / "l9_assurance"


def _release_files() -> set[str]:
    excluded = {
        ".git",
        ".mypy_cache",
        ".pytest_cache",
        ".ruff_cache",
        ".venv",
        "__pycache__",
        "build",
        "dist",
        "node_modules",
    }
    output: set[str] = set()
    for path in REPO.rglob("*"):
        relative = path.relative_to(REPO)
        if any(part in excluded or part.endswith(".egg-info") for part in relative.parts):
            continue
        if path.is_file() and path.suffix not in {".pyc", ".pyo"}:
            output.add(relative.as_posix())
    return output


def test_repo_spec_records_l9_applicability() -> None:
    spec = yaml.safe_load((REPO / ".l9/repo-spec.yaml").read_text(encoding="utf-8"))
    assert spec["metadata"]["repository"] == "Quantum-L9/l9-assurance"
    assert spec["metadata"]["release"] == "2.1.1"
    assert spec["transport"] == {
        "inter_node_wire_format": "TransportPacket",
        "packet_envelope": "forbidden",
        "runtime_egress": "none",
        "gate_egress": "not_applicable_no_egress",
        "rationale": "Assurance consumes and emits canonical artifacts; l9-ci-core owns transport and publication.",
    }
    assert spec["schema_field_policy"]["internal_python_style"] == "snake_case"
    assert (
        spec["schema_field_policy"]["canonical_public_contract_style"]
        == "external_contract_preserved"
    )


def test_l9_meta_covers_every_release_file() -> None:
    records = [
        json.loads(line)
        for line in (REPO / ".l9/L9_META.jsonl").read_text(encoding="utf-8").splitlines()
    ]
    paths = [record["path"] for record in records]
    assert len(paths) == len(set(paths))
    assert set(paths) == _release_files()
    assert all(record["L9_META"]["schema"] == "l9.file-meta/v1" for record in records)
    assert all(record["L9_META"]["release"] == "2.1.1" for record in records)


def test_protocol_yaml_is_deterministic_json_subset() -> None:
    for directory in (REPO / "controls", REPO / "profiles", REPO / "registry"):
        for path in directory.rglob("*.yaml"):
            assert isinstance(json.loads(path.read_text(encoding="utf-8")), dict), path


def test_runtime_has_no_network_process_print_or_sibling_imports() -> None:
    forbidden_imports = {
        "ftplib",
        "http",
        "httpx",
        "requests",
        "smtplib",
        "socket",
        "subprocess",
        "urllib",
    }
    for path in SRC.rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                assert node.func.id not in {"compile", "eval", "exec", "print"}, path
        assert not imports & forbidden_imports, (path, imports & forbidden_imports)
        assert not {
            name for name in imports if name.startswith("l9_") and name != "l9_assurance"
        }, path
