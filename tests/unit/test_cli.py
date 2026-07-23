from __future__ import annotations

import json
from pathlib import Path

from l9_assurance.cli import CLI_COMMANDS, run_cli


def test_catalog_has_nine_routes() -> None:
    assert len(CLI_COMMANDS) == 9
    assert len({item["id"] for item in CLI_COMMANDS}) == 9


def test_duplicate_flag_rejected() -> None:
    errors: list[str] = []
    code = run_cli(
        ["verify", "--decision", "a", "--decision", "b"],
        stdout=lambda _: None,
        stderr=errors.append,
    )
    assert code == 40
    assert "Duplicate flag" in errors[0]


def test_capabilities_command_is_canonical() -> None:
    output: list[str] = []
    assert run_cli(["capabilities", "--json"], stdout=output.append, stderr=lambda _: None) == 0
    value = json.loads(output[0])
    assert value["assurance"]["version"] == "2.1.1"
    assert value["singleIngress"]["entrypoint"] == "l9_assurance.cli.app.run_cli"


def test_plan_and_verify_plan_commands(tmp_path: Path, subject: dict) -> None:
    subject_path = tmp_path / "subject.json"
    plan_path = tmp_path / "plan.json"
    subject_path.write_text(json.dumps(subject))
    assert (
        run_cli(
            [
                "plan",
                "--profile",
                "l9.pull-request@1",
                "--subject",
                str(subject_path),
                "--output",
                str(plan_path),
            ],
            stdout=lambda _: None,
            stderr=lambda _: None,
        )
        == 0
    )
    assert (
        run_cli(
            ["verify-plan", "--plan", str(plan_path)], stdout=lambda _: None, stderr=lambda _: None
        )
        == 0
    )
