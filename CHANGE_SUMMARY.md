# Change Summary

## Runtime migration

The eight logical Assurance responsibility slices were ported from npm workspaces into one Python distribution. This removes a second CI runtime while preserving public contracts and architectural ownership.

## Preserved

- 20 JSON schemas
- canonical JSON and SHA-256 semantics
- producer/check registries
- seven controls and pull-request profile
- policy, waiver, Unknown, and verdict semantics
- nine CLI routes and exit codes
- replay and conformance fixtures
- offline local-first execution

## Replaced

| Previous | Current |
|---|---|
| Node.js 22 and npm | Python 3.11 through 3.13 and pip |
| eight npm workspaces | one `src/` Python distribution with eight bounded modules |
| TypeScript authoritative types | JSON Schema plus Python TypedDict contracts |
| npm package installation | wheel/editable Python installation |
| JavaScript CI scripts | Python validation scripts |

## Not changed

Assurance still does not execute checks, orchestrate CI, publish decisions, mutate repositories, route Gate traffic, repair code, mine debt, or operate an LSP.

## Recursive improvement and alignment hardening

Release 2.1.1 adds machine-readable repository governance, complete per-file L9 metadata, bounded append-only replay state, a dedicated alignment validator, stronger stub detection, shared file-inventory tooling, and candidate-wheel origin verification. Public schemas, CLI routes, artifact names, evidence semantics, controls, verdicts, and constellation ownership remain unchanged.
