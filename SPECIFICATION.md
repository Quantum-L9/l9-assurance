# L9 Assurance 2.0.1 Protocol Specification

## Status

```yaml
repository: Quantum-L9/l9-assurance
release: 2.0.1
baseline_commit: be8100797cae30eeca31763ea74c5f7eca7bde82
plan_schema: l9.assurance-plan@1.0.0
canonicalization: l9.canonical-json/v1
protocol_bundle_digest: 46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a
authority_promotion: NO_GO
```

## Normative ownership

Assurance is the trust, control-evaluation, and decision plane. It admits observations produced elsewhere, resolves declarative controls and policy, and emits deterministic decisions. It never executes repository checks, orchestrates CI, publishes platform status, or mutates repositories.

## Assurance plan

A valid plan MUST:

- validate against `schemas/v1/assurance-plan.schema.json`;
- identify `schema` as `l9.assurance-plan` and `schemaVersion` as `1.0.0`;
- bind one exact `git-revision` subject;
- bind the selected profile and policy by identity and SHA-256 digest;
- bind the embedded protocol bundle digest;
- list every resolved control and full evidence requirement;
- list versioned required producers and checks;
- include exact-revision, accepted-status, freshness, cardinality, and configuration-digest requirements where applicable;
- include source digests and waiver rules;
- include a canonical `planDigest` and derived `planId`;
- pass `verifyPlan` before use.

Any mismatch is an input failure. Harness MUST preserve the plan bytes or canonical JSON value and MUST NOT invent missing plan semantics.

## Embedded protocol bundle

The CLI package MUST include `protocol/release-zero/manifest.json` and all manifest-listed authority files. Loading MUST fail closed when a file is absent, changed, escapes the bundle root, or the aggregate digest differs. `npm run check:protocol` proves derivation drift; `npm run validate:distribution` proves standalone installation.

## Canonicalization

`l9.canonical-json/v1` is authoritative for digests. TypeScript and generated Python bindings MUST pass every vector in `fixtures/conformance/canonicalization-v1.json`, including negative zero, exponent normalization, fixed/scientific thresholds, Unicode ordering, control escapes, and nested ordering. Standard library JSON defaults are not authority.

## Producer conformance

Public producer conformance MUST execute registry-aware evidence admission. Structural validity alone is insufficient. Conformance evaluates producer identity, version authorization, check authorization, output schema, subject and revision binding, accepted execution status, configuration digest, integrity, freshness, replay, duplicates, and reason codes.

## Artifact layout

```text
artifacts/
├── observations/
├── supporting/
├── admission/
│   ├── admission-report.json
│   └── accepted/<evidence-id>.json
└── assurance/
    ├── decision.json
    ├── decision.summary.md
    └── evidence-manifest.json
```

## Compatibility

- Assurance package version: `2.0.1`
- Plan schema: `1.0.0`
- Evidence and decision schemas: `1.0.0`
- Profile: `l9.pull-request@1.0.0`
- Canonicalization: `l9.canonical-json/v1`
- Protocol bundle digest: `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`

Any change to these identities requires explicit compatibility review and regenerated conformance evidence.
