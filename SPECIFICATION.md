# L9 Assurance Release 2.1 Specification

## Identity

```yaml
repository: Quantum-L9/l9-assurance
release: 2.1.1
runtime: Python >=3.11,<3.14
contract_authority: JSON Schema Draft 2020-12
canonicalization: l9.canonical-json/v1
operation: offline_local_first
```

## Required behavior

For an exact immutable subject, profile, and policy, Assurance MUST:

1. validate observation structure and bounded resource use;
2. authorize producer, repository, version, check, output schema, and execution status;
3. bind evidence to the exact repository revision;
4. reject stale, replayed, malformed, unauthorized, or digest-invalid evidence;
5. resolve profile controls and policy deterministically;
6. apply only authorized, active, subject-matching waivers;
7. distinguish demonstrated failure from missing knowledge;
8. emit a canonical machine-readable decision and deterministic summary;
9. verify decisions and plans independently;
10. expose producer and consumer conformance tests.

## Release-zero scope

Exactly one subject kind, one producer contract, one profile, one policy family, six producer checks, and seven controls are active.

The six producer checks are:

- `l9.repository-metadata`
- `l9.transport-packet`
- `l9.sdk-validation`
- `l9.lint`
- `l9.tests`
- `l9.mandatory-findings`

The seventh control, evidence revision consistency, is evaluated by Assurance from admitted evidence.

## CLI contract

The stable commands are:

- `capabilities --json`
- `plan`
- `verify-plan`
- `evidence admit`
- `evaluate`
- `simulate`
- `verify`
- `conformance producer`
- `conformance consumer`

Unknown commands, positional arguments, duplicate flags, missing values, and unsupported flags MUST fail closed.

## Artifact contract

- `plan` writes one canonical `assurance-plan.json`.
- `evidence admit` writes `admission-report.json` and accepted envelopes.
- `evaluate` writes `decision.json`, `decision.summary.md`, and `evidence-manifest.json`.
- `simulate` writes the same artifacts and marks the decision non-authoritative.
- Canonical JSON artifacts MUST end with one newline.

## Exit codes

| Meaning | Code |
|---|---:|
| pass | 0 |
| conditional | 10 |
| fail | 20 |
| indeterminate | 30 |
| invalid input | 40 |
| policy/profile error | 41 |
| admission error | 42 |
| signature error | 43 |
| invariant failure | 50 |

## Non-goals

Assurance MUST NOT execute checks, call GitHub, publish checks, mutate code, run repairs, own workflow state, host Gate routing, mine debt, operate an LSP, or dynamically load arbitrary plugins.

## L9 alignment contract

1. `TransportPacket` remains the only inter-node wire format in the constellation.
2. Assurance has no runtime egress, so Gate routing is explicitly `not_applicable_no_egress`.
3. `PacketEnvelope`, peer URLs, direct sibling imports, workflow state, and private node registries are forbidden.
4. Internal Python identifiers MUST use `snake_case`.
5. Locked public JSON fields retain their existing versioned names; renaming them requires a protocol major version.
6. Root protocol `.yaml` files MUST remain valid deterministic JSON-compatible YAML.
7. Every release file MUST have a corresponding `.l9/L9_META.jsonl` record.
8. Replay state MUST be append-only, bounded, non-evicting, and fail closed.
