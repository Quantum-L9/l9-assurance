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
