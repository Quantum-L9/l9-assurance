from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from l9_assurance.cli.config import embedded_protocol_root, load_configuration


def test_embedded_bundle_tamper_rejected(tmp_path: Path) -> None:
    target = tmp_path / "protocol"
    shutil.copytree(embedded_protocol_root(), target)
    path = target / "registry" / "checks.yaml"
    path.write_text(path.read_text() + "\n")
    with pytest.raises(ValueError, match="digest mismatch"):
        load_configuration(target)


def test_manifest_path_escape_rejected(tmp_path: Path) -> None:
    target = tmp_path / "protocol"
    shutil.copytree(embedded_protocol_root(), target)
    manifest_path = target / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["files"][0]["path"] = "../escape.json"
    manifest_path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match="escapes bundle"):
        load_configuration(target)
