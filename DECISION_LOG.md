# Decision Log

## D-001: Preserve the narrow assurance plane

Accepted. Runtime migration must not restore scanners, plugins, orchestration, publication, repair, debt, or LSP responsibilities.

## D-002: Python is the authoritative runtime

Accepted for 2.1. The direct constellation siblings and consumers are Python-native. One runtime reduces toolchain, packaging, canonicalization, debugging, and supply-chain complexity.

## D-003: JSON Schema remains language-neutral authority

Accepted. Python implementation details cannot redefine the wire contract.

## D-004: Preserve CLI and artifact contracts

Accepted. Existing coordinators invoke an executable and exchange files; they do not depend on TypeScript APIs. The migration keeps those seams stable.

## D-005: No dual-authoritative implementation

Accepted. The TypeScript source remains historical in Git, not active in the release tree.

## D-006: Centralize per-file L9 metadata

Accepted. Canonical protocol artifacts cannot safely accept embedded metadata. A deterministic manifest covers every release file and is validated in CI.

## D-007: Bound replay state without eviction

Accepted. Replay detection is weakened by eviction and endangered by unbounded growth. The store is append-only, conflict-detecting, capacity-bounded, and fail-closed.

## D-008: Record Gate non-applicability explicitly

Accepted. Assurance has no runtime egress. Gate routing remains outside this repository rather than being implemented as empty scaffolding.

## D-009: Activate `l9-ci-sdk` producer trust for `>=2.0.0 <3.0.0`

Accepted for v0.1 by the release owner, resolving UNKNOWN-001.

`registry/producers.yaml` previously carried `authorization_status: pending`
with `allowed_versions: null`, so every observation the SDK can produce was
quarantined with `EVIDENCE_POLICY_INADMISSIBLE`. That was correct fail-closed
behaviour for an unreviewed producer, but it left the constellation with no
admitted finding path at all.

`allowed_versions` is set to the already-recorded `candidate_version_range`
rather than a wider expression, so a future major SDK requires a new decision.
Trust activation makes SDK observations *admissible*; it does not make
assurance authoritative over any repository's CI. Assurance remains shadow-only
downstream (UNKNOWN-003).

`fixtures/compatibility/producer-registry.pending.json` was added so the
pending-producer quarantine path keeps its coverage now that the live registry
is trusted.

## D-010: `sdkVersion` is admissible provenance on an artifact reference

Accepted. `l9-ci` unconditionally attaches `sdkVersion` to the finding-bundle
artifact it references, and assurance owns the consumer contract. The property
is added to `artifact-reference.schema.json` with a semantic-version pattern;
`unevaluatedProperties: false` is retained, so this admits one reviewed
provenance field and nothing else.

The drift was invisible because each repository validated only against its own
schemas. `tests/cross_repo/` and the `cross-repo-sdk-seam` workflow now run the
real producer against the real consumer, which is the actual fix -- the schema
property alone would leave the next drift equally silent.

