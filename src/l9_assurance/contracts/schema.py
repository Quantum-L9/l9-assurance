from __future__ import annotations

import json
from functools import lru_cache
from importlib.resources import as_file, files
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource


@lru_cache(maxsize=1)
def protocol_root() -> Path:
    resource = files("l9_assurance").joinpath("protocol", "release-zero")
    with as_file(resource) as path:
        return Path(path)


@lru_cache(maxsize=1)
def schema_store() -> tuple[dict[str, dict[str, Any]], Registry[Any]]:
    root = protocol_root() / "schemas" / "v1"
    schemas: dict[str, dict[str, Any]] = {}
    resources: list[tuple[str, Resource[Any]]] = []
    for path in sorted(root.glob("*.schema.json")):
        schema = json.loads(path.read_text(encoding="utf-8"))
        schema_id = schema.get("$id")
        if not isinstance(schema_id, str):
            raise RuntimeError(f"Schema lacks $id: {path}")
        schemas[path.name] = schema
        resource = Resource.from_contents(schema)
        resources.append((schema_id, resource))
        resources.append((f"https://schemas.quantum-l9.dev/assurance/v1/{path.name}", resource))
    return schemas, Registry().with_resources(resources)


def validate_instance(value: Any, schema_name: str) -> list[str]:
    schemas, registry = schema_store()
    schema = schemas.get(schema_name)
    if schema is None:
        raise KeyError(f"Unknown schema {schema_name}")
    validator = Draft202012Validator(schema, registry=registry, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(value), key=lambda error: (list(error.absolute_path), error.message))
    return [_format_error(error) for error in errors]


def require_valid_instance(value: Any, schema_name: str, label: str) -> Any:
    errors = validate_instance(value, schema_name)
    if errors:
        raise ValueError(f"{label} is invalid: {'; '.join(errors)}")
    return value


def _format_error(error: Any) -> str:
    path = "$"
    for item in error.absolute_path:
        path += f"[{item}]" if isinstance(item, int) else f".{item}"
    return f"{path}: {error.message}"
