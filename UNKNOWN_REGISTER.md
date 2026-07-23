# Unknown Register

The Python runtime migration is locally complete. These external facts remain Unknown and are not invented.

| ID | Unknown | Effect | Resolution evidence |
|---|---|---|---|
| UNKNOWN-001 | Minimum production-trusted `l9-ci-sdk` version and build identity | Checked-in producer remains pending; production observations are quarantined | Approved producer registry update and review record |
| UNKNOWN-002 | Hosted GitHub Actions and Python 3.11/3.12 matrix behavior on the migrated runtime | Local Python 3.13 CI does not prove hosted permissions, other supported interpreters, or artifact transport | Successful protected-branch workflow run |
| UNKNOWN-003 | Shadow-mode mismatch and reliability window | Assurance must not become authoritative | Recorded parity evidence with no unresolved mandatory mismatch |
| UNKNOWN-004 | Public package channel and clean constellation installation | Wheel build and isolated execution against the approved dependency environment are proven; the public channel is not | Successful pinned install in the approved package channel |
| UNKNOWN-005 | Production signing and complete audit bundles | Decisions remain unsigned/local-trust | Approved signer/verifier and audit-bundle implementation |

UNKNOWN-001 through UNKNOWN-003 block authority promotion, not code review.
