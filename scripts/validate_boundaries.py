#!/usr/bin/env python3
from __future__ import annotations

import ast
import sys
from pathlib import Path

from repository_files import repository_files

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "l9_assurance"
FORBIDDEN_RUNTIME_DIRS = {"plugins", "scanners", "repair", "lsp", "debt", "github", "orchestration"}
EVALUATOR_FORBIDDEN_IMPORTS = {
    "os",
    "pathlib",
    "socket",
    "subprocess",
    "urllib",
    "http",
    "requests",
    "httpx",
}
GLOBAL_FORBIDDEN_CALLS = {"eval", "exec", "compile"}
NODE_SUFFIXES = frozenset({".ts", ".js"})


def main() -> int:
    failures: list[str] = []
    # Scan the repository's own files, not the whole working tree. This check
    # asserts that *this repository* ships no TypeScript/Node runtime, so a .js
    # file vendored inside an installed dependency is not evidence of one.
    # A bare ROOT.rglob() failed the moment a virtualenv existed at the
    # repository root, because coverage ships coverage_html.js.
    node_artifacts = [path for path in repository_files(ROOT) if path.suffix in NODE_SUFFIXES]
    if (ROOT / "package.json").exists() or node_artifacts:
        detail = ", ".join(path.as_posix() for path in node_artifacts[:5])
        failures.append(
            "TypeScript/Node runtime artifacts remain" + (f": {detail}" if detail else "")
        )
    if {path.name for path in SRC.iterdir() if path.is_dir()} & FORBIDDEN_RUNTIME_DIRS:
        failures.append("Forbidden runtime responsibility directory exists")
    for path in SRC.rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        if "PacketEnvelope" in text:
            failures.append(f"Deprecated PacketEnvelope reference: {path.relative_to(ROOT)}")
        tree = ast.parse(text, filename=str(path))
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
            elif (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id in GLOBAL_FORBIDDEN_CALLS
            ):
                failures.append(f"Forbidden dynamic execution in {path.relative_to(ROOT)}")
        if "evaluator" in path.parts and imports & EVALUATOR_FORBIDDEN_IMPORTS:
            failures.append(
                f"Evaluator I/O import in {path.relative_to(ROOT)}: {sorted(imports & EVALUATOR_FORBIDDEN_IMPORTS)}"
            )
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(
        "Architecture boundaries valid: Python authoritative, offline evaluator, no legacy execution authority"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
