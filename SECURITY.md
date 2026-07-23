# Security

## Trust boundary

All observations, evidence envelopes, waivers, decisions, configuration roots, and transported artifacts are untrusted until validated.

## Required controls

- JSON discovery is bounded by count and file size.
- Symbolic links and path escapes are rejected.
- JSON depth, string size, findings count, lineage depth, and extension namespaces are bounded.
- Producer repository, version, subject kinds, and checks are registry-authorized.
- Evidence is exact-revision-bound and digest-verified.
- Timestamps require strict RFC3339 instants with known offsets.
- Replay and duplicate fingerprints are deterministic.
- Test signing algorithms are rejected by production verification.
- The embedded protocol bundle is checked against per-file and aggregate digests.
- The evaluator has no network, process, filesystem, or ambient-clock access.

## Dependency policy

Runtime dependencies are limited to JSON Schema validation and safe YAML parsing. New dependencies require security and architecture review.

## Prohibited behavior

Do not add `eval`, `exec`, arbitrary shell execution, network clients, dynamic plugins, GitHub credentials, repository mutation, scanner execution, or PII logging.

Report security issues privately to the repository owners. Do not include secrets or exploit details in public issues.

## Replay and metadata integrity

Replay records are immutable identity bindings. Rebinding an observation ID or fingerprint is rejected, exact duplicate records are idempotent, and the store fails closed at capacity rather than evicting evidence.

L9 file metadata is centralized in `.l9/L9_META.jsonl`. The metadata manifest is deterministic and must cover every release file. Canonical protocol artifacts are not modified to carry embedded metadata because doing so would alter signed or digest-bound bytes.
