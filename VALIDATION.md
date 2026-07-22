# Validation

## Decision

**APPROVED_WITH_EXTERNAL_UNKNOWNS**

The Release-zero source is complete for branch review and shadow-mode integration. Local deterministic validation, package dry-runs, source-only clean-room execution, and convergence checks pass. Production authority promotion remains `NO_GO` because producer trust, hosted branch execution, and shadow-mode reliability require external evidence.

## Executed validation

| Check | Result | Evidence |
|---|---|---|
| Generated binding drift | PASS | `npm run check:generated` |
| Formatting | PASS | `npm run format:check` |
| Source hygiene | PASS | `npm run lint` |
| JSON Schema contracts | PASS | 18 Draft 2020-12 schemas |
| Trust registries | PASS | one producer, six checks, seven controls, one profile |
| Package boundaries and evaluator purity | PASS | eight-workspace boundary validator |
| Structural fixtures | PASS | six valid and eight invalid observation fixtures |
| Build evidence | PASS | inventory, benchmark, and Unknown register validation |
| Completeness | PASS | required artifacts, empty files, unfinished markers, caches, and nested archives |
| TypeScript typecheck | PASS | strict source-only typecheck |
| Workspace build | PASS | all eight TypeScript workspaces |
| Behavior suite | PASS | 62 tests across eight categories |
| Deterministic replay | PASS | two replay cases rerun independently |
| Performance benchmark | PASS | all six targets below threshold |
| Workspace package dry-run | PASS | eight packages, 180 packed files |
| Source-only clean-room CI | PASS | all 13 gates rebuilt without retained output |
| Convergence | PASS | source checksums unchanged across consecutive full CI runs |

## Performance snapshot

The authoritative measurements are in `validation-benchmark.json`. The measured p95 observation validation, admission of 1,000 observations, evaluation of 500 controls, decision verification, summary generation, and resident memory all remained below their Release-zero targets.

## Integrity method

The clean-room copy excludes `node_modules`, `dist`, `.tmp`, Git metadata, bytecode, caches, and prior logs. It builds all workspaces from source, creates only local workspace links for package resolution, and executes the same 13-gate `npm run ci` command.

The final delivery contains the source-only repository plus release evidence. It contains no nested archives, generated dependency trees, build output, cache residue, or invented external pass claims.

## External Unknowns

See `UNKNOWN_REGISTER.md`. UNKNOWN-001 through UNKNOWN-003 block authoritative production promotion. They do not block code review or shadow-mode integration.
