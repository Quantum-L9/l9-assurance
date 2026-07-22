# Validation

## Decision

**APPROVED_WITH_EXTERNAL_UNKNOWNS**

Release 2.0.1 is complete for review, Harness integration against the locked seam, and shadow-mode execution. Production authority promotion remains `NO_GO` because SDK trust, hosted execution, and shadow-mode reliability require external evidence.

## Executed validation

| Check | Result | Evidence |
|---|---|---|
| Generated binding drift | PASS | `npm run check:generated` |
| Embedded protocol drift and integrity | PASS | 37 authority files; aggregate digest `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a` |
| Formatting and source hygiene | PASS | `npm run format:check`; `npm run lint` |
| JSON Schema contracts | PASS | 19 Draft 2020-12 schemas, including assurance plan |
| Trust registries | PASS | one producer, six checks, seven controls, one profile |
| Package boundaries and evaluator purity | PASS | eight-workspace boundary validator |
| Structural fixtures | PASS | six valid and eight invalid observation fixtures |
| Plan schema and digest | PASS | schema validator, `verifyPlan`, and CLI `verify-plan` |
| Canonicalization parity | PASS | TypeScript/Python `l9.canonical-json/v1` vectors |
| Producer conformance | PASS | registry-aware admission through public CLI |
| Build evidence and completeness | PASS | inventory, benchmark, Unknown register, unfinished-marker, and archive gates |
| TypeScript typecheck and build | PASS | all eight workspaces |
| Standalone distribution | PASS | offline local-tarball install without repository checkout |
| Behavior suite | PASS | 67 tests across eight categories |
| Deterministic replay | PASS | two replay cases rerun independently |
| Performance benchmark | PASS | all six objectives below threshold |
| Workspace package dry-run | PASS | eight packages, 218 packed files |
| Source-only clean-room CI | PASS | all 15 CI commands rebuilt without retained output |

## Artifact layout validation

Admission output is restricted to `artifacts/admission/`. Canonical decisions and projections are restricted to `artifacts/assurance/`. Harness invocation fields are not part of Assurance decision schemas.

## Integrity method

The clean-room copy excludes `node_modules`, `dist`, `.tmp`, Git metadata, bytecode, caches, and previous logs. It rebuilds all workspaces, validates the embedded protocol manifest, installs local workspace tarballs into a clean offline consumer, runs all test categories, and verifies replay.

See `validation-report.json` for machine-readable evidence and `UNKNOWN_REGISTER.md` for external blockers.
