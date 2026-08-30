# Unknown Register

The Python runtime migration is locally complete. These external facts remain Unknown and are not invented.

| ID | Unknown | Effect | Resolution evidence |
|---|---|---|---|
| ~~UNKNOWN-001~~ RESOLVED | Minimum production-trusted `l9-ci-sdk` version and build identity | Resolved for v0.1: `l9-ci-sdk` is `trusted` for `>=2.0.0 <3.0.0` in `registry/producers.yaml` | Release-owner approval recorded as DECISION D-009; admission proven by `tests/cross_repo/` against the live registry |
| UNKNOWN-002 | Hosted GitHub Actions and Python 3.11/3.12 matrix behavior on the migrated runtime | Local Python 3.13 CI does not prove hosted permissions, other supported interpreters, or artifact transport | Successful protected-branch workflow run |
| UNKNOWN-003 | Shadow-mode mismatch and reliability window | Assurance must not become authoritative | Recorded parity evidence with no unresolved mandatory mismatch |
| UNKNOWN-004 | Public package channel and clean constellation installation | Wheel build and isolated execution against the approved dependency environment are proven; the public channel is not | Successful pinned install in the approved package channel |
| UNKNOWN-005 | Production signing and complete audit bundles | Decisions remain unsigned/local-trust | Approved signer/verifier and audit-bundle implementation |

UNKNOWN-002 and UNKNOWN-003 block authority promotion, not code review.

UNKNOWN-001 is resolved. Trust activation is scoped to the version range only:
it makes SDK observations *admissible*, and does not make assurance an
authoritative gate anywhere. UNKNOWN-003 still holds -- assurance runs in shadow
in `l9-ci-core` and no repository blocks on its verdict in v0.1.
