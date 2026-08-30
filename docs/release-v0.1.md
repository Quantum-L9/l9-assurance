# l9-assurance in constellation v0.1

Scope note: this document describes what assurance actually does in the v0.1
constellation release. It is deliberately narrow. The cross-repository seam
audit dated 2026-08-29 found that no runtime path existed from a finding to a
verified repair, and that the one designed seam -- SDK observations reaching
assurance admission -- was closed by two independent blockers. v0.1 opens that
one seam and states plainly what remains unwired.

## What is production-real

- `l9-assurance` admits `l9.mandatory-findings` observations produced by
  `l9-ci-sdk`. The finding-bundle artifact reference carries `sdkVersion`, which
  the artifact reference schema now lists (DECISION D-010).
- `l9-ci-sdk` is a trusted producer for `>=2.0.0 <3.0.0` (DECISION D-009,
  resolving UNKNOWN-001). Observations from that range are admissible.
- The seam is proven by execution, not by fixture: `tests/cross_repo/` builds an
  observation with the installed SDK and admits it with the installed assurance,
  and the `cross-repo-sdk-seam` workflow runs that with both packages installed.

## What is intentionally not production-real

- **Assurance is not an authoritative gate anywhere in v0.1.** Admission being
  possible is not the same as any repository blocking on the verdict.
  `l9-ci-core` invokes assurance in shadow mode; UNKNOWN-003 remains open.
- **There is no finding -> repair -> re-assurance convergence.** No component
  consumes an assurance decision to drive a repair, and nothing re-admits a
  repaired revision.
- **`PR_Repair` is not part of the debt pipeline** and does not report to
  assurance. Its verification is local and self-contained.
- **Per-finding evidence lineage is not projected.** The SDK's `evidence_ids`
  are not mapped into the projected assurance `evidence` array; only the
  whole-bundle artifact digest crosses the seam. Assurance can verify that a
  bundle produced these findings, but cannot attribute an individual finding to
  the evidence records behind it. Tracked as audit finding F-10.

## Trust activation is reversible

If SDK observations must stop being admitted, set `authorization_status` back to
`pending` and `allowed_versions` back to `null` in `registry/producers.yaml`,
re-run `python scripts/sync_protocol_bundle.py --write`, and update the
`tests/cross_repo/` expectation for the live registry. Admission then quarantines
rather than rejecting, which is recoverable and fails closed.

## Verifying this repository's part of the release

```bash
python scripts/ci.py
L9_CROSS_REPO_SDK_REQUIRED=1 python -m pytest -q tests/cross_repo
```

The second command requires `l9-ci` to be installed alongside assurance. Without
it the cross-repo module skips, and the seam is not proven by that run.
