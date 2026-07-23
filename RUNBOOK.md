# Runbook

## Prerequisites

- Python 3.11, 3.12, or 3.13
- pip

## Setup

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -e .
```

## Full validation

```bash
python scripts/ci.py
```

The command verifies the embedded protocol bundle, compiles Python, validates schemas and registries, checks architectural boundaries and fixtures, runs pytest, verifies replay bytes, runs benchmarks, validates completeness, and builds a wheel.

## Capabilities

```bash
l9-assurance capabilities --json
```

## Plan

```bash
l9-assurance plan \
  --profile l9.pull-request@1 \
  --subject fixtures/valid/subject.json \
  --output artifacts/assurance-plan.json

l9-assurance verify-plan \
  --plan artifacts/assurance-plan.json
```

## Admit evidence

```bash
l9-assurance evidence admit \
  --subject fixtures/valid/subject.json \
  --input path/to/observations \
  --received-at 2026-07-21T00:00:02Z \
  --output artifacts/admission
```

The checked-in producer registry is intentionally pending. Production observations remain quarantined until trust activation is approved. Conformance tests may use the trusted fixture registry.

## Evaluate

```bash
l9-assurance evaluate \
  --subject fixtures/valid/subject.json \
  --profile l9.pull-request@1 \
  --policy l9.organization-default@1 \
  --evidence artifacts/admission/accepted \
  --evaluation-time 2026-07-21T00:00:03Z \
  --output artifacts/assurance
```

## Failure recovery

- Exit 40: correct CLI input or malformed artifact.
- Exit 41: correct profile/policy selection.
- Exit 42: inspect admission reason codes and quarantine/rejection records.
- Exit 43: use an approved production signature algorithm.
- Exit 50: treat as an invariant defect and block promotion.

Do not convert `indeterminate` into `fail` or `pass` outside policy. Do not reconstruct decisions in downstream consumers.

## Repository-alignment maintenance

After adding or removing files:

```bash
python scripts/generate_inventory.py --write
python scripts/generate_l9_meta.py --write
python scripts/validate_l9_alignment.py
```

Replay capacity exhaustion is an invariant failure. Increase the explicitly configured capacity for the execution context; never delete or evict replay records to make an admission pass.
