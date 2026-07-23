from __future__ import annotations

from collections.abc import Mapping, Sequence
from copy import deepcopy
from typing import Any


class ControlResolutionError(ValueError):
    """Raised when a profile cannot resolve to a deterministic control graph."""


def resolve_profile(
    profile: Mapping[str, Any], definitions: Sequence[Mapping[str, Any]]
) -> dict[str, Any]:
    by_key = {(item["id"], item["version"]): item for item in definitions}
    selected: list[Mapping[str, Any]] = []
    for reference in profile["controls"]:
        control = by_key.get((reference["id"], reference["version"]))
        if control is None:
            raise ControlResolutionError(
                f"Missing control {reference['id']}@{reference['version']}"
            )
        selected.append(control)
    return {"profile": deepcopy(dict(profile)), "controls": order_controls(selected)}


def order_controls(controls: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    by_id: dict[str, Mapping[str, Any]] = {}
    for control in controls:
        control_id = str(control["id"])
        if control_id in by_id:
            raise ControlResolutionError(f"Duplicate control {control_id}")
        by_id[control_id] = control
    visiting: set[str] = set()
    visited: set[str] = set()
    output: list[dict[str, Any]] = []

    def visit(control: Mapping[str, Any]) -> None:
        control_id = str(control["id"])
        if control_id in visited:
            return
        if control_id in visiting:
            raise ControlResolutionError(f"Control dependency cycle at {control_id}")
        visiting.add(control_id)
        for dependency in sorted(control.get("dependencies", []), key=lambda item: item["id"]):
            target = by_id.get(dependency["id"])
            if target is None:
                raise ControlResolutionError(
                    f"Control {control_id} depends on missing {dependency['id']}"
                )
            if target["version"] != dependency["version"]:
                raise ControlResolutionError(
                    f"Control {control_id} dependency version mismatch for {dependency['id']}"
                )
            visit(target)
        visiting.remove(control_id)
        visited.add(control_id)
        output.append(deepcopy(dict(control)))

    for control in sorted(controls, key=lambda item: item["id"]):
        visit(control)
    return output
