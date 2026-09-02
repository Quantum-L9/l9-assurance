from __future__ import annotations

import subprocess
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


def tracked_paths(root: Path) -> set[str] | None:
    """Paths git tracks, or None when that cannot be determined.

    Returning None (no git, not a work tree, git unavailable) makes the caller
    fall back to pure filesystem enumeration rather than silently dropping
    every file.
    """
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "ls-files", "-z"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return None
    if result.returncode != 0:
        return None
    return {entry for entry in result.stdout.split("\0") if entry}


def repository_files(root: Path, *, extra_paths: Iterable[Path] = ()) -> list[Path]:
    """Enumerate the repository's own files.

    Repository content is what git tracks. A file that is both untracked and
    git-ignored is working-tree residue -- a tool's receipt, an editor or agent
    directory, a cache -- and is not part of the release surface.

    Excluding that residue is what keeps these manifests describing the
    repository rather than whichever machine last ran something. Without it any
    tool that writes into the tree makes the metadata and completeness gates
    stale, including the publication gate itself, whose receipts land in
    ``.l9/``. In a clean checkout every file is tracked, so this is a no-op in
    CI; it only changes behaviour in a dirty working tree, which is exactly
    where the previous behaviour was wrong.

    Untracked-but-not-ignored files are still included: a newly authored file
    belongs in the manifest, and that is the gate that catches an addition made
    without regenerating.
    """
    tracked = tracked_paths(root)
    files: set[Path] = set(extra_paths)
    candidates: list[Path] = []
    for path in root.rglob("*"):
        relative = path.relative_to(root)
        if is_excluded(relative):
            continue
        if path.is_file():
            candidates.append(relative)

    ignored: set[str] = set()
    if tracked is not None and candidates:
        ignored = _git_ignored(root, candidates)

    for relative in candidates:
        posix = relative.as_posix()
        if tracked is not None and posix not in tracked and posix in ignored:
            continue
        files.add(relative)
    return sorted(files, key=lambda item: item.as_posix())


def _git_ignored(root: Path, relatives: list[Path]) -> set[str]:
    """Subset of ``relatives`` that git ignores. Empty when undeterminable."""
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "check-ignore", "-z", "--stdin"],
            input="\0".join(item.as_posix() for item in relatives),
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return set()
    # 0 = at least one ignored, 1 = none ignored; anything else is an error and
    # must not be read as "nothing is ignored" in a way that hides residue.
    if result.returncode not in (0, 1):
        return set()
    return {entry for entry in result.stdout.split("\0") if entry}


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
