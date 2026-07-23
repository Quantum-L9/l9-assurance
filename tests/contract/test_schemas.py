from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator

from l9_assurance.cli import AssuranceEngine, describe_capabilities, load_configuration, verify_plan
from l9_assurance.contracts.schema import schema_store, validate_instance


def test_all_schemas_are_draft_2020_12() -> None:
    schemas, _ = schema_store()
    assert len(schemas) == 20
    for schema in schemas.values():
        Draft202012Validator.check_schema(schema)


def test_capabilities_validate() -> None:
    capabilities = describe_capabilities(load_configuration())
    assert validate_instance(capabilities, "assurance-capabilities.schema.json") == []


def test_plan_validates_and_verifies(subject: dict) -> None:
    plan = AssuranceEngine(load_configuration()).plan(subject)
    assert validate_instance(plan, "assurance-plan.schema.json") == []
    assert verify_plan(plan)["valid"] is True


def test_plan_tamper_is_rejected(subject: dict) -> None:
    plan = AssuranceEngine(load_configuration()).plan(subject)
    plan["controls"][0]["severity"] = "advisory"
    report = verify_plan(plan)
    assert report["valid"] is False
    assert "Plan digest mismatch." in report["reasons"]


def test_root_and_embedded_schema_sets_match() -> None:
    repo = Path(__file__).resolve().parents[2]
    root = repo / "schemas" / "v1"
    embedded = repo / "src" / "l9_assurance" / "protocol" / "release-zero" / "schemas" / "v1"
    assert {p.name: p.read_bytes() for p in root.glob("*.json")} == {p.name: p.read_bytes() for p in embedded.glob("*.json")}
