# L9 Assurance

L9 Assurance is the protocol authority, evidence-admission boundary, deterministic control evaluator, and decision issuer for the Quantum-L9 CI constellation.

It does not run scanners, execute tests, publish GitHub checks, mutate repositories, discover arbitrary plugins, or mine debt. `l9-ci-sdk` observes. `l9-harness` may coordinate local and shadow execution. `l9-ci-core` transports and publishes. Assurance verifies and decides.

## Release 2.0.1 scope

- Subject: exact `git-revision`
- Producer contract: `l9-ci-sdk`
- Profile: `l9.pull-request@1.0.0`
- Consumer contract: `l9-ci-core`
- Verdicts: `pass`, `fail`, `conditional`, `indeterminate`
- Runtime: TypeScript, offline and local-first
- Contract authority: JSON Schema Draft 2020-12
- Canonicalization: `l9.canonical-json/v1`
- Plan contract: `l9.assurance-plan@1.0.0`
- Embedded protocol digest: `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`

## Quick start

```bash
npm ci
npm run ci
node packages/cli/dist/bin.js plan \
  --profile l9.pull-request@1 \
  --subject fixtures/valid/subject.json \
  --output artifacts/assurance-plan.json
```

The CLI uses its digest-verified embedded Release-zero protocol bundle when `--root` is omitted. A repository checkout is not required after the package and its local dependencies are installed.

Verify a generated plan:

```bash
node packages/cli/dist/bin.js verify-plan \
  --plan artifacts/assurance-plan.json
```

Run full registry-aware producer conformance:

```bash
node packages/cli/dist/bin.js conformance producer \
  --producer l9-ci-sdk \
  --input fixtures/valid \
  --subject fixtures/valid/subject.json \
  --received-at 2026-07-21T00:00:02.000Z \
  --producer-registry fixtures/compatibility/producer-registry.trusted.json \
  --check-registry fixtures/compatibility/check-registry.json
```

## Core flow

```text
l9-ci-sdk observations
  -> structural validation
  -> producer and check authorization
  -> exact subject validation
  -> integrity and freshness validation
  -> accepted evidence
  -> declarative control evaluation
  -> deterministic verdict reduction
  -> immutable assurance decision
  -> l9-ci-core transport and publication
```

## Distribution proof

```bash
npm run validate:distribution
npm pack --workspaces --dry-run
```

`validate:distribution` creates local workspace tarballs, installs them into a clean offline consumer, runs the CLI without a repository checkout, emits a plan, and verifies the plan digest.

The checked-in production producer registry intentionally remains pending until the minimum trusted `l9-ci-sdk` version and required build identity are approved. Tests and conformance use a separate activated fixture registry.

See [VALIDATION.md](VALIDATION.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SPECIFICATION.md](SPECIFICATION.md), and [RUNBOOK.md](RUNBOOK.md).
