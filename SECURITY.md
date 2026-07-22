# Security

## Trust boundary

Registry changes, producer authorization, check authorization, schema major versions, waiver relaxation, and unknown-to-pass behavior are security-sensitive changes.

## Release-zero controls

- SHA-256 only, with explicit algorithm identifiers
- canonical JSON for every digest preimage
- exact revision comparison
- strict top-level schemas
- bounded input size, depth, string length, finding count, and lineage depth
- symlink and path traversal rejection during artifact discovery
- replay and duplicate detection hooks
- no remote lookup in the evaluator
- no production export of testing signers
- Markdown escaping for untrusted finding content

## Vulnerability reporting

Do not include secrets or unrestricted evidence payloads in an issue. Report privately to the repository security owner through the organization-approved channel. The channel is intentionally not invented in this repository and remains an operational configuration item.
