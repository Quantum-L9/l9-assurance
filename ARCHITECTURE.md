# Architecture

## Boundary

L9 Assurance owns protocol schemas, producer and check trust, evidence admission, declarative controls, policy resolution, waiver semantics, unknowns, deterministic verdict reduction, decisions, and conformance.

It must not own check execution, repository inspection, scanner orchestration, GitHub workflow behavior, mutation, repair planning, LSP behavior, debt mining, Harness run state, or CI publication.

## Packages

| Package | Responsibility |
|---|---|
| `@l9/assurance-contracts` | Schema-derived protocol types and stable reason codes |
| `@l9/assurance-evidence` | Canonicalization, integrity, authorization, subject binding, replay, admission |
| `@l9/assurance-controls` | Declarative control resolution, ordering, evidence matching |
| `@l9/assurance-policy` | Policy overlays, conflicts, waiver eligibility and expiry |
| `@l9/assurance-evaluator` | Pure control evaluation and immutable decisions |
| `@l9/assurance-conformance` | Registry-aware producer and consumer protocol verification |
| `@l9/assurance-cli` | Offline protocol tooling, composed engine, and embedded Release-zero bundle |
| `@l9/assurance-testing` | Testing-only clocks, IDs, builders, and signers |

## Dependency law

Dependencies point toward contracts. Evidence, controls, and policy never depend on the evaluator. Production packages never depend on testing. The evaluator has no filesystem, network, process, shell, or ambient clock access.

The CLI may depend on conformance because it is the operator adapter. Its embedded protocol files are a generated distribution copy, not a second authority. `scripts/sync-protocol-bundle.mjs` derives them from root schemas, registries, controls, profile, policy, and fixtures; the manifest binds every file and the aggregate bundle digest `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`.

## Plan handshake

`AssuranceEngine.plan()` produces `l9.assurance-plan@1.0.0`. The plan contains exact subject identity, profile and policy digests, protocol digest, complete control requirements, versioned producer and check requirements, waiver rules, source digests, and a canonical plan digest. Harness may execute from the plan but must not reinterpret or mutate it.

## Decision law

1. Positive mandatory violation produces `fail`.
2. Missing or invalid mandatory knowledge produces `indeterminate`.
3. Approved active waivers may produce `conditional`.
4. Only complete mandatory satisfaction produces `pass`.

Scores are informational and cannot override hard gates.

## Harness seam

Harness owns invocation records, local run state, artifact layout, replay orchestration, and shadow comparisons. Fields such as `initiated_by`, `mode`, and `publication_authority` belong to Harness records and must never be inserted into Assurance decisions. Admission artifacts live under `artifacts/admission/`; canonical decisions live under `artifacts/assurance/`.
