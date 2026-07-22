# Architecture

## Boundary

L9 Assurance owns protocol schemas, producer and check trust, evidence admission, declarative controls, policy resolution, waiver semantics, unknowns, deterministic verdict reduction, decisions, and conformance.

It must not own check execution, repository inspection, scanner orchestration, GitHub workflow behavior, mutation, repair planning, LSP behavior, or debt mining.

## Packages

| Package | Responsibility |
|---|---|
| `@l9/assurance-contracts` | Schema-derived protocol types and reason-code constants |
| `@l9/assurance-evidence` | Canonicalization, integrity, authorization, subject binding, replay, admission |
| `@l9/assurance-controls` | Declarative control resolution, ordering, evidence matching |
| `@l9/assurance-policy` | Policy overlays, conflicts, waiver eligibility and expiry |
| `@l9/assurance-evaluator` | Pure control evaluation and immutable decisions |
| `@l9/assurance-conformance` | Producer and consumer protocol verification |
| `@l9/assurance-cli` | Local protocol tooling and the composed engine |
| `@l9/assurance-testing` | Testing-only clocks, IDs, builders, and signers |

## Dependency law

Dependencies point toward contracts. Evidence, controls, and policy never depend on the evaluator. Production packages never depend on testing. The evaluator has no filesystem, network, process, shell, or ambient clock access.

## Decision law

1. Positive mandatory violation produces `fail`.
2. Missing or invalid mandatory knowledge produces `indeterminate`.
3. Approved active waivers may produce `conditional`.
4. Only complete mandatory satisfaction produces `pass`.

Scores are informational and cannot override hard gates.
