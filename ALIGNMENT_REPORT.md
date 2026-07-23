# Recursive L9 Alignment Report

## Alignment summary

**Decision:** `ALIGNED_WITH_EXTERNAL_UNKNOWNS`

L9 Assurance is a Python-authoritative assurance-plane utility library and CLI. It does not implement a runnable node, Gate client, workflow orchestrator, or transport publisher. The active architecture remains narrow: admit evidence, evaluate controls, issue and verify decisions, and prove producer/consumer conformance.

## Source authority used

1. Latest explicit execution request
2. `.l9/repo-spec.yaml`
3. `REWRITE_EXECUTION_SPEC.md`
4. JSON Schemas, registries, controls, profiles, and policy
5. Accepted ADRs and decision log
6. Behavior, replay, security, conformance, and performance tests
7. Supporting documentation
8. `Unknown`

## Critical violations

None.

## High violations

None after remediation.

## Remediated findings

| ID | Severity | Finding | Correction | Validation |
|---|---|---|---|---|
| ALIGN-001 | high | Per-file L9 metadata existed only as prose and could drift from the repository | Added `.l9/L9_META.jsonl`, deterministic generation, full file coverage, and a dedicated alignment gate | `python scripts/generate_l9_meta.py --check`; `python scripts/validate_l9_alignment.py` |
| ALIGN-002 | high | In-memory replay state was appendable but unbounded and allowed direct rebinding through its public method | Added a fixed configurable capacity, prohibited eviction, made identity bindings immutable, and failed closed on capacity or conflict | replay behavior tests and alignment gate |
| ALIGN-003 | medium | Gate and TransportPacket laws were described but applicability was not machine-readable | Added `.l9/repo-spec.yaml` with no-egress Gate applicability, TransportPacket authority, and PacketEnvelope prohibition | alignment gate and architecture tests |
| ALIGN-004 | medium | Wheel validation could observe an ambient installation before installing the candidate wheel | Force-installed the wheel first and asserted the imported package originates inside the isolated environment | `python scripts/ci.py` distribution stage |
| ALIGN-005 | medium | File enumeration logic was duplicated across inventory and completeness tooling | Added one deterministic repository-file utility consumed by inventory, metadata, and completeness gates | full CI and byte-convergence pass |

## Boundary map

| Layer | Owns | Does not own |
|---|---|---|
| `contracts` | schemas, time parsing, schema validation | routing, execution, mutation |
| `evidence` | canonicalization, bounds, admission, replay | check execution, publication |
| `controls` | profile resolution and control assessment | policy authority, orchestration |
| `policy` | policy overlays and waiver evaluation | workflow state, repair |
| `evaluator` | pure verdict and decision construction | filesystem, network, process, ambient clock |
| `conformance` | producer admission and consumer byte preservation | CI orchestration |
| `cli` | single local composition ingress | Gate state, peer routing, GitHub publication |
| `testing` | test-only builders and signer | production trust |

## TransportPacket compliance

- `TransportPacket` remains the constellation inter-node wire format.
- Assurance does not perform inter-node egress or routing.
- TransportPacket validation enters Assurance as a canonical SDK observation.
- `PacketEnvelope` is forbidden in runtime source and canonical schemas.
- Raw Python mappings are internal representations of locked JSON contracts, not an alternative wire protocol.

## Gate routing compliance

`not_applicable_no_egress`

Assurance emits canonical files for `l9-ci-core` to transport and publish. It has no peer URLs, node registry, direct node dispatch, retry routing, resilience policy, or workflow state. Adding those concerns would violate the repository boundary.

## Authority boundary compliance

Pass. The repository owns evidence trust and deterministic decisions only. Check execution remains in `l9-ci-sdk`; coordination remains in `l9-harness`; hosted CI and publication remain in `l9-ci-core`; mutation remains in `PR_Repair`; debt and editor behavior remain in their sibling repositories.

## File structure compliance

Pass. Runtime code is under `src/l9_assurance/`; canonical protocol authority remains at repository root; embedded protocol files are generated and digest-verified; repository governance is under `.l9/`; no forbidden runtime responsibility package exists.

## Schema and field compliance

Pass with a locked external-interface exception:

- Internal Python identifiers use `snake_case`.
- Existing public JSON Schema fields retain their versioned camelCase names to avoid a silent wire-contract break.
- Root `.yaml` protocol files are restricted to deterministic JSON-compatible YAML and parsed with `json.loads`, a stricter subset than `yaml.safe_load`.
- No alias-based compatibility layer is introduced.

## Security and observability compliance

Pass for Release 2.1.1 scope:

- no runtime network or process imports;
- no `eval`, `exec`, or `compile`;
- no runtime `print` bypassing the CLI I/O boundary;
- no PII logging surface;
- evaluator remains I/O-free;
- replay state is append-only, immutable, bounded, and fail-closed;
- protocol discovery rejects symbolic links, path escapes, oversized files, and malformed JSON.

An append-only external audit log is deferred because Release zero does not implement remote signing or audit-bundle persistence. That fact remains an explicit external Unknown rather than a pretend implementation.

## Testing and validation compliance

Pass. Behavior tests cover evidence, policy, verdict, replay, conformance, CLI, distribution, security, and performance. Source scans are supporting architecture gates, not substitutes for behavior tests.

## Overbuilt versus underbuilt

- **Overbuilt:** none identified after the Python migration. No service, database, plugin system, or network layer is present.
- **Underbuilt and resolved:** per-file metadata, replay capacity, explicit applicability records, and isolated distribution provenance.
- **Intentionally deferred:** production signer/verifier, remote audit bundle, activated SDK trust, and authoritative promotion evidence.

## Correction roadmap

All repository-local alignment corrections are complete. Remaining work is external governance and integration evidence:

1. approve the production-trusted `l9-ci-sdk` identity and version range;
2. run the hosted Python 3.11–3.13 matrix;
3. collect shadow-mode parity evidence;
4. validate pinned installation from the approved package channel;
5. implement an approved production signer and audit-bundle profile.

## Minimum safe next action

Publish this tree to a review branch and run the protected hosted CI matrix without promoting Assurance to blocking authority.

## Convergence block

```yaml
convergence_status: converged
recursive_passes_run: 10
same_output_after_multiple_passes: true
source_intent_preserved: true
scope_drift_detected: false
l9_boundaries_preserved: true
repository_local_violations_remaining: 0
external_unknowns_remaining: 5
execution_readiness: pass
```
