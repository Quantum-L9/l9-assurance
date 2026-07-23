from __future__ import annotations

import ast
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "src" / "l9_assurance"


def test_python_is_authoritative_runtime() -> None:
    assert (REPO / "pyproject.toml").is_file()
    assert not (REPO / "package.json").exists()
    assert not list(SRC.rglob("*.ts"))
    assert len(list(SRC.rglob("*.py"))) >= 30


def test_evaluator_has_no_io_or_process_imports() -> None:
    forbidden = {"socket", "subprocess", "requests", "httpx", "urllib", "pathlib", "os"}
    for path in (SRC / "evaluator").glob("*.py"):
        tree = ast.parse(path.read_text())
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        assert not imports & forbidden, (path, imports & forbidden)


def test_no_legacy_execution_packages() -> None:
    forbidden = {"plugins", "scanners", "github", "repair", "lsp", "debt"}
    assert not {path.name for path in SRC.iterdir()} & forbidden


def test_no_packet_envelope_reference() -> None:
    for path in list(SRC.rglob("*.py")) + list((REPO / "schemas").rglob("*.json")):
        assert "PacketEnvelope" not in path.read_text(encoding="utf-8")
