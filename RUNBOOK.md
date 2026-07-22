# Operator Runbook

## Validate the repository

```bash
npm ci
npm run ci
npm run benchmark
npm pack --workspaces --dry-run
```

## Activate producer trust

The checked-in `l9-ci-sdk` producer is pending. Activation requires an evidence-backed minimum version, permitted version range, check ownership, optional build digest requirements, architecture review, and security review. Modify `registry/producers.yaml`, regenerate its reviewed digest where the consuming control plane stores one, and rerun the full conformance suite.

Never activate trust merely to make an indeterminate decision pass.

## Unsupported schema

Containment: reject or quarantine the artifact. Do not reinterpret it. Preserve the artifact digest and admission report. Upgrade only through an approved schema compatibility change.

## Producer version pending or revoked

Containment: quarantine pending producers and reject revoked versions. Do not widen an allowed range during incident response. Preserve affected evidence and issue an indeterminate decision when mandatory evidence cannot be established.

## Missing evidence

Confirm artifact transport first. The semantic decision is indeterminate. Do not synthesize an observation or convert absence into positive failure evidence.

## Subject mismatch

Reject the evidence with `EVIDENCE_SUBJECT_MISMATCH` or `EVIDENCE_REVISION_MISMATCH`. Trigger fresh producer execution for the exact commit.

## Replay mismatch

Stop authority promotion, preserve both payloads and fingerprints, and inspect observation identity reuse or tampering. A replay mismatch is not eligible for automatic acceptance.

## Policy or profile corruption

Pin to the last verified digest, disable authoritative issuance if the expected digest cannot be established, and preserve the rejected definitions.

## Test signer exposure

Treat as a trust-boundary incident. Remove production reachability, invalidate affected non-production artifacts, rerun architecture and trust-policy tests, and do not claim production signature validity.

## CI-core publication discrepancy

The canonical JSON decision wins. Disable the contradictory projection or publication path, preserve the byte-level decision and rendered output, and correct CI Core without changing the decision.

## Emergency authority disablement

CI Core owns the authority switch. L9 Assurance continues issuing clearly identified decisions, but they remain non-authoritative until governance re-enables publication authority.

## Rewrite rollback

Before merging v2, preserve the final v1 commit through an immutable rollback reference. During review, abandon or close the rewrite branch rather than mutating `main`. After authority promotion, rollback must occur in CI Core without deleting issued decisions.
