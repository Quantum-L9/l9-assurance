# Runbook

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Python 3 for cross-language conformance

## Install and validate

```bash
npm ci --ignore-scripts
npm run ci
npm run benchmark -- --output validation-benchmark.json
npm pack --workspaces --dry-run --json
```

## Generate a plan from the embedded protocol

```bash
npm run build
mkdir -p artifacts
node packages/cli/dist/bin.js plan \
  --profile l9.pull-request@1 \
  --subject fixtures/valid/subject.json \
  --output artifacts/assurance-plan.json
node packages/cli/dist/bin.js verify-plan \
  --plan artifacts/assurance-plan.json
```

Expected result: exit code `0`; schema `l9.assurance-plan`; schema version `1.0.0`; seven controls; six checks; one producer; protocol digest `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`.

## Admit evidence

```bash
node packages/cli/dist/bin.js evidence admit \
  --subject fixtures/valid/subject.json \
  --input fixtures/valid \
  --received-at 2026-07-21T00:00:02.000Z \
  --output artifacts/admission
```

The checked-in production registry is pending, so production-shaped observations may be quarantined until trust is approved. For conformance, use the explicit trusted fixture registries.

## Run producer conformance

```bash
node packages/cli/dist/bin.js conformance producer \
  --producer l9-ci-sdk \
  --input fixtures/valid \
  --subject fixtures/valid/subject.json \
  --received-at 2026-07-21T00:00:02.000Z \
  --producer-registry fixtures/compatibility/producer-registry.trusted.json \
  --check-registry fixtures/compatibility/check-registry.json
```

A pass requires at least one artifact, structural validity for all artifacts, zero rejected evidence, zero quarantined evidence, the expected producer identity, and registry-aware admission success.

## Evaluate admitted evidence

```bash
node packages/cli/dist/bin.js evaluate \
  --subject fixtures/valid/subject.json \
  --profile l9.pull-request@1 \
  --policy l9.organization-default@1 \
  --evidence artifacts/admission/accepted \
  --evaluation-time 2026-07-21T00:00:02.000Z \
  --output artifacts/assurance
```

## Validate standalone packaging

```bash
npm run validate:distribution
```

This packs all eight workspaces, performs an offline local-tarball installation in a clean consumer, runs `l9-assurance plan` without `--root`, and verifies the result.

## Failure recovery

- `Protocol manifest file digest mismatch`: discard the package or regenerate with `npm run generate:protocol`; never bypass validation.
- `Protocol manifest aggregate digest mismatch`: treat the bundle as corrupted or incoherent.
- `EVIDENCE_*`: inspect `admission-report.json`; do not feed rejected or quarantined records to evaluation.
- Exit `41`: profile or policy selection failure.
- Exit `42`: evidence admission failure.
- Exit `50`: invariant failure; stop promotion.

## Promotion guard

Do not make Assurance authoritative until the trusted SDK build identity, hosted CI, shadow-mode comparison, and rollback evidence are approved.
