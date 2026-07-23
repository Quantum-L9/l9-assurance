# Recursive Improvement Report

## Executive improvement decision

`APPROVED_WITH_EXTERNAL_UNKNOWNS`

The repository was already functionally complete. The accepted improvements therefore target enforceability, bounded state, provenance, agent operability, and proof quality without widening the Assurance plane.

## Baseline state

- Python-authoritative runtime
- 20 JSON Schemas
- 44 Python runtime modules
- nine CLI routes
- deterministic replay and conformance
- 71 baseline behavior tests
- passing local wheel construction

## Improvement targets

1. Make L9 classification and boundary applicability machine-readable.
2. Cover every release file with deterministic L9 metadata without changing canonical protocol bytes.
3. Make replay state bounded and immutable under direct API use.
4. Eliminate duplicate release-file enumeration.
5. Ensure distribution validation exercises the candidate wheel rather than ambient source.
6. Strengthen no-stub and alignment gates.

## Accepted improvements

| ID | Improvement | Result |
|---|---|---|
| IMP-001 | Added `.l9/repo-spec.yaml` | Explicit classification, ownership, TransportPacket/Gate applicability, schema exception, and resource policy |
| IMP-002 | Added `.l9/L9_META.jsonl` and deterministic generator | Complete per-file metadata coverage without mutating protocol files |
| IMP-003 | Added bounded append-only replay store | No eviction, immutable identity bindings, fail-closed capacity |
| IMP-004 | Added `validate_l9_alignment.py` | Machine-enforced transport, Gate, schema, security, replay, and metadata rules |
| IMP-005 | Added shared repository-file primitive | Inventory, metadata, and completeness now use one file-set definition |
| IMP-006 | Hardened wheel provenance check | Candidate wheel is force-installed and import origin must be inside the isolated environment |
| IMP-007 | Added AGENTS, alignment, convergence, ADR, and traceability updates | Agents and operators can execute without reinterpretation |
| IMP-008 | Expanded behavior suite | Replay capacity, conflicts, metadata, deterministic config, and runtime isolation are covered |

## Rejected improvements

| Candidate | Decision | Reason |
|---|---|---|
| Add Gate client or TransportPacket routing | rejected | Assurance has no runtime egress; this belongs to the control plane |
| Rename public camelCase JSON fields to snake_case | rejected | Would silently break locked external contracts |
| Embed metadata into every JSON/schema file | rejected | Would alter canonical bytes or violate closed schemas |
| Add remote audit service, signing service, or database | rejected | Deferred scope and external governance are unresolved |
| Add plugin/scanner framework | rejected | Violates the narrow Assurance boundary |
| Add ruff/mypy pass claims | rejected | Executables were unavailable locally; no fake validation |

## Regression checks

- CLI routes and exit codes preserved
- schemas and protocol bundle preserved except release identity
- evidence and verdict semantics preserved
- replay fixture intentionally re-locked only for evaluator version 2.1.1
- Harness executable/artifact seam preserved
- no Node/TypeScript runtime restored
- no network, process, routing, publication, mutation, debt, or LSP authority added

## Remaining gaps

Only external Unknowns remain: production SDK trust, hosted interpreter matrix, shadow parity, approved package channel, and production signing/audit bundle.

## Updated validation status

- 13 repository gates passed
- 77 behavior tests passed
- 20 schemas passed
- replay byte identity passed
- 1,000-observation and 500-decision objectives passed
- isolated wheel installation and origin verification passed

## Final recommendation

Review and publish this source on a non-authoritative branch, run hosted CI, and gather shadow evidence before any blocking promotion.
