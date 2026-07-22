# ADR-0001: Clean Rewrite In Place

Status: Accepted

## Decision

Rebuild `Quantum-L9/l9-assurance` on `rewrite/v2-assurance-plane`, preserve repository identity, release as `2.0.0`, and intentionally break the legacy runtime API.

## Rationale

The retained trust-plane responsibility is materially smaller than the legacy 52-workspace testing platform. Incremental migration would preserve execution, plugin, scanner, orchestration, and scoring authority inside assurance.

## Consequences

- No compatibility facade.
- Legacy source remains in Git history.
- Only protocol, evidence, controls, policy, evaluator, conformance, CLI, and testing workspaces are active.
- Future ports are invariant-by-invariant and require boundary proof.
