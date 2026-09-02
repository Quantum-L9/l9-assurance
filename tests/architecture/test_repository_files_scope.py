"""`repository_files` must describe the repository, not the working directory.

The metadata, inventory, and completeness gates all enumerate the tree through
this helper. It used to return every file on disk, so any tool that wrote into
the working tree made those gates stale -- including the sanctioned publication
gate itself, whose receipts land under `.l9/`. Running `make pr` therefore
invalidated the manifests that `make pr` checks.

Repository content is what git tracks. A file that is both untracked and
git-ignored is residue. A file that is untracked but *not* ignored is newly
authored and must stay in scope, because that is the gate catching an addition
made without regenerating.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from repository_files import repository_files, tracked_paths


def _git(*args: str, cwd: Path) -> None:
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


@pytest.fixture
def repository(tmp_path: Path) -> Path:
    _git("init", cwd=tmp_path)
    _git("config", "user.email", "t@example.com", cwd=tmp_path)
    _git("config", "user.name", "T", cwd=tmp_path)
    (tmp_path / ".gitignore").write_text("residue/\n", encoding="utf-8")
    (tmp_path / "source.py").write_text("x = 1\n", encoding="utf-8")
    _git("add", ".gitignore", "source.py", cwd=tmp_path)
    _git("commit", "-m", "init", cwd=tmp_path)
    return tmp_path


def _names(root: Path) -> set[str]:
    return {path.as_posix() for path in repository_files(root)}


def test_tracked_files_are_included(repository: Path) -> None:
    assert {"source.py", ".gitignore"} <= _names(repository)


def test_ignored_untracked_residue_is_excluded(repository: Path) -> None:
    """The publication gate's own receipts are exactly this shape."""
    (repository / "residue").mkdir()
    (repository / "residue" / "gate-timing.json").write_text("{}", encoding="utf-8")
    assert "residue/gate-timing.json" not in _names(repository)


def test_untracked_but_unignored_files_are_still_included(repository: Path) -> None:
    """A newly authored file must not vanish from the manifests.

    This is the half of the contract that keeps the gate useful: adding a file
    without regenerating still fails, as it should.
    """
    (repository / "added.py").write_text("y = 2\n", encoding="utf-8")
    assert "added.py" in _names(repository)


def test_a_tracked_file_matching_an_ignore_rule_is_still_included(repository: Path) -> None:
    """Tracked wins over ignored.

    This repository's own `.l9/L9_META.jsonl` is exactly this case: `.l9` is
    ignored, the manifest inside it is tracked, and dropping it would empty the
    metadata gate silently.
    """
    (repository / "residue").mkdir()
    kept = repository / "residue" / "tracked.json"
    kept.write_text("{}", encoding="utf-8")
    _git("add", "-f", "residue/tracked.json", cwd=repository)
    _git("commit", "-m", "track", cwd=repository)
    assert "residue/tracked.json" in _names(repository)


def test_enumeration_falls_back_when_git_is_unavailable(tmp_path: Path) -> None:
    """Outside a work tree, enumerate everything rather than nothing.

    Silently returning an empty set would turn every gate green for the wrong
    reason -- the failure mode this helper must never have.
    """
    (tmp_path / "loose.py").write_text("z = 3\n", encoding="utf-8")
    assert tracked_paths(tmp_path) is None
    assert "loose.py" in _names(tmp_path)


def test_this_repository_excludes_publication_gate_receipts() -> None:
    """The live case, not a synthetic one."""
    root = Path(__file__).resolve().parents[2]
    names = _names(root)
    assert ".l9/L9_META.jsonl" in names
    assert not any(name.startswith(".l9/pr/") for name in names)
    assert not any(name.startswith(".l9/autonomy/") for name in names)
