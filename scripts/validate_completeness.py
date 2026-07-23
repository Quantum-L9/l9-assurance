#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ast
import json
import re
import sys
import tomllib
from pathlib import Path
from urllib.parse import unquote

from repository_files import ARCHIVE_SUFFIXES, EXCLUDED_DIRS, repository_files

ROOT = Path(__file__).resolve().parents[1]
RELEASE = "2.1.1"
REQUIRED = [
    ".l9/repo-spec.yaml",
    ".l9/L9_META.jsonl",
    "AGENTS.md",
    "README.md",
    "ARCHITECTURE.md",
    "SPECIFICATION.md",
    "REWRITE_EXECUTION_SPEC.md",
    "RUNBOOK.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "MANIFEST.md",
    "VALIDATION.md",
    "UNKNOWN_REGISTER.md",
    "REGRESSION_GUARD.md",
    "TRACEABILITY_MAP.yaml",
    "PROVENANCE_MAP.yaml",
    "DECISION_LOG.md",
    "ALIGNMENT_REPORT.md",
    "IMPROVEMENT_REPORT.md",
    "DELTA_REPORT.md",
    "CONVERGENCE_REPORT.yaml",
    "FINAL_TREE.md",
    "pyproject.toml",
]
MARKERS = re.compile(
    r"\b(?:TODO|FIXME|XXX|HACK|NotImplemented)\b|"
    r"throw new Error\(['\"]Not implemented",
    re.IGNORECASE,
)
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")


def _validate_markdown_links(failures: list[str]) -> None:
    for document in ROOT.rglob("*.md"):
        relative = document.relative_to(ROOT)
        if any(part in EXCLUDED_DIRS for part in relative.parts):
            continue
        for raw_target in MARKDOWN_LINK.findall(document.read_text(encoding="utf-8")):
            target = raw_target.strip().split(maxsplit=1)[0].strip("<>")
            if not target or target.startswith(("#", "http://", "https://", "mailto:")):
                continue
            local = unquote(target.split("#", 1)[0])
            if not (document.parent / local).resolve().exists():
                failures.append(f"Broken Markdown link in {relative}: {target}")


def _validate_python_stubs(failures: list[str]) -> None:
    for path in sorted(list((ROOT / "src").rglob("*.py")) + list((ROOT / "scripts").glob("*.py"))):
        relative = path.relative_to(ROOT)
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as error:
            failures.append(f"Python syntax error in {relative}: {error}")
            continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                body = _without_docstring(node.body)
                if len(body) == 1 and isinstance(body[0], ast.Pass):
                    failures.append(
                        f"Pass-only function stub in {relative}:{node.lineno} {node.name}"
                    )
                if (
                    len(body) == 1
                    and isinstance(body[0], ast.Expr)
                    and isinstance(body[0].value, ast.Constant)
                    and body[0].value.value is Ellipsis
                ):
                    failures.append(
                        f"Ellipsis function stub in {relative}:{node.lineno} {node.name}"
                    )
                if (
                    len(body) == 1
                    and isinstance(body[0], ast.Raise)
                    and _raises_not_implemented(body[0])
                ):
                    failures.append(
                        f"NotImplemented function stub in {relative}:{node.lineno} {node.name}"
                    )
            elif isinstance(node, ast.ClassDef):
                body = _without_docstring(node.body)
                if len(body) == 1 and (
                    isinstance(body[0], ast.Pass)
                    or (
                        isinstance(body[0], ast.Expr)
                        and isinstance(body[0].value, ast.Constant)
                        and body[0].value.value is Ellipsis
                    )
                ):
                    failures.append(f"Scaffold-only class in {relative}:{node.lineno} {node.name}")


def _without_docstring(body: list[ast.stmt]) -> list[ast.stmt]:
    if (
        body
        and isinstance(body[0], ast.Expr)
        and isinstance(body[0].value, ast.Constant)
        and isinstance(body[0].value.value, str)
    ):
        return body[1:]
    return body


def _raises_not_implemented(node: ast.Raise) -> bool:
    value = node.exc
    if isinstance(value, ast.Name):
        return value.id == "NotImplementedError"
    if isinstance(value, ast.Call) and isinstance(value.func, ast.Name):
        return value.func.id == "NotImplementedError"
    return False


def build_report() -> tuple[dict[str, object], list[str]]:
    failures: list[str] = []
    for name in REQUIRED:
        path = ROOT / name
        if not path.is_file() or path.stat().st_size == 0:
            failures.append(f"Missing required file: {name}")

    source = sorted((ROOT / "src" / "l9_assurance").rglob("*.py"))
    if len(source) < 30:
        failures.append(f"Expected at least 30 Python source files, found {len(source)}")

    node_residue = (
        list(ROOT.rglob("*.ts"))
        + list(ROOT.rglob("*.tsx"))
        + list(ROOT.rglob("*.js"))
        + list(ROOT.rglob("*.mjs"))
        + list(ROOT.rglob("*.cjs"))
    )
    if node_residue or (ROOT / "package.json").exists() or (ROOT / "package-lock.json").exists():
        failures.append("Node/TypeScript runtime residue remains")

    executable_files = source + list((ROOT / "scripts").glob("*.py"))
    for path in executable_files:
        if path.name == "validate_completeness.py":
            continue
        match = MARKERS.search(path.read_text(encoding="utf-8"))
        if match:
            failures.append(f"Unfinished marker in {path.relative_to(ROOT)}: {match.group(0)}")

    _validate_python_stubs(failures)

    runtime_artifacts = frozenset(
        {".git", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".venv"}
    )
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if any(part in runtime_artifacts or part.endswith(".egg-info") for part in relative.parts):
            continue
        if path.is_dir() and (path.name in EXCLUDED_DIRS or path.name.endswith(".egg-info")):
            failures.append(f"Build residue present: {relative}")
        if path.is_file() and (path.suffix in {".pyc", ".pyo"} or path.suffix in ARCHIVE_SUFFIXES):
            failures.append(f"Generated or nested archive residue present: {relative}")

    _validate_markdown_links(failures)

    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    version = pyproject.get("project", {}).get("version")
    if version != RELEASE:
        failures.append(f"pyproject release version is not {RELEASE}")
    constants = (ROOT / "src" / "l9_assurance" / "constants.py").read_text(encoding="utf-8")
    if f'ASSURANCE_VERSION = "{RELEASE}"' not in constants:
        failures.append(f"runtime release version is not {RELEASE}")

    release_files = repository_files(ROOT)
    report: dict[str, object] = {
        "status": "fail" if failures else "pass",
        "runtime": "python",
        "release": RELEASE,
        "releaseFiles": len(release_files),
        "sourceFiles": len(source),
        "schemas": len(list((ROOT / "schemas" / "v1").glob("*.json"))),
        "testModules": len(list((ROOT / "tests").rglob("test_*.py"))),
        "failures": failures,
    }
    return report, failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate source-tree completeness.")
    parser.add_argument("--output", type=Path, help="Optional report destination.")
    args = parser.parse_args()

    report, failures = build_report()
    text = json.dumps(report, indent=2) + "\n"
    if args.output is not None:
        destination = args.output if args.output.is_absolute() else ROOT / args.output
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding="utf-8")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
