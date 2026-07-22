# Assurance and Harness Alignment Report

## Decision

`ALIGNED_WITH_EXTERNAL_UNKNOWNS`

The five contract gaps identified by the architect audit are resolved in Assurance `2.0.1` and the Harness specification is revised to `1.3.0`.

## Resolved seams

1. Plan handshake: strict `l9.assurance-plan@1.0.0`, full requirements, source digests, protocol digest, and verification.
2. CLI distribution: embedded 37-file protocol bundle, digest `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`, clean offline installation proof.
3. Canonicalization: `l9.canonical-json/v1` shared TypeScript/Python authority vectors.
4. Artifact layout: admission under `artifacts/admission/`, decision outputs under `artifacts/assurance/`.
5. Producer conformance: registry-aware evidence admission and reason-code verification.

## Preserved boundaries

- Harness does not admit evidence or issue verdicts.
- Assurance does not execute checks, own Harness run state, or publish CI status.
- Harness invocation metadata does not mutate canonical Assurance decisions.
- CI Core remains the publication authority.

## External Unknowns

- Actual Harness repository and baseline commit are unavailable.
- SDK invocation, capability manifest, trusted version, and build identity remain unresolved.
- Hosted CI and shadow-mode evidence remain unresolved.

These Unknowns block production adapter and authority-promotion claims, not Phase 0/1 Harness implementation against the locked spec.
