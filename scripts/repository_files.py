from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

EXCLUDED_DIRS = frozenset(
    {
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
)
EXCLUDED_SUFFIXES = frozenset({".pyc", ".pyo"})
ARCHIVE_SUFFIXES = frozenset({".zip", ".tar", ".gz", ".tgz", ".bz2", ".xz"})


def is_excluded(relative: Path) -> bool:
    return (
        any(part in EXCLUDED_DIRS or part.endswith(".egg-info") for part in relative.parts)
        or relative.suffix in EXCLUDED_SUFFIXES
    )


def repository_files(root: Path, *, extra_paths: Iterable[Path] = ()) -> list[Path]:
    files: set[Path] = set(extra_paths)
    for path in root.rglob("*"):
        relative = path.relative_to(root)
        if is_excluded(relative):
            continue
        if path.is_file():
            files.add(relative)
    return sorted(files, key=lambda item: item.as_posix())


def classify_path(path: Path) -> tuple[str, str, bool]:
    value = path.as_posix()
    if value == ".l9/L9_META.jsonl":
        return "metadata_manifest", "governance", True
    if value == ".l9/repo-spec.yaml":
        return "repository_specification", "governance", False
    if value.startswith("schemas/"):
        return "json_schema", "protocol_authority", False
    if value.startswith("controls/"):
        return "control_definition", "protocol_authority", False
    if value.startswith("profiles/"):
        return "profile_or_policy", "protocol_authority", False
    if value.startswith("registry/"):
        return "registry", "protocol_authority", False
    if value.startswith("src/l9_assurance/protocol/release-zero/"):
        return "embedded_protocol_asset", "derived_protocol", True
    if value.startswith("src/l9_assurance/") and value.endswith(".py"):
        return "python_source", "assurance_runtime", False
    if value.startswith("tests/") and value.endswith(".py"):
        return "behavior_test", "validation", False
    if value.startswith("scripts/") and value.endswith(".py"):
        return "validation_or_generation_script", "repository_tooling", False
    if value.startswith("fixtures/"):
        return "fixture", "validation_evidence", False
    if value.startswith(".github/"):
        return "ci_workflow", "hosted_validation", False
    if value.startswith("docs/") or value.endswith(".md"):
        generated = value == "FINAL_TREE.md"
        return "documentation", "governance", generated
    if value.endswith((".yaml", ".yml", ".json", ".toml")):
        return "configuration", "repository_configuration", False
    return "repository_artifact", "repository_support", False
