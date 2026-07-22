# Change Summary

The legacy 52-workspace assurance/testing platform is replaced on the rewrite branch by a clean eight-workspace assurance plane.

## Added

- schema-first protocol contracts;
- exact-subject evidence admission;
- producer and check authorization;
- replay and duplicate handling;
- declarative controls;
- policy and waiver evaluation;
- deterministic immutable decisions;
- Markdown projection from canonical JSON;
- producer and consumer conformance;
- local-first CLI and programmatic engine;
- architecture, unit, contract, conformance, integration, replay, security, and performance tests.

## Removed by replacement tree

- arbitrary validator/plugin execution;
- scanner and test execution;
- GitHub Actions orchestration and publication;
- repair and mutation behavior;
- red-team harnesses;
- debt mining and LSP behavior;
- aggregate scores that compete with hard-gate verdicts;
- production reachability of test signers.

## Flawless Victory hardening

- Replaced partial runtime casts with strict nested validation.
- Enforced producer, check, status, subject, and stored-envelope trust boundaries.
- Added full decision verification and policy-aware unknown/finding semantics.
- Added adversarial regression coverage and a machine-enforced completeness gate.
- Added traceability, Unknown, regression, alignment, and release evidence artifacts.
