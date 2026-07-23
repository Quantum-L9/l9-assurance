# Protocol

JSON Schema Draft 2020-12 files under `schemas/v1` are the authoritative persistent contracts. Python TypedDict projections in `src/l9_assurance/contracts/generated.py` support static consumers but do not override schemas.

Root schemas, registries, controls, profiles, and selected conformance fixtures are copied into the installable package by:

```bash
python scripts/sync_protocol_bundle.py --write
```

CI uses `--check` and rejects per-file or aggregate digest drift.
