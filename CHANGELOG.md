# Changelog

## 2.1.1 - Unreleased

- Added centralized per-file L9 metadata and a machine-enforced repository specification.
- Added an agent operating contract, recursive alignment report, and convergence record.
- Made replay state bounded, append-only, conflict-detecting, and fail-closed at capacity.
- Added a dedicated L9 alignment gate covering transport applicability, Gate boundaries, deterministic config parsing, runtime isolation, and metadata coverage.
- Hardened isolated wheel validation to prove the installed package is loaded from the clean environment rather than an ambient installation.
- Deduplicated repository file enumeration across inventory, metadata, and completeness gates.

## 2.1.0 - Unreleased

- Migrated the authoritative runtime from TypeScript/npm to Python 3.11+.
- Preserved JSON Schema authority, canonicalization, CLI routes, evidence semantics, controls, policies, verdicts, and artifact formats.
- Added one installable Python distribution and console entry point.
- Embedded and digest-verified the Release-zero protocol bundle in the wheel.
- Added strict Python behavior, architecture, conformance, replay, security, and performance tests.
- Removed Node.js, npm workspaces, JavaScript build tooling, and duplicate runtime-language governance.
- Added ADR-0002 and a Python-authoritative migration specification.

## 2.0.1

- Hardened the TypeScript reference implementation before migration.

## 2.0.0

- Clean rewrite of the legacy broad assurance/testing platform as a narrow trust plane.
