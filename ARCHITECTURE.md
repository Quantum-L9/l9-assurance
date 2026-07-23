# Architecture

## System role

L9 Assurance is a Python SDK and CLI inside the Quantum-L9 CI constellation. It converts already-produced observations into defensible assurance decisions. It is not a workflow engine or execution chassis.

## Constellation split

```text
l9-ci-core                  orchestrates hosted CI and publishes decisions
l9-ci-sdk                   executes checks and emits observations
l9-harness                  coordinates local runs, replay, and comparison
l9-ci-debt-resolver         diagnoses failed controls and selects repair strategy
PR_Repair                   performs governed mutation
l9-ci-debt-intelligence     learns from historical failures
l9-ci-debt-lsp              presents approved prevention rules
l9-assurance                admits evidence, evaluates controls, issues decisions
```

The invariant is:

```text
Execution systems observe.
Coordination systems sequence.
Repair systems mutate.
Intelligence systems learn.
Control-plane systems publish.
Assurance verifies and decides.
```

## Runtime modules

| Module | Responsibility |
|---|---|
| `l9_assurance.contracts` | Generated protocol types, strict time parsing, JSON Schema validation |
| `l9_assurance.evidence` | Canonical JSON, digests, limits, discovery, admission, replay, subject binding |
| `l9_assurance.controls` | Control/profile parsing, dependency resolution, pure control assessment |
| `l9_assurance.policy` | Policy parsing, overlays, waiver authorization and expiry |
| `l9_assurance.evaluator` | Pure decision construction, summary projection, verification |
| `l9_assurance.conformance` | Producer admission and consumer byte-preservation verification |
| `l9_assurance.cli` | Single fail-closed CLI ingress and composed engine |
| `l9_assurance.testing` | Test-only builders, deterministic clocks/IDs, test signer |

## Dependency law

Dependencies point inward toward contracts and pure primitives:

```text
contracts
  <- evidence
  <- controls
  <- policy
  <- evaluator
  <- conformance
  <- cli

testing -> public contracts only
```

The evaluator MUST NOT import filesystem, process, socket, HTTP, or ambient environment APIs. The CLI is the only operator-facing composition boundary.

## Protocol authority

Root `schemas/`, `controls/`, `profiles/`, and `registry/` are authoritative. `scripts/sync_protocol_bundle.py` creates the embedded package bundle and a digest manifest. CI fails when the embedded bundle differs from root authority.

JSON Schema remains language-neutral even though Python is the authoritative runtime.

## Decision law

1. A positive mandatory violation yields `fail`.
2. Missing, malformed, stale, unauthorized, or otherwise unestablished mandatory knowledge yields `indeterminate` unless policy explicitly converts it to failure.
3. An authorized active waiver may convert a waivable failure to `conditional`.
4. Only complete mandatory satisfaction yields `pass`.
5. Scores and dimensions are informational and cannot override hard-gate verdicts.

## State and side effects

- Evaluation is pure and deterministic for explicit inputs.
- Replay state is injected and bounded.
- Filesystem access is restricted to the CLI/configuration boundary.
- No network access is required or permitted by the runtime.
- Decisions are immutable after issuance; a later decision references `supersedes`.

## Transport and Gate applicability

Assurance does not perform inter-node routing and therefore does not own Gate egress or workflow state. When TransportPacket evidence is evaluated, it is an observation subject to the same admission and control laws. `PacketEnvelope` is forbidden.

## Repository governance

`.l9/repo-spec.yaml` records the Assurance-plane classification, owned and forbidden responsibilities, TransportPacket/Gate applicability, canonical field-style exception, deterministic YAML subset, replay limits, and required gates.

Every release file is represented in `.l9/L9_META.jsonl`. Centralized metadata is required because adding fields or comments to canonical JSON, JSON Schema, and JSON-compatible YAML would change public bytes or violate closed contracts.

## Replay state law

Replay state is append-only and immutable. The in-memory implementation has a configurable positive capacity, defaults to 100,000 records, never evicts prior records, treats exact repeated records as idempotent, rejects identity rebinding, and fails closed when capacity is exhausted.
