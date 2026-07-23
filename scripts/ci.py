#!/usr/bin/env python3
from __future__ import annotations

import os
import shutil
import site
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASE = "2.1.1"

COMMANDS = [
    [sys.executable, "scripts/sync_protocol_bundle.py", "--check"],
    [sys.executable, "-m", "compileall", "-q", "src", "scripts", "tests"],
    [sys.executable, "scripts/validate_schemas.py"],
    [sys.executable, "scripts/validate_registries.py"],
    [sys.executable, "scripts/validate_boundaries.py"],
    [sys.executable, "scripts/validate_l9_alignment.py"],
    [sys.executable, "scripts/validate_fixtures.py"],
    [sys.executable, "-m", "pytest", "-q"],
    [sys.executable, "scripts/verify_replay.py"],
    [sys.executable, "scripts/benchmark.py"],
    [sys.executable, "scripts/generate_inventory.py", "--check"],
    [sys.executable, "scripts/generate_l9_meta.py", "--check"],
    [sys.executable, "scripts/validate_completeness.py"],
]


def _clean_residue() -> None:
    for name in (
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        ".ruff_cache",
        "build",
        "dist",
        "htmlcov",
    ):
        for path in ROOT.rglob(name):
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
    for path in ROOT.rglob("*.py[co]"):
        path.unlink(missing_ok=True)
    for path in ROOT.rglob("*.egg-info"):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
    for name in (".coverage",):
        (ROOT / name).unlink(missing_ok=True)


def _exercise_wheel(env: dict[str, str]) -> None:
    isolated_env = {key: value for key, value in os.environ.items() if key not in {"PYTHONPATH", "PYTHONHOME"}}
    isolated_env["PYTHONDONTWRITEBYTECODE"] = "1"
    with tempfile.TemporaryDirectory(prefix="l9-assurance-wheel-") as directory:
        workspace = Path(directory)
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "wheel",
                ".",
                "--no-deps",
                "--no-build-isolation",
                "--wheel-dir",
                directory,
            ],
            cwd=ROOT,
            env=env,
            check=True,
        )
        wheels = list(workspace.glob("*.whl"))
        if len(wheels) != 1:
            raise RuntimeError(f"Expected one wheel, found {len(wheels)}")
        wheel = wheels[0]
        print(f"Wheel built: {wheel.name}")

        venv = workspace / "venv"
        subprocess.run([sys.executable, "-m", "venv", str(venv)], check=True)
        python = venv / "bin" / "python"
        subprocess.run(
            [str(python), "-m", "pip", "install", "--force-reinstall", "--no-deps", str(wheel)],
            check=True,
            env=isolated_env,
        )

        venv_site = Path(
            subprocess.check_output(
                [str(python), "-c", "import site; print(site.getsitepackages()[0])"],
                text=True,
                env=isolated_env,
            ).strip()
        )
        approved_dependency_paths = [path for path in site.getsitepackages() if Path(path).is_dir()]
        (venv_site / "l9_assurance_approved_dependencies.pth").write_text(
            "\n".join(approved_dependency_paths) + "\n",
            encoding="utf-8",
        )

        metadata_check = (
            "from importlib.metadata import requires, version; "
            f"assert version('l9-assurance') == '{RELEASE}'; "
            "required = requires('l9-assurance') or []; "
            "assert any(item.startswith('jsonschema') for item in required); "
            "assert any(item.startswith('referencing') for item in required); "
            "assert any(item.startswith('PyYAML') for item in required)"
        )
        subprocess.run([str(python), "-c", metadata_check], check=True, env=isolated_env)
        origin_check = (
            "from pathlib import Path; import l9_assurance; "
            f"origin = Path(l9_assurance.__file__).resolve(); venv = Path({str(venv_site)!r}).resolve(); "
            "assert origin.is_relative_to(venv), (origin, venv)"
        )
        subprocess.run([str(python), "-c", origin_check], check=True, env=isolated_env)
        subprocess.run(
            [str(python), "-m", "l9_assurance", "capabilities", "--json"],
            check=True,
            stdout=subprocess.DEVNULL,
            env=isolated_env,
        )
        plan = workspace / "plan.json"
        subprocess.run(
            [
                str(python),
                "-m",
                "l9_assurance",
                "plan",
                "--profile",
                "l9.pull-request@1",
                "--subject",
                str(ROOT / "fixtures" / "valid" / "subject.json"),
                "--output",
                str(plan),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            env=isolated_env,
        )
        subprocess.run(
            [str(python), "-m", "l9_assurance", "verify-plan", "--plan", str(plan)],
            check=True,
            stdout=subprocess.DEVNULL,
            env=isolated_env,
        )
        print("Wheel installed and exercised from the isolated environment without repository checkout")


def main() -> int:
    env = {
        **os.environ,
        "PYTHONPATH": str(ROOT / "src"),
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    for index, command in enumerate(COMMANDS, start=1):
        if command[-1] == "scripts/validate_completeness.py":
            _clean_residue()
        print(f"[{index}/{len(COMMANDS)}] {' '.join(command)}", flush=True)
        subprocess.run(command, cwd=ROOT, env=env, check=True)
    _exercise_wheel(env)
    _clean_residue()
    print("L9 Assurance Python CI: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
