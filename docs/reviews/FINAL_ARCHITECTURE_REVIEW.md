# Final Architecture Review

## Decision

**GO** for publication of `rewrite/v2-assurance-plane` and draft pull-request review.

**NO_GO** for authoritative CI promotion. Authority remains outside this build until `l9-ci-sdk` trust activation, hosted CI execution, shadow-mode comparison, governance approval, and rollback controls are separately evidenced.

## Reviewed target

- Repository: `Quantum-L9/l9-assurance`
- Release: `2.0.0`
- Baseline replaced on the rewrite branch: `af79053c5b7f9c0338edf5f1ff7253f429646cf9`
- Strategy: clean rewrite in place
- Active workspaces: eight

## Boundary conclusion

The implementation behaves as an assurance plane rather than a testing platform. It owns protocol contracts, evidence admission, declarative control resolution, policy and waiver semantics, deterministic verdict reduction, decisions, conformance, and local protocol tooling.

It does not own scanner execution, repository inspection, arbitrary plugin execution, shell execution, GitHub publication, mutation, repair, LSP behavior, red-team execution, or debt mining.

## Acceptance evidence

| Criterion | Result | Evidence |
|---|---|---|
| Exactly eight workspaces | PASS | `packages/` inventory and `validate:boundaries` |
| Permitted dependency graph | PASS | `scripts/validate-boundaries.mjs` and architecture tests |
| No legacy imports | PASS | source boundary scan and complete zero-port extraction ledger |
| Strict schemas and fixtures | PASS | 18 Draft 2020-12 schemas; 6 valid and 8 invalid observation fixtures |
| Generated bindings deterministic | PASS | four generated binding artifacts pass drift check |
| SDK producer conformance | PASS | positive suite plus malformed, stale, unauthorized, duplicate, replay, revision, extension, and size cases |
| Admission semantics | PASS | rejected, quarantined, duplicate, and accepted states with stable reason codes |
| Accepted-evidence-only evaluation | PASS | evaluator accepts `AcceptedEvidence`, not raw observations |
| Seven declarative controls | PASS | `controls/ci` and registry validation |
| Deterministic profile and policy | PASS | ordering, overlay, conflict, and replay tests |
| Verdict semantics | PASS | pass, fail, conditional, and indeterminate integration cases |
| Hard gates dominate dimensions | PASS | verdict reducer ignores informational dimensions |
| Explicit time and IDs | PASS | evaluator context requires evaluation time and decision ID |
| Byte-identical replay | PASS | locked replay fixture and reordered-evidence test |
| Summary projection | PASS | canonical decision projection tests |
| Test signer isolation | PASS | architecture scan and production verifier rejection test |
| CLI exit-code contract | PASS | contract tests |
| API and CLI equivalence | PASS | full vertical-slice byte-equivalence test |
| CI Core transport conformance | PASS | byte, digest, verdict, summary, schema, and escaping checks |
| Unsupported decision safety | PASS | unsupported major schema fixture fails without throwing |
| Full test taxonomy | PASS | architecture, unit, contract, conformance, integration, replay, security, and performance suites |
| Performance objectives | PASS | `validation-benchmark.json` |
| Legacy extraction ledger | PASS | `docs/migration/legacy-extraction-ledger.md` |
| Documentation alignment | PASS | README, architecture, specification, security, runbook, and migration documents |
| Source-completeness scan | PASS | deterministic lint rejects unresolved implementation markers and unsupported validation claims |

## Security conclusion

The evaluator is offline and pure with explicit time injection. Exact repository and revision binding is enforced before admission. Producer and check authorization is registry-driven. The production registry remains pending rather than inventing a trusted SDK version. Testing signers are isolated to the testing package and rejected by production verification.

## Operational Unknowns

1. The minimum production-trusted `l9-ci-sdk` version is unresolved. The checked-in registry therefore quarantines the producer.
2. GitHub Actions has not executed the rewrite branch yet.
3. Shadow-mode mismatch and reliability evidence do not yet exist.
4. NPM registry installation and publication were not performed. Workspace pack dry-runs passed locally.
5. Production signing and audit bundles are deferred by the locked Release-zero scope.

These Unknowns block authority promotion, not branch publication or architecture review.
