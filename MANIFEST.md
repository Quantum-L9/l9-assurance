# Manifest

## Repository identity

```yaml
repository: Quantum-L9/l9-assurance
release: 2.1.1
runtime: python
package: l9-assurance
console_script: l9-assurance
contract_authority: schemas/v1
```

## Responsibility map

| Path | Responsibility |
|---|---|
| `src/l9_assurance/contracts/` | Schema projections, strict timestamps, schema validation |
| `src/l9_assurance/evidence/` | Canonicalization, bounds, discovery, admission, replay |
| `src/l9_assurance/controls/` | Control/profile parsing and assessment |
| `src/l9_assurance/policy/` | Policy, overlays, waivers |
| `src/l9_assurance/evaluator/` | Decision construction, summary, verification |
| `src/l9_assurance/conformance/` | Producer and consumer conformance |
| `src/l9_assurance/cli/` | Single executable ingress and composed engine |
| `src/l9_assurance/testing/` | Test-only helpers and signer |
| `src/l9_assurance/protocol/release-zero/` | Digest-verified installable protocol bundle |
| `schemas/`, `controls/`, `profiles/`, `registry/` | Root protocol authority |
| `fixtures/` | Positive, negative, adversarial, replay, compatibility, conformance cases |
| `tests/` | Eight validation categories |
| `scripts/` | Deterministic repository and distribution gates |
| `docs/` | ADRs and operator/protocol documentation |

## Exclusions

The release tree excludes Node.js/npm runtime files, build output, dependencies, caches, Git metadata, secrets, scanner execution, orchestration, publication, mutation, repair, debt, and LSP implementation.

## Governance and alignment surfaces

| Path | Responsibility |
|---|---|
| `.l9/repo-spec.yaml` | Machine-readable repository identity, classification, ownership, applicability, and resource policy |
| `.l9/L9_META.jsonl` | Deterministic per-file metadata coverage |
| `AGENTS.md` | Agent authority order, boundaries, workflow, and stop conditions |
| `ALIGNMENT_REPORT.md` | Recursive L9 alignment decision and applicability evidence |
| `CONVERGENCE_REPORT.yaml` | Machine-readable fixed-point result |
| `scripts/validate_l9_alignment.py` | Executable L9 boundary and metadata gate |
| `scripts/repository_files.py` | Shared deterministic release-file inventory primitive |
