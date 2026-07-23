# Validation

## Current decision

`APPROVED_WITH_EXTERNAL_UNKNOWNS`

The Python-authoritative runtime passes all locally executable release gates. External trust activation, hosted execution, shadow parity, public package installation, and production signing remain Unknown.

## Reproduce

```bash
python -m pip install -e .[dev]
python scripts/ci.py
```

## Gate matrix

| Gate | Method |
|---|---|
| Protocol bundle drift | `python scripts/sync_protocol_bundle.py --check` |
| Python syntax/importability | `python -m compileall -q src scripts tests` |
| JSON Schema integrity | `python scripts/validate_schemas.py` |
| Registry and ownership relations | `python scripts/validate_registries.py` |
| Architecture and offline boundaries | `python scripts/validate_boundaries.py` |
| Positive/negative fixtures and canonical vectors | `python scripts/validate_fixtures.py` |
| Behavior, contract, conformance, integration, replay, security, performance tests | `pytest -q` |
| Byte-identical replay | `python scripts/verify_replay.py` |
| Resource objectives | `python scripts/benchmark.py` |
| Required files, no unfinished markers, no runtime residue | `python scripts/validate_completeness.py` |
| Distribution | wheel build, metadata verification, isolated installation, embedded-protocol execution |
| Harness 2.0.4 seam | uploaded Harness `capture_plan` and `evaluate` adapters against installed console script |

The full command stops on the first failure and does not convert blocked checks into passes.

Local execution used Python 3.13.5. The checked-in hosted workflow defines Python 3.11, 3.12, and 3.13, but hosted matrix results are not claimed here. Ruff and mypy configuration is present for constellation alignment; their executables were unavailable in this environment, so no lint or static-type pass is claimed.

The uploaded L9 Harness 2.0.4 implementation was also exercised against the installed Python console script. Plan capture and evaluation completed successfully without modifying Harness. See [the compatibility review](docs/reviews/HARNESS_2_0_4_COMPATIBILITY.md).

## Recursive alignment gates

| Gate | Method |
|---|---|
| L9 repository specification and applicability | `python scripts/validate_l9_alignment.py` |
| Per-file L9 metadata coverage | `python scripts/generate_l9_meta.py --check` |
| Pass-only/ellipsis/NotImplemented stubs | AST inspection in `validate_completeness.py` |
| Bounded append-only replay | replay behavior tests and alignment gate |
| Isolated candidate wheel provenance | force-install candidate wheel and assert module origin inside the clean environment |

The complete local ladder contains 13 ordered repository gates plus isolated wheel construction and execution.
