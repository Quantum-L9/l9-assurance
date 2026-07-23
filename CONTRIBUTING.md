# Contributing

1. Read `ARCHITECTURE.md` and `REWRITE_EXECUTION_SPEC.md`.
2. Preserve the evidence-admission and decision-only boundary.
3. Edit root schemas, controls, profiles, and registries before generated package assets.
4. Run `python scripts/sync_protocol_bundle.py --write` after protocol changes.
5. Add deterministic behavior, adversarial, and replay tests for every material change.
6. Run `python scripts/ci.py` before review.
7. Do not introduce Node.js, npm, scanner execution, network access, GitHub publication, repair logic, arbitrary plugins, or testing-only trust into production modules.

A behavior change is incomplete without reason-code, fixture, replay, and documentation review.
