# Unknown Register

The repository is locally complete for Release 2.0.1. The following facts require external execution or governance and are not invented.

| ID | Unknown | Effect | Resolution evidence |
|---|---|---|---|
| UNKNOWN-001 | Minimum production-trusted `l9-ci-sdk` version and build identity | Checked-in producer remains pending; production observations are quarantined | Approved producer-registry change with version range, build identity requirements, and review record |
| UNKNOWN-002 | Hosted GitHub Actions behavior on the aligned commit | Local CI does not prove hosted runner permissions or artifact behavior | Successful protected-branch workflow run |
| UNKNOWN-003 | Shadow-mode mismatch and reliability window | Assurance must not become authoritative | Recorded comparison against existing gates with no unresolved mandatory semantic mismatch |
| UNKNOWN-004 | Public package-channel publication and clean install | Local offline tarball installation is proven; registry distribution is not | Successful clean consumer install from the approved package channel |
| UNKNOWN-005 | Production signing and complete audit bundles | Decisions remain unsigned and local-trust only | Approved signer/verifier adapters and audit-bundle profile |
| UNKNOWN-006 | Actual `l9-harness` repository baseline | The revised Harness artifact is a locked specification, not an implementation audit | Accessible repository and pinned commit |

UNKNOWN-001 through UNKNOWN-003 block authority promotion. UNKNOWN-006 blocks claims that Harness implementation already conforms.
