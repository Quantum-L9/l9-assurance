# Change Summary

Release `2.0.1` resolves the five blocking Assurance-to-Harness contract gaps found by the architect audit.

| Item | Defect | Resolution |
|---|---|---|
| 1 | Plan output was a thin TypeScript shape without a locked wire schema or complete execution requirements | Added `l9.assurance-plan@1.0.0`, full resolved requirements, source and protocol digests, canonical plan digest, and `verifyPlan` |
| 2 | Published CLI required an Assurance repository checkout | Added a generated, digest-verified 37-file protocol bundle and clean offline tarball-consumer validation |
| 3 | Python canonical JSON diverged from TypeScript | Added `l9.canonical-json/v1` vectors and generated Python serialization matching TypeScript edge semantics |
| 4 | Harness admission artifacts had contradictory locations | Locked admission under `artifacts/admission/` and decisions under `artifacts/assurance/` |
| 5 | Public producer conformance checked only shape and producer ID | Wired the CLI to registry-aware admission and exact reason-code behavior |

No scanner, runner, GitHub publication, repair, LSP, debt-mining, or arbitrary plugin execution responsibility was added to Assurance.
