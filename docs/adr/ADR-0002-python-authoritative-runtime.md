# ADR-0002: Python-Authoritative Runtime

Status: Accepted

## Context

L9 Assurance operates inside a Python-native CI constellation. Its producer, coordinator, control plane, debt systems, and repair system use Python. Release-zero is offline, local-first, CLI/file-driven, and does not justify a separately operated service runtime.

## Decision

Use Python 3.11+ as the sole authoritative runtime. Preserve JSON Schema as language-neutral contract authority and preserve all existing CLI and artifact semantics.

## Consequences

- One runtime and package ecosystem across the constellation.
- Direct Python API use becomes possible without process boundaries.
- Canonicalization has one authoritative implementation.
- Node.js/npm are removed from build and execution requirements.
- TypeScript source remains historical only.
