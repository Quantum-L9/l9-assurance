# Executive Architect Audit

## L9 Assurance v2 ↔ L9 Harness v2 Locked Alignment

```yaml
audit:
  date: 2026-07-22
  assurance_repository: Quantum-L9/l9-assurance
  assurance_commit: be8100797cae30eeca31763ea74c5f7eca7bde82
  harness_specification: L9_HARNESS_V2_LOCKED_ASSURANCE_ALIGNMENT_BUILD_SPEC_v1.2.0.md
  harness_repository: Quantum-L9/l9-harness
  harness_repository_status: UNAVAILABLE_OR_NOT_FOUND
  mode: architecture_contract_alignment
  implementation_mutation: false
```

## Adapter Routing

- Universal evidence review core: active.
- Primary repository and architecture adapters: active.
- Artifact-quality and validation adapters: active.
- L9 platform and repository-taxonomy adapters: active because this audit evaluates explicit L9 constellation ownership, protocol, and repository boundaries.
- Odoo adapters: not applicable.

## 1. Executive Decision

```yaml
alignment_decision: ARCHITECTURALLY_ALIGNED_WITH_BLOCKING_CONTRACT_GAPS
boundary_alignment: PASS
release_zero_identity_alignment: PASS
assurance_runtime_validation: PASS
harness_spec_internal_consistency: PARTIAL
cross_repository_contract_consumability: FAIL_BLOCKED
harness_phase_0_and_1: GO
harness_phase_2: GO_WITH_CONTRACT_PINNING
harness_phase_3_and_later_production_adapters: NO_GO
future_authoritative_ci_dependency_on_harness: PROHIBITED_WITHOUT_AMENDMENT
```

The Harness specification gets the permanent responsibility split right:

- CI Core orchestrates and publishes.
- CI SDK executes checks and emits observations.
- Harness exercises, preserves, conforms, replays, and compares.
- Assurance admits, evaluates, and decides.

No architectural rewrite of either role is required. The remaining problems are contract-surface defects and publication gaps at the Assurance-to-Harness seam.

## 2. Evidence Scope

### Inspected

1. Live Assurance v2 commit `be8100797cae30eeca31763ea74c5f7eca7bde82`.
2. Uploaded Harness specification pack v1.2.0.
3. Assurance source-only mirror whose Git blob IDs matched the live repository for:
   - `package.json`;
   - `packages/cli/src/commands.ts`;
   - `packages/cli/src/engine.ts`.
4. Actual `l9-assurance plan` output for `l9.pull-request@1.0.0`.
5. Assurance workspace package dry-run output.
6. TypeScript and Python canonicalization behavior on edge-case vectors.
7. Full Assurance validation ladder.

### Not inspected

The `Quantum-L9/l9-harness` repository could not be resolved through the connected GitHub installation and did not resolve as a public repository. Therefore this audit does not claim implementation-level Harness conformance, migration readiness, import correctness, or test status.

## 3. Validation Executed

The source-equivalent Assurance tree passed:

- generated binding drift;
- formatting;
- lint;
- 18-schema validation;
- registry validation;
- package-boundary validation;
- fixture validation;
- build-evidence validation;
- completeness validation;
- TypeScript typecheck;
- eight-workspace build;
- 62 behavior tests across eight categories;
- deterministic replay.

Result: `13 commands passed`.

This proves the Assurance implementation is internally coherent. It does not prove the external Harness contract is fully consumable.

## 4. Alignment Matrix

| Dimension | Result | Evidence | Decision |
|---|---|---|---|
| Responsibility boundary | PASS | Assurance `README.md`, `ARCHITECTURE.md`; Harness §§1, 7, 20–21 | Locked correctly |
| Authoritative CI path excludes Harness | PASS | Harness §§1, 21, 54 | Preserve |
| Release-zero subject | PASS | `git-revision` in profile and spec | Exact match |
| Producer identity | PASS_WITH_GOVERNANCE_BLOCK | `l9-ci-sdk`; producer registry status `pending` | Phase 0 only until trusted |
| Six SDK check IDs | PASS | `registry/checks.yaml`; Harness §2.3 | Exact match |
| Seven Assurance controls | PASS | `profiles/pull-request/profile.yaml`; actual plan | Exact match |
| Revision-consistency ownership | PASS | Assurance-derived control, no fake SDK check | Preserve |
| Verdict semantics | PASS | pass/fail/conditional/indeterminate | Exact match |
| No competing envelope | PASS | No PacketEnvelope; filesystem JSON protocol | Preserve |
| Resource ceilings | PASS | Harness §31 equals Assurance defaults | Exact match |
| Assurance CLI command names | PASS | plan/admit/evaluate/verify/conformance/simulate | Match |
| Assurance plan schema | FAIL_BLOCKED | TypeScript interface only; no JSON Schema | Must add upstream |
| Expected-evidence plan detail | FAIL_BLOCKED | Actual plan lacks versions, cardinality, freshness, binding requirements | Must add upstream |
| Artifact output layout | FAIL_INTERNAL_CONTRADICTION | Harness §18 vs §§19–20 and actual CLI | Amend Harness spec |
| Cross-language canonicalization | FAIL_BLOCKED | Python and TypeScript differ on valid JSON numbers | Fix upstream and publish vectors |
| Installable Assurance CLI | FAIL_BLOCKED | CLI tarball excludes controls/registries/profiles it loads | Publish self-contained release surface |
| Producer conformance CLI depth | PARTIAL | CLI is structural-only; package API is admission-aware | Wire CLI to conformance package |
| Tool version/build identity | PARTIAL | Package version exists; no machine-readable CLI build metadata | Add capability/version command |
| Non-authoritative invocation marker | PARTIAL_AMBIGUOUS | Marker location is unspecified | Bind marker to Harness run manifest only |
| Hosted CI evidence | UNKNOWN | No workflow runs/statuses found for live commit | Required before authority promotion |

## 5. Material Findings

### A-001: Assurance plan is not a versioned protocol object

```yaml
severity: critical
priority_score: 26
confidence: confirmed
blocks_release: true
owner: l9-assurance
```

**Evidence**

- Harness §15 requires an authority-published JSON Schema, schema identity, version, digest, and expected evidence.
- Assurance exposes only the TypeScript `AssurancePlan` interface.
- Actual plan output contains subject, profile, controls, producer IDs, check IDs, and waiver booleans.
- It does not contain:
  - `schema` or `schemaVersion`;
  - plan digest;
  - check versions;
  - evidence cardinality;
  - accepted execution statuses;
  - freshness requirements;
  - exact-revision requirement;
  - configuration-digest requirement;
  - evidence type/output schema.

**Impact**

Harness cannot safely parse or deterministically compile SDK execution requirements without either duplicating Assurance control semantics or joining information from private/unpublished assets.

**Required correction**

Add `schemas/v1/assurance-plan.schema.json` and make `plan` emit a self-describing canonical object containing:

```yaml
schema: l9.assurance-plan
schemaVersion: 1.0.0
planDigest: sha256:...
subject: ...
profile:
  id: l9.pull-request
  version: 1.0.0
  digest: ...
policy:
  id: l9.organization-default
  version: 1.0.0
  digest: ...
requirements:
  - producer: l9-ci-sdk
    producerVersionRange: ...
    check: l9.lint
    checkVersion: 1.0.0
    outputSchema: l9.observation/v1
    cardinality: {minimum: 1, maximum: 1}
    acceptedExecutionStatuses: [passed, failed, error, skipped]
    revisionBound: true
    configurationDigestRequired: true
    freshness: {mode: revision-bound}
```

### A-002: The packaged Assurance CLI is not self-contained

```yaml
severity: critical
priority_score: 26
confidence: confirmed
blocks_release: true
owner: l9-assurance
```

**Evidence**

- `@l9/assurance-cli` packages only `dist/`.
- `loadBuiltInConfiguration()` reads:
  - `controls/ci/`;
  - `registry/producers.yaml`;
  - `registry/checks.yaml`;
  - `profiles/pull-request/profile.yaml`;
  - `profiles/pull-request/policy.yaml`.
- Those assets are absent from the CLI tarball.

**Impact**

Harness cannot install a pinned Assurance CLI and execute the locked commands without also carrying an Assurance repository checkout or reconstructing the configuration tree.

**Required correction**

Create one canonical, digest-bound distribution surface:

1. Preferred: `@l9/assurance-protocol` containing schemas, registries, controls, profiles, policies, conformance fixtures, canonicalization vectors, and manifest.
2. Package the CLI with its default Release-zero protocol bundle or require `--protocol-bundle` explicitly.
3. Resolve bundled assets package-relatively, never from ambient current working directory.
4. Publish package/tarball digest and source commit.

### A-003: TypeScript and Python canonicalization are not equivalent

```yaml
severity: critical
priority_score: 25
confidence: confirmed
blocks_release: true
owner: l9-assurance
```

**Executed evidence**

| Value | TypeScript | Python binding |
|---|---|---|
| `-0` | `0` | `-0.0` |
| `1e-7` | `1e-7` | `1e-07` |
| `1e20` | `100000000000000000000` | `1e+20` |

The existing cross-language test uses a simple subject object and therefore does not prove numeric equivalence.

**Impact**

A Python Harness can calculate a different semantic digest for an otherwise equivalent Assurance object. This breaks replay, plan locking, bundle integrity, evidence comparison, and shadow parity.

**Required correction**

- Adopt and name a canonical JSON standard, preferably RFC 8785 JCS with explicit deviations only where documented.
- Generate both TypeScript and Python implementations from one conformance contract.
- Publish adversarial vectors covering negative zero, exponents, large magnitudes, Unicode, escaped controls, key ordering, malformed surrogates, arrays, and nested values.
- Block `sha256_digest()` export in Python until it passes every canonicalization vector.

### A-004: Harness artifact layout contradicts the actual Assurance CLI

```yaml
severity: high
priority_score: 23
confidence: confirmed
blocks_release: true
owner: l9-harness-spec
```

**Evidence**

- Harness §18 places `admission-report.json` under `artifacts/assurance/`.
- Harness §19.2 invokes `evidence admit --output artifacts/admission`.
- Assurance writes:
  - `artifacts/admission/admission-report.json`;
  - `artifacts/admission/accepted/*.json`.
- Assurance evaluation writes decision artifacts under the separately selected output directory.

**Required correction**

Lock this layout:

```text
artifacts/
├── observations/
├── supporting/
├── admission/
│   ├── admission-report.json
│   └── accepted/
└── assurance/
    ├── decision.json
    ├── decision.summary.md
    └── evidence-manifest.json
```

Do not move or copy `admission-report.json` into `assurance/` unless it is explicitly recorded as a Harness-owned projection.

### A-005: CLI producer conformance is shallower than the locked Harness requirement

```yaml
severity: high
priority_score: 23
confidence: confirmed
blocks_release: true
owner: l9-assurance
```

**Evidence**

The CLI `conformance producer` checks structural observation validity and producer ID only. The programmatic conformance package supports registry-aware admission, stale evidence, unauthorized checks, duplicate/replay, revision mismatch, and reason-code expectations.

**Impact**

A Python Harness using the public CLI cannot exercise the full producer conformance contract described in Harness §§34 and 47.

**Required correction**

Wire the CLI command to `@l9/assurance-conformance` and require explicit:

- subject;
- producer registry;
- check registry;
- received/evaluation time;
- conformance case manifest;
- expected status/reason codes.

### A-006: Assurance lacks a machine-readable version/build/capability handshake

```yaml
severity: high
priority_score: 20
confidence: confirmed
blocks_release: true
owner: l9-assurance
```

**Evidence**

Harness §20.2 requires exact tool version and build digest capture. Assurance has package version `2.0.0`, but the CLI has no `version`, `capabilities`, or `contract manifest` command.

**Required correction**

Add:

```text
l9-assurance capabilities --json
```

Minimum output:

- implementation version;
- source commit;
- build digest;
- Node/runtime requirements;
- supported commands;
- supported schema IDs/versions;
- schema registry digest;
- protocol bundle digest;
- profile/policy/control digests;
- conformance fixture version;
- canonicalization vector version;
- trust level and signing state.

### A-007: Harness authority still points at a historical rewrite branch

```yaml
severity: high
priority_score: 22
confidence: confirmed
blocks_release: false
owner: l9-harness-spec
```

The Harness spec identifies `rewrite/v2-assurance-plane` as its target authority. The implementation is now on `main` at commit `be8100797cae30eeca31763ea74c5f7eca7bde82`.

**Required correction**

Replace branch authority with:

```yaml
assurance_authority:
  repository: Quantum-L9/l9-assurance
  release: 2.0.0
  commit: be8100797cae30eeca31763ea74c5f7eca7bde82
  protocol_bundle_digest: UNKNOWN_PENDING_PUBLICATION
```

A mutable branch must never be the final cross-repository contract pin.

### A-008: Non-authoritative invocation markers have no assigned owner object

```yaml
severity: medium
priority_score: 17
confidence: confirmed
blocks_release: false
owner: l9-harness-spec
```

Harness §20.3 requires `initiated_by`, `mode`, and `publication_authority`, while also requiring exact Assurance output preservation.

**Required correction**

State explicitly that these fields belong only to:

- Harness execution record;
- Harness run manifest;
- Harness summary.

They MUST NOT be inserted into or modify `decision.json`, `admission-report.json`, or any Assurance-owned object.

### A-009: Production SDK trust remains unresolved

```yaml
finding_type: known_external_blocker
severity: critical
confidence: confirmed
owner: governance_and_l9-ci-sdk
```

The Assurance producer registry marks `l9-ci-sdk` as `pending`, has a candidate range of `>=2.0.0 <3.0.0`, and has no allowed production version. This is correctly represented as `UNKNOWN-001` and correctly blocks production admission.

**Decision**

This is aligned behavior, not an Assurance defect. Harness may proceed with structure, subject locking, protocol bundle ingestion, and fixture conformance. It must not claim production end-to-end readiness.

## 6. Required Correction Sequence

### P0: Contract unlock

1. Publish Assurance plan schema and full evidence requirement model.
2. Publish self-contained protocol bundle and manifest.
3. Fix cross-language canonicalization and publish vectors.
4. Add Assurance capabilities/build handshake.

### P1: CLI parity

5. Wire full producer conformance through the public CLI.
6. Add install-from-tarball clean-consumer tests.
7. Record package/source/protocol digests in command outputs or invocation metadata.

### P2: Harness specification v1.3.0

8. Pin live Assurance commit/release instead of rewrite branch.
9. Add `artifacts/admission/` to the canonical layout.
10. Clarify ownership of non-authoritative invocation markers.
11. Refresh `ASSURANCE_ALIGNMENT_MATRIX.yaml`, `VALIDATION.md`, and blocked-contract status.
12. Add the captured real plan as evidence only, not as a canonical schema.

### P3: External gates

13. Lock the SDK public invocation/capability contract.
14. Approve minimum trusted SDK version and build identity.
15. Build Harness Phase 3 adapter only after P0–P3 contracts are immutable.
16. Run hosted shadow comparison before any future authority proposal.

## 7. Go / No-Go

| Scope | Decision |
|---|---|
| Harness specification architecture | GO_WITH_AMENDMENT |
| Harness Phase 0 repository inventory/contracts | GO |
| Harness Phase 1 skeleton/boundary tests | GO |
| Harness Phase 2 subject/toolchain locking | GO_WITH_PINNED_ASSURANCE_COMMIT |
| Harness plan parser in release mode | NO_GO |
| Harness production Assurance adapter | NO_GO |
| Harness production SDK adapter | NO_GO |
| Harness shadow mode using fixture contracts | CONDITIONAL_GO |
| Harness in authoritative CI path | PROHIBITED |

## 8. Unknowns

1. Actual `l9-harness` repository baseline and implementation state.
2. Published Assurance package/release channel and immutable artifact digest.
3. Hosted GitHub Actions result for Assurance commit `be810079...`.
4. Approved `l9-ci-sdk` invocation contract and capability manifest.
5. Minimum trusted SDK version and build identity.
6. Final canonical JSON standard decision.

## Recommended Smallest Next Action

Publish the Assurance protocol bundle, assurance-plan schema, and canonicalization vectors as one immutable digest-bound release artifact before any Harness production adapter is implemented.

## 9. Convergence

```yaml
convergence:
  passes:
    - boundary_and_authority
    - release_zero_identity
    - cli_and_artifact_flow
    - plan_protocol
    - package_distribution
    - canonicalization
    - conformance
    - security_and_resource_limits
    - operational_readiness
    - adversarial_contradiction_scan
  findings_stable: true
  architecture_rewrite_required: false
  contract_remediation_required: true
  smallest_safe_next_action: publish the Assurance protocol bundle, plan schema, and canonicalization vectors before implementing the Harness production adapters
```
