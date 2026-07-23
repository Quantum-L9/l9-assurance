from __future__ import annotations

from pathlib import Path

import pytest

from l9_assurance.evidence import discover_json_artifacts


def test_symlink_discovery_fails_closed(tmp_path: Path) -> None:
    target = tmp_path / "target.json"
    target.write_text("{}")
    link = tmp_path / "link.json"
    try:
        link.symlink_to(target)
    except OSError:
        pytest.skip("symlinks unavailable")
    with pytest.raises(ValueError, match="symbolic link"):
        discover_json_artifacts(link)


def test_non_json_single_file_rejected(tmp_path: Path) -> None:
    path = tmp_path / "value.txt"
    path.write_text("{}")
    with pytest.raises(ValueError, match="MEDIA_TYPE"):
        discover_json_artifacts(path)
