# Regression Guard

## Preserved Release contracts

- Eight active workspaces and no legacy execution workspaces.
- Exact `git-revision` subject identity.
- `l9-ci-sdk` as the sole Release-zero producer contract.
- `l9.pull-request@1.0.0` and seven mandatory controls.
- Evidence admission before evaluation.
- Hard-gate verdict semantics remain deterministic.
- Production packages cannot reach test signing identities.
- CI Core consumes decisions without reconstructing them.

## New seam locks

- `l9.assurance-plan@1.0.0` is schema validated and digest verified.
- Embedded protocol bundle digest is `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`.
- Every embedded authority file is individually verified before loading.
- TypeScript and Python pass the same `l9.canonical-json/v1` vectors.
- CLI distribution is tested from clean offline local tarballs without a repository checkout.
- Producer conformance uses registry-aware admission, not shape-only validation.
- Admission and decision directories are distinct.

## Machine gates

`npm run ci` runs generated-binding drift, protocol-bundle drift, formatting, lint, schemas, registries, boundaries, fixtures, build evidence, completeness, typecheck, build, standalone distribution, all eight test categories, and replay.

## Forbidden regressions

- Thin or unversioned plan output.
- Repository-relative runtime assets omitted from package distribution.
- Standard-library canonicalization used as digest authority without vectors.
- Structural-only producer conformance presented as admission conformance.
- Harness metadata inserted into Assurance decisions.
- Scanner, runner, arbitrary plugin, GitHub publication, repair, debt-mining, or LSP ownership inside Assurance.
- TODO, FIXME, placeholder, scaffold-only, or fake-success behavior in executable files.
