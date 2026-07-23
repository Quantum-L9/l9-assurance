# Regression Guard

The following invariants are mechanically protected:

- Python is the only authoritative runtime.
- JSON Schema remains protocol authority.
- The root and embedded protocol bundles are byte-consistent.
- The CLI exposes exactly nine known routes and rejects unknown input.
- The evaluator imports no filesystem, network, or process APIs.
- Production modules cannot access the test signer.
- Canonicalization vectors cover numeric and Unicode edge cases.
- Exact subject, producer, check, status, freshness, digest, replay, and lineage rules are tested.
- Verdict reduction distinguishes positive failure from missing knowledge.
- Plan and decision tampering is rejected.
- Consumer transport is byte-preserving.
- No Node.js, TypeScript, scanner, plugin, GitHub, repair, LSP, or debt runtime package is present.
- Replay fixtures are byte-identical.
- A wheel builds from source.

Run `python scripts/ci.py` to execute the guard.

## Additional 2.1.1 guards

- Every release file is covered by `.l9/L9_META.jsonl`.
- Repository classification and no-egress Gate applicability are machine-readable.
- Replay state is bounded, append-only, conflict-detecting, and non-evicting.
- Runtime source contains no network/process imports, direct sibling imports, dynamic execution, or print bypasses.
- Candidate-wheel tests assert the imported package originates from the isolated environment.
