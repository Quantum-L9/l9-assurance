# Build Manifest

## Identity

- Repository: `Quantum-L9/l9-assurance`
- Target branch: `rewrite/v2-assurance-plane`
- Release: `2.0.0`
- Legacy baseline: `af79053c5b7f9c0338edf5f1ff7253f429646cf9`
- Build mode: clean rewrite in place
- Validated source files: 207

## Active workspaces

1. `@l9/assurance-contracts`
2. `@l9/assurance-evidence`
3. `@l9/assurance-controls`
4. `@l9/assurance-policy`
5. `@l9/assurance-evaluator`
6. `@l9/assurance-conformance`
7. `@l9/assurance-cli`
8. `@l9/assurance-testing`

## Protocol inventory

- 18 strict JSON Schema Draft 2020-12 contracts
- four reproducible generated binding artifacts
- TypeScript and Python bindings
- one producer registry entry, intentionally pending
- six Release-zero check identities
- seven declarative pull-request controls
- one profile and one default policy

## Validation inventory

- 13 CI-equivalent repository gates
- 62 behavior tests across eight categories
- two dedicated replay cases rerun by the replay gate
- six valid and eight invalid structural observation fixtures
- producer and consumer conformance
- security and adversarial trust-boundary coverage
- six performance objectives
- eight workspace package dry-runs containing 180 files
- source-only clean-room CI
- two-pass source checksum convergence

## Operator artifacts

- `README.md`
- `ARCHITECTURE.md`
- `SPECIFICATION.md`
- `REWRITE_EXECUTION_SPEC.md`
- `SECURITY.md`
- `RUNBOOK.md`
- `VALIDATION.md`
- `UNKNOWN_REGISTER.md`
- `REGRESSION_GUARD.md`
- `TRACEABILITY_MAP.yaml`
- `FINAL_TREE.md`
- `validation-report.json`
- `validation-benchmark.json`
- `docs/reviews/`
