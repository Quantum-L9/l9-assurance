# Contributing

1. Read `REWRITE_EXECUTION_SPEC.md` and preserve the assurance boundary.
2. Add or change schemas before protocol bindings.
3. Run `npm run generate:bindings` and commit generated outputs.
4. Add deterministic tests for every behavior change.
5. Run `npm run ci` before requesting review.
6. Treat producer, check, profile, control, policy, and trust changes as architecture and security changes.
7. Do not introduce scanners, shell execution, GitHub SDKs, arbitrary plugin execution, or testing-package dependencies into production packages.

A change is incomplete when it changes behavior without fixtures, reason codes, or replay evidence.
