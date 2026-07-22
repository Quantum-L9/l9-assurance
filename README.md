# L9 Assurance

L9 Assurance is the protocol authority, evidence-admission boundary, deterministic control evaluator, and decision issuer for the Quantum-L9 CI constellation.

It does not run scanners, execute tests, publish GitHub checks, mutate repositories, discover arbitrary plugins, or mine debt. `l9-ci-sdk` observes. `l9-ci-core` orchestrates and publishes. L9 Assurance verifies and decides.

## Release-zero scope

- Subject: exact `git-revision`
- Producer contract: `l9-ci-sdk`
- Profile: `l9.pull-request@1.0.0`
- Consumer contract: `l9-ci-core`
- Verdicts: `pass`, `fail`, `conditional`, `indeterminate`
- Runtime: TypeScript, offline and local-first
- Contract authority: JSON Schema Draft 2020-12

## Quick start

```bash
npm ci
npm run ci
node packages/cli/dist/bin.js plan \
  --profile l9.pull-request@1 \
  --subject fixtures/valid/subject.json \
  --output artifacts/assurance-plan.json
```

When schemas change, regenerate and commit bindings:

```bash
npm run generate:bindings
npm run check:generated
```

The checked-in producer registry intentionally remains pending until the minimum trusted `l9-ci-sdk` version and required build identity are verified. Production admission therefore quarantines that producer rather than inventing trust. Tests use a separate activated fixture registry.

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

## Validation

```bash
npm run ci
npm run benchmark
npm pack --workspaces --dry-run
```

See [VALIDATION.md](VALIDATION.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SPECIFICATION.md](SPECIFICATION.md), and [RUNBOOK.md](RUNBOOK.md).
