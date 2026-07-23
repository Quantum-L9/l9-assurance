# ADR-0003: Centralized L9 Metadata and Bounded Append-Only Replay

Status: Accepted

## Context

Canonical JSON, JSON Schema, and JSON-compatible YAML files cannot safely receive embedded comments or additional metadata fields without changing authoritative bytes or violating closed schemas. The in-memory replay store also retained immutable identities but had no explicit capacity bound.

## Decision

1. Every release file is covered by a deterministic `.l9/L9_META.jsonl` entry.
2. `.l9/repo-spec.yaml` records the repository classification, ownership boundary, transport applicability, schema-field exception, and validation gates.
3. Embedded metadata is not injected into closed protocol artifacts.
4. Replay state is append-only, rejects rebinding, never evicts, and fails closed at a configured record capacity.

## Consequences

- Metadata coverage is machine-checkable without mutating public contracts.
- File additions require regenerating the metadata manifest.
- Long-lived processes must provision replay capacity explicitly or accept the default bound.
- Capacity exhaustion is an admission failure, not a reason to discard prior replay evidence.
