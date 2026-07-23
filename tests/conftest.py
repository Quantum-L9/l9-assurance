from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest

from l9_assurance.cli import AssuranceEngine, load_configuration

REPO = Path(__file__).resolve().parents[1]


def load_json(relative: str) -> Any:
    return json.loads((REPO / relative).read_text(encoding="utf-8"))


@pytest.fixture
def subject() -> dict[str, Any]:
    return load_json("fixtures/valid/subject.json")


@pytest.fixture
def trusted_config() -> dict[str, Any]:
    config = load_configuration()
    config["producerRegistry"] = load_json("fixtures/compatibility/producer-registry.trusted.json")
    config["checkRegistry"] = load_json("fixtures/compatibility/check-registry.json")
    return config


@pytest.fixture
def engine(trusted_config: dict[str, Any]) -> AssuranceEngine:
    return AssuranceEngine(trusted_config, clock=lambda: "2026-07-21T00:00:02.000Z")


@pytest.fixture
def valid_observations() -> list[dict[str, Any]]:
    names = [
        "repository-metadata.observation.json",
        "transport-packet.observation.json",
        "sdk-validation.observation.json",
        "lint.observation.json",
        "tests.observation.json",
        "mandatory-findings.observation.json",
    ]
    return [load_json(f"fixtures/valid/{name}") for name in names]


@pytest.fixture
def accepted(
    engine: AssuranceEngine, subject: dict[str, Any], valid_observations: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    report = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02.000Z")
    assert report["rejectedCount"] == 0
    return deepcopy(report["accepted"])
