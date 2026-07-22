# Regression Guard

## Preserved Release-zero contracts

- Eight active workspaces and no legacy execution workspaces.
- Exact `git-revision` subject identity.
- `l9-ci-sdk` as the sole Release-zero producer contract.
- `l9.pull-request@1.0.0` and its seven mandatory controls.
- Evidence admission before evaluation.
- Positive violation evidence produces `fail`.
- Missing, malformed, stale, unauthorized, or revision-mismatched evidence cannot produce `pass`.
- Decisions are deterministic, immutable, and independently structurally verifiable.
- Test signing identity is unreachable from production package entrypoints.
- CI Core consumes a decision without reconstructing it.

## Machine gates

`npm run ci` verifies generated bindings, formatting, lint, schemas, registries, boundaries, fixtures, build evidence, completeness, typecheck, build, all test categories, and replay.

## Forbidden regressions

- Scanner, test-runner, arbitrary plugin, GitHub publication, repair, debt-mining, or LSP ownership inside assurance.
- Aggregate confidence scores overriding mandatory control results.
- Raw observations evaluated without admission.
- Reuse of revision-bound evidence across commits.
- Runtime casts presented as validation.
- TODO, FIXME, placeholder, scaffold-only, or fake-success behavior in executable files.
- Nested release archives or generated build output in the source tree.
