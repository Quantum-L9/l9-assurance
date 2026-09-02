# L9 CI Debt Constellation v0.1

A single statement of what the constellation does and does not do in v0.1,
maintained here because `l9-assurance` holds the only evidence-admission
authority. Each repository carries its own boundary document; this is the map.

## Production-real in v0.1

- **`l9-ci-core` invokes `l9-ci-sdk`.** This was already the constellation's
  only live cross-repository execution path and remains so.
- **`l9-ci-sdk` produces canonical findings and finding bundles.**
- **`l9-assurance` admits SDK finding-carrying observations.** The artifact
  reference schema accepts `sdkVersion` (D-010) and `l9-ci-sdk` is a trusted
  producer for `>=2.0.0 <3.0.0` (D-009). Proven by execution in
  `tests/cross_repo/`, not by fixture.
- **`PR_Repair` refuses unguarded range replacement.** `expected_block` is
  mandatory, and its LLM proposer binds instructions to on-disk content.
- **`l9-ci-debt-intelligence` declares only real production inputs.** One
  producer is active; four are marked `planned` and refused at ingestion.

## Intentionally not production-real in v0.1

None of the following is a defect to be worked around. Each is a boundary that
v0.1 states rather than blurs.

| Not real | Where it is recorded |
|---|---|
| Full finding → repair → re-assurance convergence | this document |
| Assurance as a blocking gate in any repository | `docs/release-v0.1.md`, UNKNOWN-003 |
| Resolver → PR_Repair delegation | `l9-ci-debt-resolver/docs/repair-authority-v0.1.md` |
| `PR_Repair` as part of the debt pipeline | `PR_Repair/GOVERNANCE.md` |
| Direct LSP consumption of `l9.sdk-finding/v1` | `l9-ci-debt-lsp/docs/inputs-v0.1.md` |
| Harness as an authoritative verdict owner | `l9-harness/docs/boundaries-v0.1.md` |
| SDK capability manifest as an SDK output | `l9-harness/docs/boundaries-v0.1.md`, UNKNOWN-005 |
| Observability as scheduler, gate, retry owner, or dispatcher | `l9-observability-core/docs/consumption-status-v0.1.md` |
| Four declared corpus producers | `l9-ci-debt-intelligence/docs/integration-backlog.md` |

## Safety posture

- Repair mutation is off by default in `PR_Repair`: explicit opt-in variable,
  `dry_run` default, push hardcoded off, fork PRs refused.
- `l9-assurance` is the only declared evidence-admission authority. No other
  component's self-verification is an admission.
- Producer trust fails closed. An unactivated producer quarantines rather than
  being admitted, and a pending-registry fixture keeps that path covered.
- Phantom contracts are declared `planned` and refused at ingestion, not
  silently accepted.

## Known limitations

- The convergence loop is not wired. Every repair path that exists terminates
  in self-verification.
- Per-finding evidence lineage does not cross the SDK → assurance seam. Only
  the whole-bundle artifact digest survives, so assurance can verify that a
  bundle produced a set of findings but cannot attribute an individual finding
  to the evidence records behind it.
- Three disjoint failure taxonomies exist with no mapping between them
  (`l9-observability-core` `FailureClass`, the resolver's classification
  categories, the SDK's `ProviderFailureType`). Latent while nothing routes
  failures between those components.
- `l9-observability-core` is unconsumed by the runtime pipeline.

## The v0.1 ship test

Ship when: the constellation has one real admitted SDK → assurance finding
seam, no unguarded repair mutation path, and no machine-readable production
registry claiming phantom integrations are active.

Do not ship while: any repository claims an end-to-end debt repair pipeline
exists when the runtime path still terminates at SDK artifacts or PR_Repair
self-verification.
