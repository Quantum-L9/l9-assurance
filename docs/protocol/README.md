# Assurance Protocol

JSON Schema Draft 2020-12 files under `schemas/v1` are the authoritative persistent contracts. Generated TypeScript and Python bindings are projections and must pass `npm run check:generated`.

## Release-zero sequence

1. Normalize the exact `git-revision` subject.
2. Discover bounded JSON artifacts without following symlinks.
3. Validate the complete observation structure and reject unknown security-sensitive properties.
4. Authorize producer identity, version, repository, subject kind, check identity, output schema, and execution status.
5. Validate exact subject binding, execution interval, freshness, integrity, lineage, replay, and policy admissibility.
6. Convert only accepted observations into evidence envelopes.
7. Resolve the locked profile and policy from validated configuration.
8. Evaluate declarative controls without invoking producer code.
9. Reduce mandatory control results to `pass`, `fail`, `conditional`, or `indeterminate`.
10. Emit canonical JSON; Markdown is a projection only.

## Extension law

Security-sensitive top-level and nested objects reject unknown properties. Bounded extension data is permitted only under namespaced `extensions` keys where the schema explicitly allows it.

## Compatibility

Patch changes are non-semantic. Minor changes may add backward-compatible optional fields. Structural or semantic incompatibility requires a major version. Producer and check compatibility is registry-driven and never inferred from “latest.”
