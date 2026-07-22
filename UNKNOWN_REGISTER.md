# Unknown Register

The repository is locally complete for Release zero. The following facts require external execution or governance and are therefore not invented.

| ID | Unknown | Effect | Resolution evidence |
|---|---|---|---|
| UNKNOWN-001 | Minimum production-trusted `l9-ci-sdk` version and build identity | Checked-in producer remains pending; production observations are quarantined | Approved producer registry change with version range, build identity requirements, and review record |
| UNKNOWN-002 | Hosted GitHub Actions behavior on the rewrite branch | Local CI does not prove hosted runner permissions, artifact transport, or publication behavior | Successful protected-branch workflow runs from the published rewrite branch |
| UNKNOWN-003 | Shadow-mode mismatch and reliability window | Assurance must not become authoritative | Recorded comparison against existing gates with no unresolved mandatory semantic mismatch |
| UNKNOWN-004 | Registry installation and package publication | Only workspace package dry-runs are proven | Successful clean consumer install from the approved package channel |
| UNKNOWN-005 | Production signing and complete audit bundles | Decisions remain unsigned and local-trust only | Later release implementing approved signer/verifier adapters and audit bundle profile |

None of these Unknowns block branch review. UNKNOWN-001 through UNKNOWN-003 block authority promotion.
