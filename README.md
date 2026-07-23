# L9 Assurance

L9 Assurance is the CI constellation's protocol authority, evidence-admission boundary, deterministic control evaluator, and decision issuer.

It is a **Python-authoritative**, offline, local-first package designed to operate beside `l9-ci-sdk`, `l9-ci-core`, `l9-harness`, the CI debt repositories, and `PR_Repair` without introducing a second runtime toolchain.

## Responsibility boundary

L9 Assurance owns:

- JSON Schema protocol contracts;
- producer and check trust registries;
- exact-subject evidence admission;
- replay and duplicate detection;
- declarative controls, policy, waivers, and Unknowns;
- deterministic verdict reduction;
- decision verification and conformance.

It does not run repository scanners, execute tests, orchestrate CI, publish checks, route workflows, mutate repositories, repair code, mine debt, or provide editor behavior.

## Release 2.1.1

- Runtime: Python 3.11 through 3.13
- Package: `l9-assurance`
- Console command: `l9-assurance`
- Contract authority: JSON Schema Draft 2020-12
- Subject: exact `git-revision`
- Producer contract: `l9-ci-sdk`
- Profile: `l9.pull-request@1.0.0`
- Decision consumer: `l9-ci-core`
- Verdicts: `pass`, `fail`, `conditional`, `indeterminate`

## Install and validate

```bash
python -m pip install -e .
python scripts/ci.py
```

## CLI

```bash
l9-assurance capabilities --json

l9-assurance plan \
  --profile l9.pull-request@1 \
  --subject fixtures/valid/subject.json \
  --output artifacts/assurance-plan.json

l9-assurance verify-plan \
  --plan artifacts/assurance-plan.json
```

The protocol bundle is embedded in the wheel and verified before it is loaded. A consumer does not need a repository checkout or Node.js.

## Core flow

```text
l9-ci-sdk observations
  -> schema and resource validation
  -> producer/check authorization
  -> exact subject binding
  -> integrity, freshness, and replay checks
  -> admitted evidence
  -> control and policy evaluation
  -> immutable assurance decision
  -> l9-ci-core transport/publication
```

## Development law

1. Change root schemas, controls, profiles, or registries first.
2. Run `python scripts/sync_protocol_bundle.py --write`.
3. Add behavior and replay tests.
4. Run `python scripts/ci.py`.
5. Run `python scripts/generate_l9_meta.py --write` after adding, removing, or reclassifying files.
6. Do not add network, shell, scanner, CI-orchestration, repair, or publication authority.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SPECIFICATION.md](SPECIFICATION.md), [REWRITE_EXECUTION_SPEC.md](REWRITE_EXECUTION_SPEC.md), and [RUNBOOK.md](RUNBOOK.md).

## L9 repository governance

- `.l9/repo-spec.yaml` is the machine-readable repository boundary and applicability record.
- `.l9/L9_META.jsonl` covers every release file without modifying canonical protocol bytes.
- Replay state is append-only, bounded, never evicted, and fails closed at capacity.
- `ALIGNMENT_REPORT.md` records TransportPacket, Gate, schema-field, security, and validation applicability.

