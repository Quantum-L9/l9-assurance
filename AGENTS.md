# Agent Operating Contract

## Mission

Modify this repository only when the change strengthens the narrow Assurance plane: protocol authority, evidence admission, declarative control evaluation, deterministic decisions, verification, or conformance.

## Authority order

1. Latest explicit user instruction
2. `.l9/repo-spec.yaml`
3. `REWRITE_EXECUTION_SPEC.md`
4. JSON Schemas in `schemas/v1/`
5. Registries, profiles, policies, and controls
6. Accepted ADRs and `DECISION_LOG.md`
7. Behavior, replay, security, and conformance tests
8. Supporting documentation
9. Inference, labeled `Unknown`

## Hard boundaries

Agents MUST NOT add repository scanners, check execution, CI orchestration, Gate routing, GitHub publication, mutation, repair logic, debt intelligence, LSP behavior, network clients, shell execution, dynamic plugin loading, or ambient evaluator state.

`TransportPacket` is the constellation wire format. This repository has no runtime egress, so Gate routing is not implemented here. `PacketEnvelope` is forbidden.

## Change workflow

1. Inspect the relevant schema, runtime module, tests, and documentation before editing.
2. Change canonical root protocol files before changing embedded protocol assets.
3. Run `python scripts/sync_protocol_bundle.py --write` after protocol-authority changes.
4. Add behavior tests for every changed failure mode or contract.
5. Run `python scripts/generate_inventory.py --write` after changing the file tree.
6. Run `python scripts/generate_l9_meta.py --write` after changing the file tree or release identity.
7. Run `python scripts/ci.py` before declaring completion.
8. Record unresolved external facts in `UNKNOWN_REGISTER.md`; never invent them.

## Stop conditions

Stop and report the exact blocker when a change would:

- alter a public schema or CLI contract without explicit authorization;
- introduce a second authoritative implementation;
- require network access or credentials;
- move orchestration, publication, mutation, or routing into Assurance;
- weaken replay, subject binding, producer authorization, or verdict semantics;
- produce validation claims that were not executed.

## Definition of complete

A change is complete only when source intent is preserved, the full CI ladder passes, replay remains byte-identical or is intentionally re-locked with evidence, L9 metadata covers every release file, and a second review pass finds no material improvement within scope.
