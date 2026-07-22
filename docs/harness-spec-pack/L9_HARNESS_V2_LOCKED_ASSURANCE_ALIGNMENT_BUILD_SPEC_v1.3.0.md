# L9 Harness v2 Locked Assurance v2 Alignment Build Specification

## 0. Specification Identity

```yaml
specification:
  id: l9-harness-v2-assurance-v2-locked-alignment-build
  version: 1.3.0
  status: locked_architecture_with_assurance_contract_seam_resolved
  repository: Quantum-L9/l9-harness
  target_name: L9 Harness v2
  target_ecosystem: Quantum-L9 CI Constellation
  primary_alignment_authority:
    specification_id: l9-assurance-v2-clean-rewrite-execution
    version: 2.0.0
    status: locked
    target_release: 2.0.0
    target_branch: main
    source_baseline_commit: be8100797cae30eeca31763ea74c5f7eca7bde82
    aligned_candidate_release: 2.0.1
    protocol_bundle_digest: 46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a
  implementation_strategy: controlled_clean_rewrite
  specification_scope: target architecture, contracts, migration, validation, and release gates
  normative_language: RFC_2119
  primary_runtime: Python 3.11+
  protocol_boundary: assurance_json_schema_2020_12_artifacts
  current_repository_baseline:
    status: UNKNOWN
    reason: actual l9-harness repository contents and baseline commit remain unverified
  release_zero_alignment:
    subject_kind: git-revision
    authoritative_producer: l9-ci-sdk
    assurance_profile: l9.pull-request@1.0.0
    authoritative_consumer_and_publisher: l9-ci-core
    harness_role: optional_local_execution_conformance_replay_and_shadow_tool
  upstream_contract_state:
    assurance_subject_observation_and_decision_schemas: LOCKED_BY_ASSURANCE_V2
    assurance_release_zero_profile_and_check_ids: LOCKED_BY_ASSURANCE_V2
    assurance_plan_command_behavior: LOCKED_BY_ASSURANCE_V2_0_1
    assurance_cli_distribution: SELF_CONTAINED_EMBEDDED_PROTOCOL_BUNDLE
    assurance_producer_conformance: REGISTRY_AWARE_ADMISSION
    assurance_plan_output_json_schema: LOCKED_L9_ASSURANCE_PLAN_V1
    sdk_public_invocation_contract: UNKNOWN
    sdk_capability_manifest_schema: UNKNOWN
    minimum_trusted_sdk_version: UNKNOWN
    assurance_canonicalization_vectors: LOCKED_L9_CANONICAL_JSON_V1
  implementation_gate: phase_0_harness_repository_inventory_and_sdk_contract_lock
  repository_mutation_scope: specification_artifacts_only
  git_mutation_authorized: false
  license_policy: preserve_verified_existing_license_or_record_UNKNOWN
```

## 1. Executive Decision

`l9-harness` SHALL be rebuilt as the deterministic local execution, protocol-exercise, observation-preservation, conformance-driving, replay, and shadow-comparison tool for the Quantum-L9 CI constellation.

It SHALL align to the locked L9 Assurance v2 Release-zero architecture:

```text
l9-ci-core                  orchestrates hosted CI and publishes decisions
l9-ci-sdk                   executes checks and emits canonical observations
l9-assurance                admits evidence, evaluates controls, and issues decisions
l9-harness                  exercises the same public contracts locally, preserves outputs,
                            drives conformance, and reproduces runs without entering authority
l9-ci-debt-resolver         diagnoses failed controls and selects repair strategy
PR_Repair                   performs governed mutation and emits repair observations
l9-ci-debt-intelligence     learns from historical failures and builds candidate prevention packs
l9-ci-debt-lsp              presents approved prevention rules in editors
```

The authoritative Release-zero path SHALL remain:

```text
l9-ci-core
  -> pinned l9-ci-sdk
  -> canonical observations
  -> l9-ci-core byte-preserving transport
  -> l9-assurance admission and evaluation
  -> immutable decision
  -> l9-ci-core publication
```

Harness SHALL NOT be a required hop in that path. It MAY reproduce the same SDK execution locally, produce an Assurance-compatible artifact directory, run published producer and consumer conformance fixtures, invoke Assurance non-authoritatively, and compare its outputs with hosted CI. A future authoritative CI dependency on Harness requires a separate amendment to the CI Core and Assurance integration contracts plus measured shadow-mode evidence.

The permanent boundary is:

```text
SDK produces observations.
Harness exercises and preserves public contracts.
Assurance determines admissibility and verdict.
CI Core transports and publishes authority.
```

Harness MUST NOT become a second Assurance engine, second SDK implementation, second CI control plane, repair engine, policy authority, evidence-admission layer, or proprietary transport envelope.

The optimized Harness flow is:

```text
exact Git revision
  + pinned public Assurance schemas and Release-zero profile
  + pinned SDK public contract
  + deterministic Harness run profile
        ↓
controlled local SDK execution
        ↓
canonical SDK observations preserved byte-for-byte
        ↓
Assurance-compatible observations/ and supporting/ export
        ↓
optional non-authoritative Assurance admit/evaluate/simulate
        ↓
replayable Harness run bundle and conformance evidence
```

## 2. Source Authority and Interpretation

### 2.1 Federated authority model

Authority is domain-specific. No Harness document may override another repository's canonical ownership.

For Assurance protocol behavior, authority SHALL resolve in this order:

1. latest explicit user instruction;
2. locked `L9 Assurance v2 Clean Rewrite Execution Specification` version `2.0.0`;
3. locked Assurance JSON Schemas, registries, profiles, policies, conformance fixtures, and canonicalization vectors;
4. accepted cross-repository ADRs and contract amendments;
5. this Harness specification only where it constrains Harness-owned behavior without redefining Assurance semantics;
6. executable integration and replay tests;
7. explicitly recorded `UNKNOWN` values.

For SDK execution and observation semantics, authority SHALL resolve in this order:

1. released `l9-ci-sdk` public observation contracts and public invocation behavior;
2. Assurance producer and check registry records authorizing SDK outputs;
3. released SDK conformance fixtures and capability metadata;
4. this specification's adapter constraints;
5. verified SDK repository facts and tests;
6. explicitly recorded `UNKNOWN` values.

For Harness-owned behavior, authority SHALL resolve in this order:

1. this specification;
2. verified current `l9-harness` repository facts that do not conflict with the locked cross-repository boundary;
3. Harness ADRs, Harness-owned schemas, tests, and runbooks derived from this specification;
4. explicitly recorded `UNKNOWN` values.

Conflict rule: Assurance owns schema authority, evidence admission, controls, profiles, policies, waivers, unknown semantics, and decisions. SDK owns canonical check execution and observation emission. CI Core owns authoritative orchestration, byte-preserving transport, and publication. Harness owns optional local coordination, preservation, conformance driving, replay, shadow comparison, corpus staging, and guidance generation.

### 2.2 Interpretation rules

1. “Assurance” means the locked v2 clean-rewrite contract plus the aligned v2.0.1 protocol artifacts derived from source baseline `be8100797cae30eeca31763ea74c5f7eca7bde82`.
2. “Release zero” means the exact Assurance v2 slice: one `git-revision` subject, `l9-ci-sdk` producer, `l9.pull-request@1.0.0` profile, and `l9-ci-core` consumer.
3. “Harness” means this repository after the controlled rewrite.
4. “Observation” means an SDK-produced protocol object conforming to the canonical Assurance observation schema.
5. “Evidence” means an artifact accepted by Assurance. Harness MUST NOT label raw or merely validated observations as admitted evidence.
6. “Assurance input set” means the canonical `observations/` and optional `supporting/` directories supplied to Assurance. It is not a new protocol envelope.
7. “Harness run bundle” means a Harness-owned replay and audit package. It is never itself admitted evidence unless a future Assurance control explicitly authorizes a corresponding artifact type.
8. “Decision” means an immutable result issued by Assurance. Harness MUST NOT issue one.
9. “Simulation” means a permanently non-authoritative external Assurance invocation.
10. “Corpus” means reusable fixtures, scenarios, reproductions, and learning candidates. It is not a policy or trust registry.
11. “Profile” is ambiguous unless qualified: Assurance profiles own controls; Harness run profiles own execution mechanics only.

### 2.3 Locked Assurance v2 Release-zero facts

Harness SHALL encode or consume these facts without alteration:

```yaml
assurance_release_zero:
  subject_kind: git-revision
  producer_id: l9-ci-sdk
  profile: l9.pull-request@1.0.0
  consumer: l9-ci-core
  observation_checks:
    - l9.repository-metadata
    - l9.transport-packet
    - l9.sdk-validation
    - l9.lint
    - l9.tests
    - l9.mandatory-findings
  assurance_derived_control:
    - L9.CI.EVIDENCE_REVISION_CONSISTENCY@1.0.0
  canonical_artifact_directories:
    - observations/
    - supporting/
    - admission/
    - assurance/
  assurance_outputs:
    admission:
      - admission-report.json
      - accepted/
    decision:
      - decision.json
    - decision.summary.md
    - evidence-manifest.json
```

`L9.CI.EVIDENCE_REVISION_CONSISTENCY` is an Assurance control, not an SDK check. Harness SHALL enforce subject consistency as a local integrity invariant but SHALL NOT emit a fabricated SDK observation for this control.

### 2.4 L9 runtime-node applicability

`l9-harness` is a CI tooling repository, not an L9 runtime node. Gate-only egress, node-to-node routing, `derive_or_with_hop`, and runtime `TransportPacket` wire rules are therefore `NOT_APPLICABLE` to Harness-to-Assurance filesystem artifact exchange.

The Release-zero check `l9.transport-packet` evaluates whether the target repository satisfies its own TransportPacket requirements. It does not require the Harness to wrap Assurance artifacts in a `TransportPacket`. Harness MUST NOT emit `PacketEnvelope` or invent any competing cross-repository envelope.

Cross-repository protocol field names SHALL match the locked Assurance JSON Schemas exactly, even when another generic L9 kernel prefers snake_case. Harness-owned fields SHOULD follow the prevailing schema convention and SHALL never alias, translate, or mutate external protocol fields silently.

Harness implementation code SHALL use typed models or validated schema objects at material boundaries. Raw unvalidated dictionaries, hidden fallback parsing, direct node registries, and in-place mutation of imported protocol objects are prohibited. Repository-level L9 metadata coverage SHALL use `L9_META.yaml` and a file index where inline metadata would violate strict external schemas or generated artifacts.

## 3. Problem Statement

A harness that is not explicitly bounded against Assurance tends to accumulate dangerous overlap:

1. executing checks and also deciding whether they are sufficient;
2. normalizing findings and also redefining their semantics;
3. packaging evidence and also admitting it;
4. consuming policy and also silently interpreting policy;
5. reproducing failures and also planning repairs;
6. collecting historical examples and also auto-promoting new rules;
7. invoking local workflows and also becoming a generic orchestration system;
8. generating summaries and allowing the summary to become authoritative;
9. accepting branch names or dirty worktrees as if they were immutable subjects;
10. introducing fallback scanners that masquerade as canonical SDK producers;
11. maintaining local copies of Assurance schemas that drift from the authority;
12. mixing operational success with assurance pass/fail semantics;
13. conflating a completed harness run with a successful assurance decision;
14. allowing old evidence to survive a revision change;
15. producing non-replayable artifacts through wall-clock, locale, filesystem-order, or random-ID dependence.

L9 Harness v2 MUST remove these ambiguities.

## 4. Mission

For one exact Git revision, one locked Assurance Release-zero profile, one pinned SDK public contract, and one deterministic Harness run profile, L9 Harness v2 SHALL:

1. lock the exact repository and commit identity;
2. invoke only public, pinned SDK capabilities without redefining their semantics;
3. collect the six Release-zero SDK observations required by the Assurance profile when available;
4. preserve canonical observation bytes, producer identity, check identity, configuration digest, subject, status, findings, and artifacts;
5. preflight observation structure against pinned Assurance schemas without claiming admission;
6. export an Assurance-compatible artifact root containing `observations/` and optional `supporting/` exactly as the Assurance CLI expects;
7. record Harness-owned run, environment, execution, digest, and replay metadata outside the canonical Assurance input set;
8. drive Assurance-published producer and consumer conformance suites;
9. support deterministic replay and mismatch classification;
10. optionally invoke pinned Assurance `plan`, `evidence admit`, `evaluate`, `verify`, and `simulate` commands as separate non-authoritative local operations;
11. maintain a central, versioned corpus of fixtures and candidates without automatic promotion;
12. generate developer guidance projections without treating them as policy, evidence, or decision authority.

## 5. Goals

### 5.1 Primary goals

L9 Harness v2 MUST:

1. align exactly with the locked Assurance v2 subject, producer, check, artifact-reference, finding, observation, digest, profile, registry, and conformance contracts relevant to Release zero;
2. remain incapable of independently issuing assurance verdicts;
3. use exact immutable subject identities;
4. treat `l9-ci-sdk` as the only authorized Release-zero producer;
5. confine fallback scanning to explicit diagnostic-only output outside Release-zero Assurance inputs;
6. produce byte-preserving observation transport;
7. validate protocol versions before execution, Assurance input export, and optional run bundling;
8. reject unresolved mandatory evidence requirements before pretending a run is complete;
9. distinguish check failure from harness infrastructure failure;
10. support local-first and offline execution;
11. produce deterministic manifests and stable reason codes;
12. support fixture-driven TypeScript conformance and Python parity only when Assurance enables generated Python bindings;
13. support replay without requiring repository mutation;
14. separate corpus cache from corpus outbox;
15. prohibit automatic learning-candidate promotion;
16. expose structured JSON for every operational command;
17. generate `CLAUDE.md` and `.cursor/rules/l9.mdc` as non-authoritative projections;
18. remain independent of GitHub Actions internals;
19. remain independent of Assurance evaluator internals;
20. preserve exact revision invalidation after repair or any other mutation.

### 5.2 Secondary goals

L9 Harness v2 SHOULD:

1. support multiple repository topologies;
2. support multiple SDK language adapters without changing protocol semantics;
3. support scenario matrices and fault injection;
4. support corpus-backed regression reproduction;
5. support execution caching only when cache identity is exact and safe;
6. support remote or mounted central corpus storage through adapters;
7. support deterministic partial reruns;
8. support local assurance simulation using the released Assurance CLI;
9. support human-readable summaries derived from canonical JSON;
10. support performance benchmarking and resource ceilings;
11. support optional isolated containers while retaining a process adapter for lightweight runs;
12. support bundle export for offline verification.

## 6. Non-Goals

L9 Harness v2 MUST NOT:

1. issue `pass`, `fail`, `conditional`, or `indeterminate` assurance decisions;
2. implement Assurance control evaluation;
3. implement producer authorization policy;
4. manage waivers;
5. sign authoritative assurance decisions;
6. publish authoritative GitHub checks;
7. own hosted CI workflow topology;
8. replace `l9-ci-core`;
9. duplicate canonical scanner execution owned by `l9-ci-sdk`;
10. reinterpret SDK findings;
11. generate or apply source patches;
12. approve mutations;
13. replace `PR_Repair`;
14. diagnose failures beyond bounded execution and protocol diagnostics;
15. replace `l9-ci-debt-resolver`;
16. mine debt corpora or score recurrence as a primary responsibility;
17. publish prevention packs as approved;
18. serve editor diagnostics or code actions;
19. become an observability platform;
20. become a general-purpose DAG engine;
21. maintain a forked copy of Assurance schemas;
22. automatically trust the newest SDK, Assurance, producer, check, profile, or corpus version;
23. treat a successfully completed run as proof that controls passed;
24. treat a failed process as positive evidence of a code defect unless the SDK contract says so;
25. reuse revision-bound observations after the subject changes.

## 7. Constellation Responsibility Model

| Capability | Canonical owner | Harness relationship |
|---|---|---|
| Hosted CI orchestration and decision publication | `l9-ci-core` | Shadow comparator and optional execution helper only; never required in Release-zero authority |
| Check and scanner execution semantics | `l9-ci-sdk` | Invokes pinned public SDK interfaces; never reimplements canonical checks |
| Observation schemas and trust semantics | `l9-assurance` plus SDK check contracts | Validates compatibility and preserves bytes; never redefines fields |
| Evidence admission | `l9-assurance` | May invoke admission externally; local preflight is not admission |
| Controls, profiles, policy, waivers, unknowns, and verdicts | `l9-assurance` | Consumes references and outputs only; never owns semantics |
| Authoritative producer and check authorization | `l9-assurance` registries | Reads pinned registry records; cannot expand trust |
| Optional local scenario coordination | `l9-harness` | Locks inputs, invokes public SDK commands, records attempts, exports artifacts |
| Harness run bundles and replay | `l9-harness` | Owns replay metadata outside Assurance protocol authority |
| Producer and consumer conformance driving | `l9-assurance` owns fixtures; Harness runs them | Reports exact fixture outcomes without reinterpretation |
| CI failure diagnosis | `l9-ci-debt-resolver` | Exports reproducible runs and decisions as context; does not diagnose |
| Governed mutation | `PR_Repair` | Re-runs against a new revision; never applies or approves mutation |
| Historical pattern mining | `l9-ci-debt-intelligence` | Emits sanitized candidate corpus artifacts only |
| Editor diagnostics | `l9-ci-debt-lsp` | Generates static guidance projections only |
| Central observability | separate platform capability | Emits operational telemetry through a port, if configured |

## 8. Architectural Principles

### 8.1 Exact subject before execution

Harness MUST resolve and lock the exact subject before invoking checks.

For the initial production slice:

```text
subject.kind = git-revision
subject.repository = exact repository identity
subject.revision.commit = full commit SHA
subject.revision.treeDigest = optional but recommended
```

A branch name, tag name, pull-request number, or local path is not sufficient.

### 8.2 Execution is not evaluation

Harness execution answers:

```text
What ran?
Against what exact subject?
Using what tool and configuration?
What canonical observations were produced?
Can the run be reproduced and transported intact?
```

Assurance evaluation answers:

```text
Is the producer authorized?
Is the observation admissible?
What control does it satisfy?
What remains unknown?
What verdict follows?
```

Harness MUST never collapse these layers.

### 8.3 Protocol over implementation coupling

Harness MUST integrate with SDK and Assurance through:

1. versioned JSON contracts;
2. published CLI interfaces;
3. generated protocol bindings;
4. capability manifests;
5. conformance fixtures;
6. immutable digests.

It MUST NOT import private evaluator, registry, scanner, or policy modules from sibling repositories.

### 8.4 Byte-preserving observation transport

Once an SDK observation is emitted, Harness MUST preserve its exact bytes and separately record the authority-defined canonical payload digest. Structural preflight MUST operate on a parsed copy and MUST NOT rewrite the source artifact.

Harness MAY reference an observation from a Harness-owned index, but MUST NOT wrap or rewrite it as a competing protocol object. It MUST NOT:

1. change status values;
2. add or delete findings inside the observation;
3. rewrite producer identity;
4. recalculate semantic counts from a different interpretation;
5. alter the subject;
6. change check identity or version;
7. convert SDK errors into code failures;
8. attach a harness-generated verdict.

### 8.5 Fail closed on integrity, not on demonstrated defects

Harness MUST distinguish:

- **completed execution with failed checks**, which is valid producer output;
- **incomplete execution**, which means required output is missing;
- **invalid output**, which means protocol or integrity checks failed;
- **harness system failure**, which means the execution infrastructure malfunctioned.

A check failure is not a Harness failure if canonical observations were produced correctly.

### 8.6 Explicit unknowns and unresolved requirements

When Harness cannot resolve an assurance evidence requirement to an SDK capability, it MUST record an unresolved requirement and mark the run incomplete.

It MUST NOT:

1. silently skip the requirement;
2. substitute a similar check;
3. downgrade mandatory to advisory;
4. fabricate a passed observation;
5. invoke the fallback scanner under the SDK producer identity.

### 8.7 Deterministic core, impure shell

The application core MUST be deterministic. Time, environment, filesystem, process execution, network, corpus storage, and identifiers MUST enter through explicit ports.

### 8.8 Revision change invalidates run reuse

Any commit or tree change MUST create a new subject lock, run key, observation set, Assurance input export, Harness run bundle, and optional Assurance decision capture.

### 8.9 Corpus candidates do not promote themselves

Harness MAY produce candidate fixtures, scenarios, reproductions, or rule-test examples. It MUST write them to an outbox and require an external review and promotion process.

### 8.10 Projections are not authorities

Markdown summaries, `CLAUDE.md`, `.cursor/rules/l9.mdc`, console output, dashboards, and reports MUST be derived projections. Canonical JSON and authoritative external protocol artifacts remain controlling.

### 8.11 SDK execution semantics are not duplicated

Harness MAY coordinate SDK capability invocations, but the SDK MUST remain the owner of scanner configuration semantics, stage semantics, finding normalization, and canonical observation emission. Harness MUST NOT maintain a second implementation of any canonical SDK check.

### 8.12 Writes are explicit and confined

Harness MUST NOT modify repository source code, apply repairs, or change governed files during `plan`, `run`, `collect`, `package`, `verify`, `replay`, or `conformance`.

Explicit write commands MAY create or update only Harness-owned configuration, generated guidance, corpus outbox candidates, and run artifacts within declared roots. Every write MUST be requested, path-confined, atomic, and represented in structured output.

## 9. Target Operating Model

L9 Harness v2 MUST operate in four modes.

### 9.1 Local development mode

Purpose:

- reproduce checks;
- generate canonical observations;
- validate repository integration;
- inspect protocol output;
- run non-authoritative assurance simulation.

Default trust posture:

- unsigned local run;
- exact local commit required;
- dirty worktree rejected unless explicit repository-state mode is selected;
- no automatic network access;
- no authoritative decision claims.

### 9.2 Hosted CI support mode

Purpose:

- run the same harness profile under CI Core;
- preserve local/hosted parity;
- emit canonical Assurance-compatible observation artifacts and optional Harness run bundles for shadow comparison.

Constraints:

- CI Core owns permissions, secrets, artifact publication, and GitHub status;
- Harness owns only local execution mechanics and Assurance input export and run-bundle assembly;
- authoritative Assurance invocation remains a CI Core integration decision.

### 9.3 Conformance mode

Purpose:

- verify producer output against Assurance fixtures;
- verify Harness Assurance input export and run-bundle assembly;
- verify consumer byte preservation;
- verify cross-language round trips;
- verify canonicalization and digest vectors.

### 9.4 Replay and incident mode

Purpose:

- reproduce prior runs from immutable inputs;
- compare observations and manifests;
- diagnose nondeterminism;
- generate retrospective bundles without changing prior artifacts.

## 10. Clean Rewrite Strategy

### 10.1 Rewrite decision

The target architecture MUST be implemented as a controlled clean rewrite rather than an additive expansion of an ambiguous harness.

The rewrite MUST preserve only assets proven compatible with the target boundary.

### 10.2 Migration classification

Every existing file or package MUST be classified:

```yaml
asset:
  path: string
  current_responsibility: string
  target_disposition: KEEP | PORT | REWRITE | MOVE | DEPRECATE | ARCHIVE | DELETE
  target_location: string | UNKNOWN
  rationale: string
  protocol_impact: none | compatible | breaking | UNKNOWN
  migration_owner: string | UNKNOWN
  validation: string[]
```

### 10.3 Default disposition rules

- deterministic fixture data: `KEEP` or `PORT` after schema validation;
- local execution shell: `REWRITE` around the new state machine;
- SDK invocation logic: `REWRITE` as a narrow adapter;
- scanner implementations: `MOVE` to `l9-ci-sdk` or isolate as fallback;
- assurance scoring or verdict logic: `DELETE` from Harness;
- GitHub check publication: `MOVE` to `l9-ci-core`;
- mutation or patch logic: `MOVE` to `PR_Repair`;
- historical pattern mining: `MOVE` to debt intelligence;
- peer-to-peer sibling corpus propagation: `DEPRECATE` and `DELETE`;
- automatic learning promotion: `DELETE`;
- central corpus synchronization: `REWRITE` through explicit adapters;
- summary-only authorities: `DEPRECATE` in favor of canonical JSON;
- branch-only subject identity: `DELETE`;
- hidden wall-clock and random-ID logic: `REWRITE` with injected ports.

## 11. Target Repository Structure

```text
l9-harness/
├── README.md
├── AGENTS.md
├── RUNBOOK.md
├── ARCHITECTURE.md
├── SPECIFICATION.md
├── ROADMAP.md
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── L9_META.yaml
├── LICENSE
├── pyproject.toml
├── uv.lock
├── .python-version
├── .gitignore
├── .editorconfig
├── .pre-commit-config.yaml
├── schemas/
│   └── v1/
│       ├── common.schema.json
│       ├── harness-config.schema.json
│       ├── harness-command-result.schema.json
│       ├── harness-run-profile.schema.json
│       ├── harness-plan.schema.json
│       ├── harness-run-manifest.schema.json
│       ├── subject-lock.schema.json
│       ├── toolchain-lock.schema.json
│       ├── execution-record.schema.json
│       ├── observation-index.schema.json
│       ├── assurance-input-manifest.schema.json
│       ├── harness-run-bundle-manifest.schema.json
│       ├── conformance-report.schema.json
│       ├── replay-record.schema.json
│       ├── corpus-candidate.schema.json
│       ├── corpus-snapshot.schema.json
│       ├── guidance-manifest.schema.json
│       ├── assurance-invocation-record.schema.json
│       └── registry.json
├── src/
│   └── l9_harness/
│       ├── __init__.py
│       ├── __main__.py
│       ├── cli/
│       │   ├── app.py
│       │   ├── options.py
│       │   ├── output.py
│       │   └── commands/
│       │       ├── init.py
│       │       ├── doctor.py
│       │       ├── plan.py
│       │       ├── run.py
│       │       ├── collect.py
│       │       ├── package.py
│       │       ├── bundle.py
│       │       ├── verify.py
│       │       ├── replay.py
│       │       ├── conformance.py
│       │       ├── assurance.py
│       │       ├── corpus.py
│       │       ├── guidance.py
│       │       └── clean.py
│       ├── application/
│       │   ├── plan_run.py
│       │   ├── execute_run.py
│       │   ├── collect_observations.py
│       │   ├── export_assurance_input.py
│       │   ├── build_run_bundle.py
│       │   ├── verify_artifacts.py
│       │   ├── replay_run.py
│       │   └── run_conformance.py
│       ├── domain/
│       │   ├── models.py
│       │   ├── states.py
│       │   ├── reason_codes.py
│       │   ├── invariants.py
│       │   ├── digests.py
│       │   ├── identifiers.py
│       │   ├── provenance.py
│       │   ├── ordering.py
│       │   └── errors.py
│       ├── contracts/
│       │   ├── assurance.py
│       │   ├── observations.py
│       │   ├── sdk.py
│       │   ├── corpus.py
│       │   ├── guidance.py
│       │   └── generated/
│       │       └── GENERATED.md
│       ├── subject/
│       │   ├── git.py
│       │   ├── repository_state.py
│       │   └── lock.py
│       ├── planning/
│       │   ├── assurance_plan.py
│       │   ├── capability_resolution.py
│       │   └── run_profile.py
│       ├── execution/
│       │   ├── engine.py
│       │   ├── process_adapter.py
│       │   ├── container_adapter.py
│       │   ├── workspace.py
│       │   ├── environment.py
│       │   ├── limits.py
│       │   └── cache.py
│       ├── sdk/
│       │   ├── adapter.py
│       │   ├── capability_manifest.py
│       │   ├── invocation.py
│       │   └── versioning.py
│       ├── fallback/
│       │   ├── adapter.py
│       │   ├── regex_scanner.py
│       │   ├── producer_identity.py
│       │   └── restrictions.py
│       ├── observations/
│       │   ├── validate.py
│       │   ├── index.py
│       │   ├── preserve.py
│       │   └── limits.py
│       ├── assurance_input/
│       │   ├── layout.py
│       │   ├── manifest.py
│       │   ├── export.py
│       │   └── verify.py
│       ├── bundle/
│       │   ├── manifest.py
│       │   ├── archive.py
│       │   └── verify.py
│       ├── assurance/
│       │   ├── cli_adapter.py
│       │   ├── plan.py
│       │   ├── admission.py
│       │   ├── evaluation.py
│       │   ├── simulation.py
│       │   ├── result_capture.py
│       │   └── versioning.py
│       ├── conformance/
│       │   ├── producer.py
│       │   ├── consumer.py
│       │   ├── canonicalization.py
│       │   ├── cross_language.py
│       │   └── fixtures.py
│       ├── replay/
│       │   ├── record.py
│       │   ├── executor.py
│       │   ├── compare.py
│       │   └── nondeterminism.py
│       ├── corpus/
│       │   ├── service.py
│       │   ├── layout.py
│       │   ├── snapshot.py
│       │   ├── sync.py
│       │   ├── conflicts.py
│       │   └── adapters/
│       │       ├── filesystem.py
│       │       ├── git.py
│       │       └── object_store.py
│       ├── guidance/
│       │   ├── generate.py
│       │   ├── templates.py
│       │   ├── manifest.py
│       │   └── drift.py
│       ├── reporting/
│       │   ├── json_output.py
│       │   ├── markdown.py
│       │   ├── console.py
│       │   └── sanitize.py
│       ├── telemetry/
│       │   ├── ports.py
│       │   └── noop.py
│       └── security/
│           ├── paths.py
│           ├── archives.py
│           ├── redaction.py
│           ├── subprocesses.py
│           └── secrets.py
├── profiles/
│   ├── release-zero-local.yaml
│   ├── conformance.yaml
│   └── diagnostic-fallback.yaml
├── templates/
│   ├── CLAUDE.md.j2
│   └── l9.mdc.j2
├── fixtures/
│   ├── assurance/
│   ├── sdk/
│   ├── harness/
│   ├── corpus/
│   └── adversarial/
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   ├── conformance/
│   ├── replay/
│   ├── adversarial/
│   ├── property/
│   ├── performance/
│   └── architecture/
├── docs/
│   ├── adr/
│   ├── protocol/
│   ├── runbooks/
│   ├── migration/
│   ├── requirements/
│   │   ├── traceability.yaml
│   │   └── compatibility-matrix.yaml
│   ├── validation/
│   └── examples/
├── scripts/
│   ├── generate_bindings.py
│   ├── verify_generated.py
│   ├── update_fixtures.py
│   └── build_release.py
└── .github/
    └── workflows/
        ├── ci.yml
        ├── conformance.yml
        ├── release.yml
        └── dependency-review.yml
```

Repository-local workflows validate Harness itself. They MUST NOT become the constellation control plane, invoke authoritative publication, or replace the locked CI Core to SDK to Assurance flow.

`L9_META.yaml` SHALL provide repository-level L9 identity and a tracked-file metadata index. Strict external JSON Schema artifacts and generated files MUST NOT be corrupted with non-schema fields merely to carry metadata; such files SHALL be covered by the repository metadata index and generated provenance records.

## 12. Package and Module Responsibilities

### 12.1 `domain`

Owns pure models, state transitions, reason codes, invariant checks, deterministic ordering, and digest references.

It MUST NOT perform filesystem, subprocess, network, environment, clock, or logging I/O.

### 12.2 `subject`

Owns exact subject resolution and locking.

It MUST:

1. resolve full commit SHA;
2. optionally resolve tree digest;
3. capture repository identity;
4. detect dirty worktrees;
5. reject ambiguous subject selectors;
6. preserve a subject lock artifact;
7. re-check subject identity before Assurance input export and run-bundle completion.

### 12.3 `planning`

Owns the conversion of:

```text
Assurance plan
+ Harness run profile
+ SDK capability manifest
+ environment capabilities
→ executable Harness plan
```

It MUST NOT decide that a substitute check is semantically equivalent unless the Assurance plan explicitly permits alternatives.

### 12.4 `execution`

Owns bounded process or container execution, resource ceilings, workspace isolation, deterministic environment preparation, cancellation, and execution records.

It MUST NOT own check semantics.

### 12.5 `sdk`

Owns the narrow adapter to a pinned SDK release.

It MUST:

1. verify SDK version and digest;
2. load the SDK capability manifest;
3. invoke supported checks;
4. capture stdout, stderr, and declared artifacts;
5. collect canonical observations;
6. preserve SDK exit status separately from Harness lifecycle status.

### 12.6 `fallback`

Owns explicit local diagnostic fallback behavior only.

It MUST:

1. use a distinct producer and check identity;
2. mark mode `diagnostic_only`;
3. emit explicit limitations;
4. require explicit CLI opt-in;
5. write only under the fallback diagnostics path;
6. never impersonate the SDK;
7. never enter a complete Release-zero Assurance input export;
8. never influence control, admission, or verdict semantics.

### 12.7 `observations`

Owns structural preflight, Release-zero limit checks, canonical digest confirmation, indexing, and exact byte preservation.

It MUST NOT perform Assurance admission or rewrite SDK observations.

### 12.8 `assurance_input`

Owns the exact local export layout consumed by Assurance:

```text
artifacts/
├── observations/
└── supporting/
```

It preserves observation bytes, validates path and digest integrity, and creates a Harness-owned export manifest outside canonical observations. It MUST NOT wrap observations in a competing envelope or claim admission.

### 12.9 `bundle`

Owns optional Harness run-bundle manifests, deterministic archive creation, path confinement, and replay packaging. A run bundle is operational context, not an Assurance evidence envelope.

### 12.10 `assurance`

Owns only public Assurance CLI/API adapters and exact result capture for local non-authoritative use.

It MUST NOT import Assurance implementation internals, rebuild output, or publish decisions.

### 12.11 `conformance`

Owns execution of pinned Assurance producer, consumer, canonicalization, and conditionally enabled cross-language fixture suites.

### 12.12 `replay`

Owns reconstruction of a prior Harness run from immutable recorded inputs and deterministic comparison of outputs.

### 12.13 `corpus`

Owns central corpus synchronization, snapshots, cache, outbox, conflict handling, and candidate metadata.

It MUST NOT approve or publish prevention packs.

### 12.14 `guidance`

Owns deterministic generation and drift checking for developer-facing guidance files.

### 12.15 `reporting`

Owns derived human and machine projections. Canonical artifacts MUST be generated before projections.

## 13. Canonical Harness Domain Model

### 13.0 Shared scalar, reference, and unknown-field rules

All Harness-owned schemas MUST use the shared definitions in `schemas/v1/common.schema.json`.

```yaml
DigestRef:
  algorithm: sha256
  value: 64_lowercase_hex_characters

ArtifactRef:
  path: normalized_relative_posix_path
  mediaType: registered_or_vendor_media_type
  byteLength: non_negative_integer
  rawDigest: DigestRef
  canonicalPayloadDigest: DigestRef | null

ContentDerivedId:
  format: "<namespace>:sha256:<64-lowercase-hex>"
  derivation: domain_separated_canonical_payload

SchemaVersion:
  format: semver_without_v_prefix

Timestamp:
  format: RFC3339_UTC
```

Rules:

1. Bare, algorithm-free digest strings are prohibited in persisted Harness-owned contracts.
2. `rawDigest` binds exact bytes. `canonicalPayloadDigest` binds authority-defined canonical semantic content when such canonicalization exists.
3. Content-derived identifiers MUST define the exact included fields, excluded fields, domain-separation prefix, canonicalization algorithm, and vector-set digest.
4. Security-sensitive top-level objects MUST set `additionalProperties=false` unless an explicit namespaced extension point is defined.
5. Every array MUST define maximum cardinality and uniqueness rules where duplication changes meaning.
6. Timestamps are operational metadata unless a contract explicitly includes them in semantic identity.
7. All paths in portable artifacts MUST be relative, POSIX-normalized, UTF-8, and free of `.` segments, `..`, absolute roots, NUL, or platform drive prefixes.
8. The implementation MUST import or generate shared Assurance protocol types from the canonical source. It MUST NOT hand-maintain a semantic fork.

### 13.1 Harness run profile

A Harness run profile defines execution mechanics, not assurance controls.

Required fields:

```yaml
schema: l9.harness-run-profile
schemaVersion: 1.0.0
id: string
version: semver
subjectKinds:
  - git-revision
assuranceProfileRef:
  id: string
  version: string
sdk:
  version: string
  digest: string
execution:
  adapter: process | container
  isolation: none | workspace | container
  concurrency: integer
  timeoutSeconds: integer
  environmentAllowlist: string[]
  network: denied | restricted | allowed
artifacts:
  outputDirectory: string
  includeSupporting: boolean
  maxTotalBytes: integer
fallback:
  enabled: boolean
  explicitOptInRequired: true
corpus:
  snapshotRef: string | null
  mode: offline | pull_if_missing | synchronized
replay:
  record: boolean
  strict: boolean
```

Forbidden fields:

- control severity;
- waiver rules;
- policy precedence;
- overall assurance verdict;
- producer trust decisions;
- unknown-to-pass behavior.

### 13.2 Subject lock

Required fields:

```yaml
schema: l9.subject-lock
schemaVersion: 1.0.0
subject:
  kind: git-revision
  repository:
    host: canonical_lowercase_host
    owner: exact_owner
    name: exact_repository_name
  revision:
    commit: 40_or_64_lowercase_hex_by_vcs_contract
    treeDigest: DigestRef | null
subjectIdentityDigest: DigestRef
resolution:
  resolvedFrom:
    selector: string
    selectorType: commit | tag | branch | pr | working-tree
  worktree:
    clean: boolean
    patchDigest: DigestRef | null
  resolvedAt: Timestamp
  resolver:
    id: l9-harness
    version: SchemaVersion
    buildDigest: DigestRef
```

Rules:

1. `subject.revision.commit` is authoritative.
2. `resolvedFrom` is provenance only.
3. Clean Git revisions are required for authoritative CI-aligned runs.
4. Dirty worktree mode requires `subject.kind=repository-state` when supported by Assurance; until then it is simulation-only.
5. Subject lock MUST be revalidated immediately before Assurance input export and again before final Harness run-bundle completion.
6. `subjectIdentityDigest` MUST exclude `resolvedFrom` and `resolvedAt`; those fields are provenance, not subject identity.
7. Dirty worktree patch content MUST NOT be represented as a `git-revision` subject.

### 13.3 Toolchain lock

Required fields:

```yaml
schema: l9.toolchain-lock
schemaVersion: 1.0.0
harness:
  version: semver
  buildDigest: digest
sdk:
  id: l9-ci-sdk
  version: semver
  buildDigest: digest
assuranceContracts:
  version: semver
  registryDigest: digest
assuranceCli:
  version: semver | null
  buildDigest: digest | null
runtime:
  python: string
  platform: string
  architecture: string
container:
  image: string | null
  digest: digest | null
sdkPublicContractDigest: digest
capabilityManifestDigest: digest | null
```

### 13.4 Executable Harness plan

Required fields:

```yaml
schema: l9.harness-plan
schemaVersion: 1.0.0
planId: content_derived_identifier
subjectLockDigest: digest
assurancePlanRef:
  id: string
  version: string
  digest: digest
runProfileRef:
  id: string
  version: string
  digest: digest
resolvedChecks:
  - evidenceRequirementRef: string
    check:
      id: string
      version: string
      producer: string
    capabilityRef: string
    required: boolean
    executionOrder: integer
unresolvedRequirements:
  - requirementRef: string
    reasonCode: string
    detail: string
steps:
  - stepId: content_derived_identifier
    kind: sdk_check | fallback_check
    checkRef: string
    capabilityRef: string
    dependsOn: string[]
    required: boolean
    timeoutSeconds: positive_integer
    outputContractRef: string
    network: denied | restricted | allowed
complete: boolean
```

The plan is a bounded ordered capability plan, not a general workflow language. Only the enumerated step kinds are valid. Arbitrary commands, loops, dynamic code, user-defined expressions, and runtime graph mutation are prohibited.

### 13.5 Harness run manifest

Required fields:

```yaml
schema: l9.harness-run-manifest
schemaVersion: 1.0.0
runKey: deterministic_digest
executionId: externally_supplied_or_boundary_generated
attempt: integer
state: string
subjectLockRef: string
toolchainLockRef: string
planRef: string
startedAt: rfc3339
completedAt: rfc3339 | null
executionRecords: string[]
observationIndexRef: string | null
assuranceInputManifestRef: string | null
runBundleManifestRef: string | null
conformanceReportRef: string | null
replayRecordRef: string | null
assuranceInvocationRefs: string[]
reasonCodes: string[]
limitations: string[]
```

`runKey` MUST be deterministic from normalized immutable semantic inputs. `executionId`, attempt number, timestamps, resource usage, and log locations are attempt metadata and MUST NOT affect `runKey`. `executionId` MAY be unique per attempt but MUST be injected at the application boundary.

### 13.6 Execution record

Each check execution MUST produce:

```yaml
schema: l9.execution-record
schemaVersion: 1.0.0
executionRecordId: string
runKey: string
subjectDigest: digest
check:
  id: string
  version: string
  producer: string
adapter: process | container | fallback
commandDigest: digest
configurationDigest: digest
environmentDigest: digest
startedAt: rfc3339
completedAt: rfc3339
exitCode: integer | null
termination: completed | timeout | cancelled | signal | infrastructure_error
stdoutRef: artifact_ref | null
stderrRef: artifact_ref | null
observationRefs: artifact_ref[]
supportingArtifactRefs: artifact_ref[]
resourceUsage:
  wallSeconds: number
  cpuSeconds: number | null
  peakMemoryBytes: integer | null
limitations: string[]
```

### 13.7 Observation index

The observation index MUST reference, not rewrite, SDK-emitted observation payloads. Harness validates parsed structure but preserves exact emitted bytes. Raw-byte and canonical-payload digests MUST be recorded separately.

```yaml
schema: l9.observation-index
schemaVersion: 1.0.0
subjectDigest: digest
entries:
  - path: string
    mediaType: application/json
    byteLength: integer
    rawDigest: DigestRef
    canonicalPayloadDigest: DigestRef
    schema: l9.observation
    schemaVersion: semver
    producerId: string
    producerVersion: semver
    checkId: string
    checkVersion: semver
    executionRecordRef: string
counts:
  total: integer
  structurallyValid: integer
  invalid: integer
```

### 13.8 Assurance input manifest

The manifest is Harness-owned operational metadata stored beside, not inside, canonical observations.

```yaml
schema: l9.harness-assurance-input-manifest
schemaVersion: 1.0.0
inputSetId: ContentDerivedId
subject: object
subjectIdentityDigest: DigestRef
profileRef:
  id: l9.pull-request
  version: 1.0.0
  digest: DigestRef
registryDigest: DigestRef
observationIndexRef: ArtifactRef
observations:
  - path: normalized_relative_posix_path
    byteLength: non_negative_integer
    rawDigest: DigestRef
    canonicalPayloadDigest: DigestRef
    producerId: l9-ci-sdk
    checkId: string
supportingArtifacts:
  - path: normalized_relative_posix_path
    byteLength: non_negative_integer
    rawDigest: DigestRef
assuranceInputDigest: DigestRef
completeForRequestedPlan: boolean
limitations: string[]
```

The manifest MUST NOT be presented to Assurance as an `EvidenceEnvelope`, observation, decision, policy, profile, or trust-registry record. Assurance remains free to accept, reject, quarantine, or deduplicate each supplied artifact.

### 13.8.1 Digest scopes and reproducibility

Harness SHALL expose distinct digest scopes:

1. `assuranceInputDigest`: deterministic identity of the exact sorted Release-zero observation files, declared supporting files, exact subject, pinned profile, and registry digest. Operational timestamps, execution IDs, logs, resource usage, and projections are excluded.
2. `runBundleContentDigest`: deterministic identity of the complete sorted Harness run-bundle file set, excluding self-referential digest fields.
3. `runBundleArchiveDigest`: digest of exact normalized archive bytes when a bundle archive is created.

A repeated execution MAY produce a different run-bundle digest because operational records differ while retaining the same `assuranceInputDigest`. Replay MUST classify this difference. No requirement may use an ambiguous term such as `root digest`.

### 13.8.2 Harness run-bundle manifest

```yaml
schema: l9.harness-run-bundle-manifest
schemaVersion: 1.0.0
bundleId: ContentDerivedId
runKey: string
subjectIdentityDigest: DigestRef
assuranceInputManifestRef: ArtifactRef
files:
  - path: normalized_relative_posix_path
    mediaType: string
    byteLength: non_negative_integer
    rawDigest: DigestRef
    role: lock | plan | execution_record | observation | supporting | conformance | replay | report | projection
runBundleContentDigest: DigestRef
runBundleArchiveDigest: DigestRef | null
archiveNormalizationProfile: string | null
issuance:
  createdAt: Timestamp
  executionId: string
limitations: string[]
```

A Harness run bundle is for replay, incident analysis, and audit support. It is not a substitute for the canonical Assurance artifact layout.

### 13.9 Conformance report

The conformance report SHALL distinguish:

- Harness-owned schema validity;
- Assurance producer-fixture compatibility;
- Assurance consumer-fixture compatibility;
- canonicalization-vector compatibility;
- optional cross-language binding compatibility;
- exact observation byte preservation;
- unsupported or unavailable fixture categories;
- fixture authority version and digest.

Cross-language conformance is required only when Assurance publishes and enables Python bindings for the applicable protocol version.

### 13.10 Replay record

```yaml
schema: l9.replay-record
schemaVersion: 1.0.0
sourceRunKey: string
sourceAssuranceInputDigest: digest
sourceRunBundleDigest: digest | null
replayRunKey: string
inputEquivalence: boolean
environmentEquivalence: exact | compatible | different
comparisons:
  observations: equal | different | incomplete
  assuranceInput: equal | different | incomplete
  runBundle: equal | different | incomplete | not_compared
  supportingArtifacts: equal | different | ignored
mismatches:
  - path: string
    category: content | ordering | timestamp | environment | missing | extra
    expectedDigest: digest | null
    actualDigest: digest | null
result: match | mismatch | inconclusive
```

### 13.11 Corpus candidate

```yaml
schema: l9.corpus-candidate
schemaVersion: 1.0.0
candidateId: content_derived_identifier
candidateType: fixture | scenario | regression | failure_reproduction | rule_test | benchmark
source:
  runKey: string
  subjectDigest: digest
  observationRefs: string[]
proposedDestination: string
provenance: object
sanitization: object
reviewStatus: unreviewed
promotionStatus: not_promoted
createdAt: rfc3339
```

Harness MUST NOT set `reviewStatus=approved` or `promotionStatus=promoted`.

## 14. Run State Machine

The canonical state machine SHALL be:

```text
CREATED
  ↓
CONFIG_VALIDATED
  ↓
SUBJECT_LOCKED
  ↓
ASSURANCE_PLAN_LOADED
  ↓
SDK_CONTRACT_RESOLVED
  ↓
PLANNED
  ↓
EXECUTING
  ↓
COLLECTED
  ↓
OBSERVATIONS_PREFLIGHTED
  ↓
ASSURANCE_INPUT_EXPORTED
  ↓
ASSURANCE_INPUT_VERIFIED
  ↓
RUN_BUNDLE_COMPLETED
  ↓
COMPLETE
```

Failure or incomplete terminal states:

```text
REJECTED_INPUT
AMBIGUOUS_SUBJECT
INCOMPATIBLE_PROTOCOL
UNRESOLVED_REQUIREMENTS
EXECUTION_INCOMPLETE
OBSERVATION_INVALID
ASSURANCE_INPUT_INVALID
RUN_BUNDLE_INVALID
CANCELLED
INTERNAL_INVARIANT_VIOLATION
```

Rules:

1. State transitions MUST be monotonic.
2. A completed state MUST NOT be mutated in place.
3. Retry creates a new attempt under the same deterministic `runKey` only when immutable inputs are unchanged.
4. Subject change creates a new `runKey`.
5. Assurance input export is prohibited before observation preflight completes.
6. Harness run-bundle completion is prohibited before subject revalidation and Assurance input verification.
7. Optional Assurance invocation occurs only after `ASSURANCE_INPUT_VERIFIED` and does not alter Harness completion state.
8. Harness state names MUST NOT reuse Assurance verdict values as lifecycle states.

## 15. Assurance Plan Handshake

### 15.1 Locked public behavior

The locked Assurance v2 CLI SHALL expose:

```text
l9-assurance plan --profile l9.pull-request@1.0.0 --subject subject.json --output artifacts/assurance-plan.json
```

The command output SHALL identify applicable controls, required producers, required checks, waiver rules, and expected evidence. Harness SHALL consume the exact output of a pinned Assurance release. Harness MUST NOT maintain a private copy of profile membership, policy precedence, waiver eligibility, producer authorization, or control evaluation semantics.

### 15.2 Release-zero interpretation

For `l9.pull-request@1.0.0`, the Harness adapter SHALL expect the plan to resolve to:

- producer `l9-ci-sdk`;
- SDK checks `l9.repository-metadata`, `l9.transport-packet`, `l9.sdk-validation`, `l9.lint`, `l9.tests`, and `l9.mandatory-findings`;
- exact `git-revision` subject binding;
- the seven Assurance controls defined by the locked profile, including Assurance-owned revision consistency.

Harness SHALL treat any difference as one of:

- a newer explicitly supported profile version;
- a locked contract amendment;
- an incompatibility;
- `UNKNOWN`.

It SHALL NOT silently add, remove, or substitute checks.

### 15.3 Locked plan schema and digest gate

Assurance v2.0.1 publishes `l9.assurance-plan` schema version `1.0.0` as a strict JSON Schema Draft 2020-12 contract. The plan is self-describing and contains:

1. exact subject;
2. profile and policy identities plus digests;
3. Assurance version, schema version, canonicalization algorithm, digest algorithm, and embedded protocol-bundle digest;
4. all seven controls with exact evidence requirements, check versions, output schemas, accepted statuses, cardinality, revision binding, configuration-digest requirements, freshness, and waiver rules;
5. required producer records and authorization state;
6. required check records;
7. source registry and control digests;
8. a deterministic `planId` and `planDigest`.

Harness production parsing SHALL:

1. validate against `assurance-plan.schema.json`;
2. recompute `planDigest` over the defined preimage excluding `planId` and `planDigest`;
3. verify `planId=plan_<first-40-hex-of-planDigest>`;
4. verify the pinned embedded protocol-bundle digest;
5. reject unknown fields, unsupported schema versions, digest drift, missing requirements, and subject mismatch;
6. consume check and producer details without reinterpreting Assurance semantics.

An opaque experimental adapter is no longer required for the Assurance plan seam. SDK invocation remains separately blocked until its public contract is locked.

### 15.4 Resolution algorithm

Harness SHALL:

1. invoke or load a pinned Assurance plan artifact;
2. verify the exact subject, profile identity, profile version, and available digest;
3. validate against the authority-published plan schema when available;
4. read required producer and check identities without local reinterpretation;
5. resolve each required check against the pinned SDK public contract;
6. reject ambiguous, missing, or semantically incompatible mappings;
7. record unresolved requirements and exact reason codes;
8. build a bounded deterministic SDK invocation order;
9. calculate the Harness plan digest from immutable inputs;
10. prevent a Release-zero-complete export when any required SDK observation is absent;
11. keep partial and fallback outputs outside the canonical Release-zero Assurance input set.

## 16. SDK Integration Contract

### 16.1 Canonical producer

`l9-ci-sdk` SHALL be the only authorized producer for the locked Assurance Release-zero profile. Harness SHALL reject any claim that a Harness-native or fallback producer can satisfy the six required Release-zero SDK checks.

### 16.2 Public SDK contract gate

The locked Assurance specification defines the required producer and check identities but does not define how Harness invokes the SDK. That public invocation contract remains owned by `l9-ci-sdk`.

Phase 0 SHALL verify one of these SDK-owned mechanisms:

1. a versioned capability manifest;
2. a stable CLI command and machine-readable help or schema surface;
3. a stable public library API with explicit version and build identity;
4. an SDK-published execution plan or registry adapter.

If the SDK publishes a capability manifest, Harness requires it to communicate at least producer identity, version, build digest, supported check IDs and versions, supported subject kinds, output schema IDs, deterministic behavior declaration, configuration contract, invocation mode, and required runtime capabilities. This is a Harness interoperability requirement, not a claim that such a manifest currently exists.

Harness MUST NOT invent a production manifest, infer capabilities from filenames, inspect SDK private modules, or hardcode an unversioned command map. Production adapter implementation remains blocked until the SDK owner publishes or accepts the contract.

### 16.3 Invocation rules

Harness MUST:

1. pin SDK version and build digest;
2. reject unverified SDK replacement;
3. invoke by argument array, never shell-string interpolation;
4. pass the exact subject and declared output root;
5. pass explicit configuration and configuration digest inputs;
6. set deterministic locale and encoding;
7. capture environment identity and invocation digest;
8. enforce timeout and resource ceilings;
9. collect only artifacts declared by the public SDK contract;
10. validate emitted observations against pinned Assurance schemas;
11. preserve exact producer identity, check identity, version, subject, status, counts, findings, artifacts, provenance, and extensions;
12. preserve SDK exit status separately from Harness lifecycle status;
13. never reconstruct findings or observations from logs when canonical output is required.

### 16.4 Library versus CLI adapter

The default adapter SHOULD use a stable CLI boundary for process isolation and language independence.

A library adapter MAY be provided only when:

1. the SDK publishes a stable public API;
2. version and build coupling are explicit;
3. conformance tests prove observation equivalence with the canonical SDK path;
4. private modules are not imported;
5. process isolation is not required by the Harness run profile;
6. the adapter does not bypass SDK-owned configuration validation.

## 17. Fallback Diagnostic Contract

The regex fallback is retained only as an explicitly requested local diagnostic aid. It is not a Release-zero Assurance producer.

### 17.1 Activation

It MAY run only when all are true:

1. the user passes `--allow-fallback` or selects `diagnostic-fallback`;
2. the SDK is unavailable or lacks a non-required diagnostic capability;
3. the run is marked `diagnostic_only`;
4. output is written under `diagnostics/fallback/`;
5. output is excluded from canonical `artifacts/observations/`.

### 17.2 Identity

```yaml
producer:
  id: l9-harness-fallback
  version: <harness-version>
check:
  id: fallback.regex.<rule-family>
  version: <rule-contract-version>
mode: diagnostic_only
```

### 17.3 Assurance treatment

The locked Release-zero producer registry authorizes only `l9-ci-sdk`. Fallback output therefore MUST NOT satisfy, replace, or be submitted as required Release-zero evidence. If intentionally submitted for a negative conformance test, Assurance is expected to reject or quarantine it under its registry policy.

### 17.4 Forbidden behavior

The fallback implementation MUST NOT:

1. emit `producer.id=l9-ci-sdk`;
2. reuse an SDK check ID;
3. imply semantic equivalence;
4. silently replace a required SDK observation;
5. enter the canonical Assurance input directory for a complete Release-zero run;
6. produce or influence an Assurance decision;
7. update the central corpus automatically.

## 18. Artifact Layout

Harness SHALL separate its private operational record from the canonical Assurance input and output directories.

```text
.l9/harness/runs/<run-key>/<execution-id>/
├── harness/
│   ├── input/
│   │   ├── harness-run-profile.yaml
│   │   ├── assurance-plan.json
│   │   ├── sdk-contract.json
│   │   └── environment-input.json
│   ├── locks/
│   │   ├── subject-lock.json
│   │   └── toolchain-lock.json
│   ├── plan/
│   │   └── harness-plan.json
│   ├── execution/
│   │   ├── records/
│   │   ├── stdout/
│   │   └── stderr/
│   ├── diagnostics/
│   │   └── fallback/
│   ├── conformance/
│   │   └── report.json
│   ├── replay/
│   │   └── record.json
│   ├── reports/
│   │   ├── harness-summary.json
│   │   └── harness-summary.md
│   ├── assurance-input-manifest.json
│   ├── run-bundle-manifest.json
│   └── run-manifest.json
└── artifacts/
    ├── observations/
    │   ├── repository-metadata.observation.json
    │   ├── transport-packet.observation.json
    │   ├── sdk-validation.observation.json
    │   ├── lint.observation.json
    │   ├── tests.observation.json
    │   └── mandatory-findings.observation.json
    ├── supporting/
    │   ├── logs/
    │   ├── test-results/
    │   └── provenance.json
    ├── admission/
    │   ├── admission-report.json
    │   └── accepted/
    │       └── <evidence-id>.json
    └── assurance/
        ├── decision.json
        ├── decision.summary.md
        └── evidence-manifest.json
```

Rules:

1. `artifacts/observations/` and `artifacts/supporting/` SHALL match the locked Assurance Release-zero artifact contract.
2. `artifacts/admission/` is absent unless `evidence admit` was invoked.
3. `artifacts/assurance/` is absent unless `evaluate` or `simulate` was invoked.
4. Assurance outputs SHALL be stored byte-for-byte as emitted.
5. Harness-owned manifests SHALL remain under `harness/` and MUST NOT masquerade as Assurance protocol objects.
6. Supporting artifacts SHALL be declared by reference and SHALL not be required unless the Assurance plan or control explicitly requires them.
7. No absolute host path may appear in portable exports or bundles.
8. Filenames SHALL be normalized, deterministic, path-safe, and compatible with the locked Assurance artifact names for Release zero.
9. The exact SDK observation bytes SHALL not be rewritten to force canonical filenames; Harness MAY hard-link or copy bytes after digest verification and SHALL record source-to-export mapping.

## 19. Assurance Input Export and Harness Run-Bundle Contract

### 19.1 Canonical Assurance input

The canonical input supplied to Assurance SHALL consist of:

```text
artifacts/
├── observations/
└── supporting/
```

Release-zero complete mode SHALL include exactly one valid SDK observation for each required check unless the authority-published plan permits different cardinality:

- `l9.repository-metadata`;
- `l9.transport-packet`;
- `l9.sdk-validation`;
- `l9.lint`;
- `l9.tests`;
- `l9.mandatory-findings`.

Harness SHALL not generate an observation for `L9.CI.EVIDENCE_REVISION_CONSISTENCY`; Assurance evaluates that control across admitted evidence.

### 19.2 No competing envelope

Harness MUST NOT require Assurance to understand a Harness packet, archive, manifest, or wrapper. It SHALL invoke:

```text
l9-assurance evidence admit --subject subject.json --input artifacts/observations --output artifacts/admission
```

or the equivalent public API using the canonical file paths.

`PacketEnvelope` is prohibited. A runtime `TransportPacket` is not the wire format for this repository-to-repository filesystem boundary. The `l9.transport-packet` observation remains an SDK check result about the target repository.

### 19.3 Harness run bundle

Harness MAY build a deterministic run bundle containing subject locks, toolchain locks, plans, execution records, canonical observations, supporting artifacts, conformance reports, replay records, and derived summaries.

The bundle SHALL:

1. preserve source observation bytes;
2. use a Harness-owned manifest;
3. distinguish canonical Assurance inputs from operational records;
4. exclude secrets, credentials, private keys, mutable caches, and unrequested corpus candidates;
5. normalize archive ordering, ownership, permissions, timestamps, and compression implementation;
6. remain optional for Assurance admission;
7. never be called an Assurance decision, evidence envelope, policy bundle, or attestation.

### 19.4 Verification

`l9-harness verify` SHALL verify:

1. Harness manifest schemas;
2. every referenced file digest;
3. Assurance input digest;
4. run-bundle content and archive digests when present;
5. path confinement and symlink safety;
6. duplicate path absence;
7. media-type consistency;
8. exact subject consistency;
9. observation-index consistency;
10. toolchain-lock consistency;
11. Release-zero observation completeness;
12. unsupported schema handling;
13. archive safety.

It MUST NOT determine evidence admissibility, producer authorization, policy applicability, control status, or verdict.

## 20. Assurance Integration

### 20.1 External-only invocation

Harness SHALL invoke only the public CLI or programmatic API of a pinned Assurance release. It SHALL not import Assurance evaluator, evidence, policy, registry, or control implementation modules.

Supported local flows:

```text
Harness local SDK run
  -> artifacts/observations
  -> l9-assurance evidence admit
  -> l9-assurance evaluate
  -> exact captured non-authoritative decision artifacts
```

```text
historical fixture bundle
  -> l9-assurance simulate
  -> exact captured non-authoritative simulation artifacts
```

### 20.2 Command parity

Harness adapters SHALL support the locked Assurance Release-zero commands:

- `plan`;
- `evidence admit`;
- `evaluate`;
- `verify`;
- `conformance producer`;
- `conformance consumer`;
- `simulate`.

Harness SHALL preserve exact Assurance stdout, stderr, process exit code, output files, tool version, build digest, arguments, explicit evaluation time, and environment identity.

### 20.3 Non-authoritative semantics

Every Assurance invocation initiated through Harness SHALL be marked in the Harness-owned invocation record:

```yaml
initiated_by: l9-harness
mode: local_non_authoritative
publication_authority: none
```

These fields MUST NOT be injected into, wrapped around, or used to mutate `decision.json`. The captured `decision.json` remains a real Assurance decision for the supplied inputs, but Harness SHALL not publish it as the authoritative GitHub or release decision. CI authority remains with the separately governed CI Core flow.

### 20.4 No reconstruction

Harness summaries MAY display an externally issued verdict only when they also display the decision digest, source Assurance version, mode, and non-authoritative publication status. Harness MUST NOT derive a verdict from check statuses, rewrite control results, convert `indeterminate` to `fail`, or alter decision IDs.

## 21. CI Core Integration

### 21.1 Release-zero authoritative contract

The locked authoritative flow does not require Harness:

```text
CI Core
  -> provisions pinned SDK
  -> receives canonical SDK observations
  -> transports observation bytes unchanged
  -> invokes Assurance
  -> publishes exact Assurance decision
```

Harness SHALL provide fixtures, replay records, local parity checks, and shadow comparison reports for this flow.

### 21.2 Optional Harness use

CI Core MAY invoke Harness in non-authoritative shadow mode to compare local and hosted SDK behavior. It MUST NOT depend on Harness for authoritative Release-zero execution unless a separate approved integration amendment proves:

1. identical SDK invocation semantics;
2. byte-identical observations;
3. no additional trust interpretation;
4. no publication behavior;
5. rollback without decision mutation;
6. measured shadow-mode reliability.

### 21.3 Prohibitions

Harness MUST NOT:

1. request GitHub write permissions;
2. publish check runs;
3. select branch-protection behavior;
4. own CI Core concurrency, cancellation, permission, or secret policy;
5. reconstruct summaries as authoritative outcomes;
6. require CI Core to route observations through a proprietary Harness wrapper.

## 22. Repair Loop Integration

The canonical repair path remains independent of Harness:

```text
Assurance decision for commit A = fail
  -> resolver diagnosis
  -> PR_Repair governed mutation
  -> commit B
  -> fresh SDK observations for B
  -> fresh Assurance decision for B
```

Harness MAY reproduce the SDK execution for commit A or B, prepare fixture packs, and compare observations. It SHALL NOT apply, approve, route, or govern the mutation.

Rules:

1. A Harness reproduction SHALL lock the exact commit.
2. Commit B SHALL create a new subject lock, run key, observation set, Assurance input export, and run bundle.
3. Revision-bound observations from A SHALL never enter B's complete Release-zero input set.
4. Subject-independent intermediate artifacts MAY be reused only when an SDK contract explicitly permits them and the SDK emits fresh B-bound observations.
5. Prior decisions may be retained only as historical references.
6. `repair-verification` remains deferred until Assurance adds and locks a corresponding profile beyond Release zero.

## 23. Debt Intelligence and Corpus Integration

### 23.1 Central corpus purpose

The central corpus MUST hold:

- conformance fixtures;
- synthetic scenarios;
- sanitized failure reproductions;
- regression cases;
- benchmark cases;
- candidate rule tests;
- candidate topology fixtures;
- historical examples approved for reuse.

It MUST NOT be the canonical home of:

- Assurance policies;
- Assurance profiles;
- producer trust registry;
- signer trust registry;
- authoritative prevention-pack approvals;
- mutable runtime telemetry.

### 23.2 Local layout

```text
.l9/corpus/
├── cache/
│   ├── snapshots/
│   ├── objects/
│   └── index.json
├── outbox/
│   ├── candidates/
│   └── index.json
├── locks/
│   └── sync.lock
└── state.json
```

`cache` is read-optimized synchronized material. `outbox` is write-only candidate staging until external review.

### 23.3 Commands

Harness MUST implement:

```text
l9-harness corpus pull
l9-harness corpus push
l9-harness corpus sync
l9-harness corpus status
```

Semantics:

- `pull`: fetch and verify an immutable corpus snapshot;
- `push`: submit outbox candidates, never promote them;
- `sync`: pull, reconcile, and optionally submit outbox candidates using explicit conflict rules;
- `status`: report snapshot identity, cache state, outbox count, conflicts, and compatibility.

### 23.4 No peer-to-peer propagation

Sibling repository propagation MUST be removed. Every repository MUST target a configured central corpus endpoint or path.

### 23.5 No automatic promotion

Harness MUST NOT move a candidate from outbox into an approved corpus namespace based solely on test success, recurrence count, or local configuration.

## 24. Guidance Generation

Harness MUST generate:

```text
CLAUDE.md
.cursor/rules/l9.mdc
```

### 24.1 Inputs

Generation MUST use:

1. approved templates versioned in Harness;
2. exact repository topology facts;
3. pinned SDK capabilities;
4. approved prevention-pack references when available;
5. selected Harness run profile references;
6. explicit Assurance profile references;
7. digest-bound source manifests.

### 24.2 Output requirements

Generated files MUST include a machine-readable header or adjacent manifest with:

- generator ID and version;
- template version and digest;
- source pack IDs, versions, and digests;
- repository subject or topology digest;
- deterministic source epoch or explicit supplied generation time;
- non-authoritative projection notice.

The generated guidance body MUST NOT read the current clock. Drift comparison MUST exclude only a separately declared issuance field, or use a caller-supplied stable `SOURCE_DATE_EPOCH`.

### 24.3 Drift checking

`l9-harness guidance check` MUST regenerate in memory and compare canonical output.

Drift MUST be reported without silently overwriting local changes unless `--write` is explicitly supplied.

### 24.4 Forbidden semantics

Generated guidance MUST NOT:

1. become an Assurance policy;
2. satisfy mandatory evidence by existence alone;
3. override repository-local governance without explicit merge rules;
4. contain secrets;
5. claim an unverified prevention pack is approved.

## 25. CLI Specification

### 25.1 Commands

```text
l9-harness init
l9-harness doctor
l9-harness plan
l9-harness run
l9-harness collect
l9-harness package
l9-harness bundle
l9-harness verify
l9-harness replay
l9-harness conformance producer
l9-harness conformance consumer
l9-harness conformance canonicalization
l9-harness conformance cross-language
l9-harness assurance plan
l9-harness assurance admit
l9-harness assurance evaluate
l9-harness assurance verify
l9-harness assurance simulate
l9-harness corpus pull
l9-harness corpus push
l9-harness corpus sync
l9-harness corpus status
l9-harness guidance generate
l9-harness guidance check
l9-harness clean
```

### 25.2 Global options

Every operational command SHALL support as applicable:

```text
--json
--output <path>
--run-profile <path-or-id>
--assurance-profile <id@version>
--policy <id@version-or-path>
--subject <selector>
--revision <full-sha>
--offline
--strict
--no-color
--quiet
--log-level <level>
--correlation-id <id>
--execution-id <id>
--evaluation-time <rfc3339>
```

### 25.3 JSON output envelope

```yaml
schema: l9.harness-command-result
schemaVersion: 1.0.0
command: string
status: completed | incomplete | rejected | failed | cancelled
lifecycleCode: string
runKey: string | null
artifacts:
  - path: string
    digest: DigestRef
reasonCodes: string[]
warnings: string[]
nextActions: string[]
externalToolResult:
  tool: string | null
  version: string | null
  exitCode: integer | null
  verdict: pass | fail | conditional | indeterminate | null
  authoritativePublication: false
```

Console prose SHALL be derived from the structured result.

### 25.4 Command behavior

#### `init`

Creates minimal Harness-owned configuration and directories. It MUST NOT install or modify policy, registries, profiles, or repository source.

#### `doctor`

Checks runtime, Git, pinned SDK, pinned Assurance CLI, canonical schemas, conformance fixtures, corpus adapter, filesystem safety, and protocol compatibility.

#### `plan`

Locks the subject, obtains or loads the pinned Assurance plan, resolves public SDK capabilities, and produces a bounded deterministic Harness plan without executing checks.

#### `run`

Performs subject lock, plan resolution, public SDK execution, collection, preflight, Assurance input export, verification, and optional run-bundle creation.

#### `collect`

Collects only declared SDK outputs from a recorded execution root.

#### `package`

Exports the canonical Assurance-compatible `artifacts/observations/` and `artifacts/supporting/` directories plus a Harness-owned input manifest.

#### `bundle`

Creates an optional deterministic Harness run bundle for replay and incident analysis.

#### `verify`

Verifies an Assurance input export, Harness run directory, or Harness run bundle without claiming admission or verdict.

#### `replay`

Re-executes from a replay record or run bundle and produces a classified comparison.

#### `conformance`

Runs the selected pinned Assurance fixture suite. Cross-language mode is available only when authority-published Python bindings exist.

#### `assurance plan|admit|evaluate|verify|simulate`

Invokes the corresponding pinned Assurance command, preserves exact outputs, and marks Harness-mediated publication authority as false.

#### `clean`

Deletes only generated, unreferenced Harness artifacts inside configured owned roots. It SHALL not delete corpus snapshots or user files by default.

## 26. Exit-Code Contract

Harness lifecycle codes MUST NOT impersonate Assurance verdict codes.

```text
0   Harness operation completed; SDK observations may report passed, failed, error, or skipped
60  operation incomplete; required Release-zero output not established
61  invalid input or configuration
62  incompatible protocol, schema, registry, profile, SDK, or tool version
63  ambiguous, dirty, or changed subject
64  execution infrastructure failure
65  observation preflight failure
66  Assurance input or Harness run-bundle integrity failure
67  replay mismatch
68  corpus synchronization or conflict failure
69  generated guidance drift
70  internal invariant violation
71  security boundary violation
72  resource ceiling exceeded
73  cancelled
```

For Harness-mediated Assurance commands, structured output SHALL expose both the Harness lifecycle code and exact Assurance exit code. The process MAY pass through Assurance exit codes only under explicit `--pass-through-assurance-exit`; otherwise a completed external invocation returns the Harness lifecycle code while preserving Assurance's code and verdict in JSON.

## 27. Stable Harness Reason Codes

Minimum stable reason codes:

```text
HARNESS_CONFIG_INVALID
HARNESS_PROFILE_UNSUPPORTED
HARNESS_SUBJECT_AMBIGUOUS
HARNESS_SUBJECT_DIRTY
HARNESS_SUBJECT_CHANGED_DURING_RUN
HARNESS_REVISION_MISMATCH
HARNESS_ASSURANCE_REQUIREMENTS_PLAN_INVALID
HARNESS_ASSURANCE_REQUIREMENTS_PLAN_UNSUPPORTED
HARNESS_ASSURANCE_REQUIREMENTS_PLAN_DIGEST_MISMATCH
HARNESS_REQUIREMENT_UNRESOLVED
HARNESS_REQUIREMENT_AMBIGUOUS
HARNESS_SDK_UNAVAILABLE
HARNESS_SDK_VERSION_UNSUPPORTED
HARNESS_SDK_DIGEST_MISMATCH
HARNESS_SDK_CAPABILITY_MISSING
HARNESS_SDK_EXECUTION_TIMEOUT
HARNESS_SDK_EXECUTION_ERROR
HARNESS_OBSERVATION_MISSING
HARNESS_OBSERVATION_SCHEMA_INVALID
HARNESS_OBSERVATION_SUBJECT_MISMATCH
HARNESS_OBSERVATION_PRODUCER_MISMATCH
HARNESS_OBSERVATION_CHECK_MISMATCH
HARNESS_OBSERVATION_TOO_LARGE
HARNESS_OBSERVATION_MUTATION_DETECTED
HARNESS_ASSURANCE_INPUT_INCOMPLETE
HARNESS_ASSURANCE_INPUT_DIGEST_MISMATCH
HARNESS_ASSURANCE_INPUT_PATH_INVALID
HARNESS_RUN_BUNDLE_DIGEST_MISMATCH
HARNESS_RUN_BUNDLE_ARCHIVE_UNSAFE
HARNESS_CANONICALIZATION_MISMATCH
HARNESS_CONFORMANCE_FAILED
HARNESS_REPLAY_INPUT_MISMATCH
HARNESS_REPLAY_OUTPUT_MISMATCH
HARNESS_CORPUS_SNAPSHOT_INVALID
HARNESS_CORPUS_VERSION_UNSUPPORTED
HARNESS_CORPUS_CONFLICT
HARNESS_CORPUS_CANDIDATE_REJECTED
HARNESS_GUIDANCE_DRIFT
HARNESS_FALLBACK_NOT_AUTHORIZED
HARNESS_FALLBACK_LIMITATION
HARNESS_RESOURCE_LIMIT_EXCEEDED
HARNESS_CANCELLED
HARNESS_INTERNAL_INVARIANT_VIOLATION
HARNESS_UPSTREAM_CONTRACT_UNLOCKED
HARNESS_WRITE_OUTSIDE_OWNED_PATH
HARNESS_VOLATILE_FIELD_IN_SEMANTIC_DIGEST
HARNESS_ASSURANCE_SIMULATION_NON_AUTHORITATIVE
```

Reason codes MUST NOT embed dynamic paths, timestamps, or IDs.

## 28. Determinism Requirements

### 28.1 Deterministic inputs

Harness MUST explicitly capture:

- subject digest;
- Harness profile digest;
- Assurance plan digest;
- SDK capability manifest digest;
- toolchain lock digest;
- normalized environment digest;
- corpus snapshot digest;
- execution adapter identity;
- explicit clock values where material.

### 28.2 Deterministic output rules

Harness MUST:

1. sort checks by explicit plan order and stable ID;
2. sort observation index entries by canonical path;
3. sort manifest files by canonical relative path;
4. normalize path separators to `/`;
5. normalize line endings where the owning contract permits;
6. use UTF-8;
7. avoid locale-sensitive formatting;
8. avoid filesystem iteration order;
9. avoid hidden current-time reads in pure logic;
10. avoid random identifiers in canonical payloads;
11. record externally generated execution IDs separately from deterministic run keys;
12. use Assurance canonicalization vectors;
13. exclude volatile projection fields from run-bundle content digest when the protocol says so;
14. prove output stability through replay tests.

### 28.3 Environment normalization

Default deterministic environment SHOULD set:

```text
LC_ALL=C.UTF-8
LANG=C.UTF-8
TZ=UTC
PYTHONHASHSEED=0
NO_COLOR=1
```

Additional tool-specific variables MUST be owned by the SDK adapter or check configuration.

## 29. Caching

All caches SHALL be bounded by configured byte count, entry count, and retention policy. Cache eviction SHALL not delete corpus outbox candidates, canonical run artifacts, or evidence required by an active replay record.

### 29.1 Cache safety

Execution caching is permitted only when the SDK check contract declares cache safety.

Cache keys MUST include:

1. exact subject digest;
2. check ID and version;
3. producer version and build digest;
4. configuration digest;
5. environment digest or declared relevant subset;
6. input artifact digests;
7. corpus snapshot digest when consumed.

### 29.2 Prohibited reuse

Harness MUST reject cache reuse when:

- subject changed;
- SDK version or digest changed;
- check version changed;
- configuration changed;
- required environment identity changed;
- cache entry lacks provenance;
- entry was produced by fallback mode under a canonical check key;
- the check contract does not declare cache safety.

### 29.3 Cache output semantics

A cache hit MUST still produce an execution record stating:

```yaml
executionMode: cache_reuse
sourceExecutionId: string
sourceArtifactDigests: string[]
cacheValidation: passed
```

## 30. Security Architecture

### 30.1 Threat model

Harness MUST assume malicious repositories, configs, observations, archives, logs, corpus candidates, templates, and tool output.

Threats include:

1. command injection;
2. path traversal;
3. symbolic-link escape;
4. malicious archive entries;
5. decompression bombs;
6. environment-variable secret leakage;
7. poisoned SDK binary;
8. protocol downgrade;
9. observation substitution;
10. revision substitution;
11. output-directory race;
12. stale cache injection;
13. corpus snapshot poisoning;
14. candidate auto-promotion;
15. malicious Markdown or terminal escapes;
16. test signer leakage;
17. denial of service through oversized or deeply nested JSON;
18. unsupported canonicalization algorithms;
19. mutable tag resolution drift;
20. workspace mutation outside allowed paths.

### 30.2 Subprocess security

Harness MUST:

1. invoke subprocesses without `shell=True`;
2. validate executable paths;
3. use argument arrays;
4. use environment allowlists;
5. enforce timeouts;
6. enforce output-size limits;
7. capture signals and termination reason;
8. sanitize rendered output;
9. prevent child processes from escaping configured process groups where supported;
10. deny network by default in container mode;
11. prohibit dynamic `eval`, `exec`, or `compile` of repository, corpus, fixture, or configuration content;
12. parse YAML only through `yaml.safe_load` or a stricter typed loader with custom tags disabled;
13. route user-visible output through the reporting adapter rather than uncontrolled runtime `print` calls.

### 30.3 Workspace confinement

Harness MUST:

1. resolve real paths;
2. reject output paths outside configured roots;
3. reject symlink traversal for generated artifacts;
4. avoid following repository symlinks during packaging unless explicitly declared;
5. write atomically;
6. use restrictive permissions for temporary directories;
7. clean only owned paths with ownership markers.

### 30.4 Archive safety

Archives MUST reject:

- absolute paths;
- `..` traversal;
- symlink or hardlink escape;
- device files;
- named pipes;
- excessive file count;
- excessive compressed or decompressed size;
- duplicate normalized paths;
- conflicting case-folded paths on relevant platforms.

### 30.5 Secret handling

Harness MUST NOT include secrets in Assurance input exports or Harness run bundles. It SHALL support configurable redaction for operational logs and environment reports.

Redaction SHALL be recorded as a derivative transformation with source digest, derivative digest, transformation identity, removed fields, operator, and time. Redaction MUST NOT modify canonical SDK observations selected for Assurance input. If an observation contains disallowed sensitive content, the export SHALL be blocked unless an authority-defined redacted evidence contract exists.

### 30.6 Signing

Release-zero Harness signing is deferred. Harness MUST NOT sign Assurance decisions, use Assurance production decision signers, or ship test keys in production packages.

A future Harness run-bundle integrity signature MAY be added only through a versioned Harness contract and security review. It SHALL remain distinct from Assurance decision signatures and SHALL not increase evidence admissibility.

## 31. Resource Limits

Release-zero preflight ceilings SHALL be equal to or more restrictive than the locked Assurance admission limits unless an authority-published plan explicitly provides tighter values:

| Resource | Default maximum |
|---|---:|
| Single observation | 1,048,576 bytes |
| Observation count | 1,000 |
| Findings per observation | 10,000 |
| Lineage depth when present | 32 |
| JSON nesting depth | 64 |
| Single string | 1,048,576 bytes |
| Extension namespaces | 64 |
| Per-check wall time | 15 minutes |
| Entire Harness run wall time | 60 minutes |
| Per-process stdout | 25 MB |
| Per-process stderr | 25 MB |
| Single supporting artifact | 100 MB |
| Total uncompressed Harness run bundle | 1 GB |
| Corpus candidate archive | 250 MB |
| Concurrent checks | CPU-aware, default max 4 |

Harness preflight limits reduce wasted execution and unsafe exports but do not replace Assurance admission. Relaxation of a locked Assurance limit is prohibited locally. Tighter Harness limits MUST be explicit, configuration-digest-bound, and reported.

## 32. Reliability and Failure Semantics

### 32.1 Partial results

Harness SHALL preserve completed execution records and valid observations when another check fails or infrastructure breaks.

The Assurance input export SHALL be marked incomplete when any required planned SDK observation is absent, invalid, or mismatched. A complete export SHALL never be synthesized from partial results.

### 32.2 Idempotency

Repeated export of identical validated inputs SHALL reproduce the same `assuranceInputDigest`. Repeated normalized bundling of the same complete run file set SHALL reproduce the same run-bundle content and archive digests.

### 32.3 Cancellation

Cancellation SHALL:

1. terminate active child processes;
2. preserve completed records and exact observations;
3. mark incomplete records;
4. prevent a complete Release-zero export and complete run bundle;
5. write a terminal run manifest atomically.

### 32.4 Crash recovery

Harness SHOULD support resumption from the latest valid state checkpoint when:

- subject lock still matches;
- immutable inputs match;
- toolchain locks match;
- completed execution artifacts verify;
- the selected SDK contract permits safe resumption.

Recovery SHALL create a new attempt record and SHALL not mutate completed records in place.

## 33. Observability

Harness telemetry is operational and MUST remain distinct from assurance evidence.

### 33.1 Metrics

Recommended metrics:

- runs started, completed, incomplete, failed;
- run duration;
- check duration by ID and version;
- SDK startup latency;
- observation counts and bytes;
- Assurance input and run-bundle size and build latency;
- cache hits and rejections;
- replay matches and mismatches;
- conformance outcomes;
- corpus pull, push, conflict, and candidate counts;
- fallback activation counts;
- resource-limit events.

### 33.2 Logs

Logs SHOULD include:

- correlation ID;
- run key;
- execution ID;
- subject digest;
- SDK version;
- Assurance contract version;
- check ID;
- reason code.

Logs MUST NOT include unrestricted source, secrets, tokens, private keys, full environment dumps, personal data without explicit necessity, or raw sensitive findings by default. Untrusted strings SHALL be sanitized for control characters, terminal escapes, and log-injection delimiters. Runtime modules SHALL emit structured events through logging/reporting ports rather than ad hoc console writes.

### 33.3 Adapter boundary

Telemetry MUST be emitted through a port with a no-op default. Harness MUST NOT own a central telemetry backend.

## 34. Conformance Architecture

### 34.1 Producer conformance

Harness SHALL run the exact Assurance-published producer fixture suite against SDK observation artifacts. Release-zero coverage SHALL include:

- valid observation;
- invalid schema;
- missing subject;
- repository identity mismatch;
- revision mismatch;
- unsupported schema version;
- invalid execution status;
- inconsistent summary counts;
- malformed finding location;
- incorrect payload digest;
- duplicate observation;
- stale timestamp;
- unauthorized check ID;
- oversized payload;
- invalid extension namespace;
- nondeterministic field ordering;
- missing configuration digest.

Harness SHALL report fixture results and fixture authority digests. Assurance remains the authority on admissibility.

### 34.2 Consumer conformance

Harness SHALL exercise the Assurance-published CI Core consumer fixtures to prove that a consumer can:

1. transport decisions byte-for-byte;
2. preserve decision digest;
3. publish verdict accurately;
4. display mandatory failures, indeterminate reasons, and active waivers;
5. avoid reinterpreting control status;
6. reject unsupported decision schemas safely;
7. escape untrusted summary content.

Harness is a fixture runner, not the authoritative consumer.

### 34.3 Canonicalization conformance

Harness SHALL pass all Assurance-published canonicalization fixtures used for schema validation, digest preimages, and replay. It MUST NOT choose an alternative canonical JSON algorithm.

### 34.4 Cross-language conformance

If Assurance enables generated Python bindings, Harness SHALL prove Python and TypeScript parse/reject parity, normalized object equivalence, canonical JSON equality, digest-preimage equality, and extension namespace preservation. If Python bindings are explicitly deferred by Assurance, this suite SHALL be `NOT_APPLICABLE_WITH_REASON`, not falsely passed.

## 35. Replay Architecture

### 35.1 Replay inputs

Replay MUST use:

- exact subject source or immutable repository bundle;
- subject lock;
- toolchain lock;
- Harness profile;
- Assurance plan;
- SDK capabilities;
- declared environment inputs;
- corpus snapshot;
- original execution order.

### 35.2 Comparison classes

Replay MUST compare:

1. plan digest;
2. check set and order;
3. execution configuration digests;
4. observation count;
5. observation canonical digests;
6. finding fingerprints where declared stable;
7. run-bundle content digest;
8. conformance result;
9. explicitly volatile fields separately.

### 35.3 Replay outcomes

- `match`: all required deterministic outputs match;
- `mismatch`: one or more required outputs differ;
- `inconclusive`: exact inputs or compatible environment could not be established.

Harness MUST NOT hide mismatch behind a tolerance score.

## 36. Configuration Model

### 36.1 Precedence

Configuration precedence depends on execution mode.

Local interactive mode:

1. explicit CLI arguments;
2. explicit run profile;
3. repository `.l9/harness.yaml`;
4. user config;
5. built-in secure defaults.

Hosted CI support mode:

1. immutable CI Core invocation contract;
2. explicit run profile supplied by CI Core;
3. reviewed repository `.l9/harness.yaml`;
4. built-in secure defaults.

User configuration MUST be ignored in hosted CI support mode. Environment variables MUST not override structured configuration unless each variable is explicitly mapped, allowlisted, and recorded. Assurance policy or profile semantics MUST NOT be overridden by Harness configuration.

### 36.2 Repository config

Recommended file:

```yaml
schema: l9.harness-config
schemaVersion: 1.0.0
repository:
  expectedHost: github.com
  expectedOwner: Quantum-L9
  expectedName: string
profiles:
  default: repository-default@1
sdk:
  version: string
  digest: string
assurance:
  contractsVersion: string
  cliVersion: string | null
corpus:
  adapter: filesystem | git | object-store
  location: string
  requiredSnapshot: string | null
execution:
  adapter: process | container
  outputRoot: .l9/harness/runs
security:
  network: denied
  environmentAllowlist: []
  maxAssuranceInputBytes: integer
  maxRunBundleBytes: integer
```

### 36.3 Unknown fields

Security-sensitive top-level configuration objects MUST reject unknown fields by default. Extension fields require a namespaced schema and explicit compatibility policy.

## 37. Dependency Policy

### 37.1 Runtime dependencies

Dependencies SHOULD be minimal and narrow.

Recommended categories:

- CLI framework;
- strict data validation;
- JSON Schema validation;
- canonicalization compatible with Assurance;
- cryptographic hashing;
- archive creation and inspection;
- TOML/YAML parsing with safe loaders;
- templating for guidance projections;
- process management.

### 37.2 Prohibited dependency patterns

- importing private sibling repository modules;
- unpinned Git dependencies in releases;
- large workflow engines;
- hidden network clients in core modules;
- unsafe YAML loaders;
- shell-command convenience wrappers that require string interpolation;
- test-only packages exported from production entrypoints.

### 37.3 Dependency review triggers

Security review is mandatory for new dependencies involving:

- canonicalization;
- cryptography;
- archive handling;
- subprocess execution;
- container control;
- remote corpus access;
- template rendering.

## 38. Compatibility, Versioning, and Contract Lock

### 38.1 Compatibility dimensions

| Dimension | Authority | Compatibility rule |
|---|---|---|
| Assurance schemas | `l9-assurance` | JSON Schema 2020-12 registry-driven support; no local semantic fork |
| Assurance plan | `l9-assurance` | Exact pinned output schema and artifact digest required once published |
| Assurance profile and controls | `l9-assurance` | `l9.pull-request@1.0.0` and seven locked controls for Release zero |
| Producer and check registry | `l9-assurance` | Release zero authorizes only `l9-ci-sdk`; trust expansion requires review |
| SDK public invocation and capability metadata | `l9-ci-sdk` | Exact producer version/build digest and public behavior required |
| SDK observation semantics | SDK plus Assurance schemas | Incompatible behavior requires check major-version change |
| Harness-owned schemas | `l9-harness` | Semantic versioning with explicit compatibility fixtures |
| Corpus snapshot | corpus publisher | Immutable snapshot ID, digest, and declared minimum Harness version |
| Guidance template | `l9-harness` | Template ID/version/digest pinned in guidance manifest |
| Canonicalization fixtures | `l9-assurance` | Exact algorithm, version, and fixture-set digest |

### 38.2 Contract-lock gate

Phase 0 SHALL produce `docs/requirements/compatibility-matrix.yaml` recording each boundary contract as `LOCKED`, `PROVISIONAL`, `UNSUPPORTED`, `NOT_APPLICABLE`, or `UNKNOWN`.

Release-zero production adapters SHALL not proceed until these are locked:

1. Assurance subject, observation, finding, artifact-reference, and decision schemas;
2. Assurance Release-zero producer, check, profile, control, and policy records;
3. Assurance canonical JSON algorithm and fixtures;
4. Assurance plan output schema and digest contract;
5. SDK public invocation contract;
6. SDK version/build identity and capability metadata;
7. SDK observation fixture pack.

Assurance v2.0.1 establishes and packages items 1 through 4 with digest-bound artifacts and executable conformance evidence. Items 5 through 7 remain SDK-owned blockers. Experimental SDK adapters MAY target provisional fixtures only behind explicit feature flags and SHALL not produce complete Release-zero exports.

### 38.3 Version change rules

- incompatible Harness-owned schema changes require a major version;
- additive optional fields require a minor version and compatibility fixtures;
- reason-code meaning is immutable within a major version;
- removing a CLI option requires deprecation unless security requires immediate removal;
- changing digest scope, run-key inputs, Assurance input completeness, or run-bundle normalization is a major Harness protocol change;
- the latest version is never selected implicitly in CI or release mode.

### 38.4 Generated binding provenance

Harness SHALL not hand-write semantic copies of Assurance protocol types. Generated or imported bindings SHALL record source repository, source path, source version, source digest, generator version, generation command, and output digest. CI SHALL regenerate or re-fetch pinned artifacts and fail on drift.

## 39. Digest, Identity, and Reproducibility Semantics

### 39.1 Domain separation

Every Harness content-derived identifier SHALL use a unique domain prefix:

```text
l9.harness.subject-identity.v1
l9.harness.run-key.v1
l9.harness.plan-id.v1
l9.harness.assurance-input.v1
l9.harness.run-bundle-content.v1
l9.harness.corpus-candidate.v1
```

Harness SHALL use the Assurance-defined canonical JSON algorithm for Assurance protocol payload digests. Harness-owned run and bundle objects MAY use the same algorithm but SHALL use distinct domain prefixes.

### 39.2 Run-key inputs

`runKey` SHALL include only normalized immutable semantic inputs:

1. subject identity digest;
2. Harness run-profile digest;
3. pinned Assurance plan digest;
4. pinned Assurance schema, registry, profile, and policy digests applicable to planning;
5. SDK public-contract or capability-manifest digest;
6. toolchain semantic digest;
7. normalized relevant environment digest;
8. corpus snapshot digest when consumed;
9. execution adapter identity and version;
10. explicit deterministic clock inputs only when an SDK check contract declares them semantic.

It SHALL exclude execution ID, attempt, operational timestamps, log paths, resource usage, process IDs, temporary paths, and presentation options.

### 39.3 Archive normalization

Optional Harness run-bundle archives SHALL use stable path ordering, fixed owner/group, fixed permissions by role, fixed timestamp from `SOURCE_DATE_EPOCH`, no extended attributes, no absolute paths, and pinned compression implementation/version. Reproducibility SHALL be verified from two isolated directories.

### 39.4 Volatile-field handling

Every Harness-owned schema containing timestamps, execution IDs, resource usage, or environment details SHALL declare each field semantic, operational, projection-only, or secret-sensitive. A volatile operational field entering `runKey` or `assuranceInputDigest` is release-blocking.

## 40. Command Inputs, Outputs, Writes, and Network Matrix

| Command | Required inputs | Canonical outputs | Allowed writes | Network default | Lifecycle success condition |
|---|---|---|---|---|---|
| `init` | repository root, explicit `--write` | config/write plan | Harness config and owned directories only | denied | requested owned files created atomically |
| `doctor` | config context | command result, capability report | report path only | denied; optional probes explicit | required local prerequisites established |
| `plan` | exact subject, run profile, pinned Assurance plan, pinned SDK contract | subject lock, toolchain lock, Harness plan | run root | denied | required mappings resolved or explicit incomplete result emitted |
| `run` | verified plan and exact subject | execution records, preserved observations, Assurance input export | run root only | SDK-contract declared | all planned SDK executions reached contract-complete states and export verifies |
| `collect` | recorded execution root | observation index, collection report | run root only | denied | all declared outputs classified; ambiguity absent |
| `package` | validated observations and declared supporting refs | canonical `artifacts/observations`, `artifacts/supporting`, Harness input manifest | run artifacts directory | denied | Release-zero completeness and integrity verify |
| `bundle` | verified run artifacts | run-bundle manifest and optional archive | run bundle directory | denied | deterministic bundle verifies |
| `verify` | Assurance input, run directory, or run bundle | verification report | report path only | denied | selected integrity and safety checks pass |
| `replay` | replay record and immutable inputs | new attempt, comparison report | new execution directory | denied unless immutable source fetch explicit | comparison produced; mismatch exits 67 |
| `conformance *` | pinned Assurance fixtures | conformance report | conformance root | denied | required suite completes without required failures |
| `assurance plan` | pinned Assurance CLI, exact subject/profile | exact plan artifact and invocation record | run input directory | denied | external command completed and output captured |
| `assurance admit` | canonical observation root and subject | exact admission working artifacts and report | Harness invocation directory plus byte-preserved canonical report mapping | denied | external command completed; no authority publication |
| `assurance evaluate` | accepted evidence, exact profile/policy/time | exact Assurance outputs | `artifacts/assurance` | denied | external command completed; no authority publication |
| `assurance verify` | decision and optional verifier | exact verification report | assurance invocation directory | denied | external command completed |
| `assurance simulate` | historical or current canonical artifacts, profile, policy | exact simulation outputs | assurance invocation directory | denied | external command completed; permanently non-authoritative |
| `corpus pull` | endpoint/path, snapshot selector | verified cached snapshot | corpus cache only | adapter-dependent explicit | snapshot verifies before activation |
| `corpus push` | sanitized outbox candidates | submission receipt | outbox state only | adapter-dependent explicit | accepted for review; no promotion implied |
| `corpus sync` | cache/outbox state | pull/push/conflict report | cache and outbox only | adapter-dependent explicit | no unresolved blocking conflict |
| `corpus status` | local corpus state | status report | none | denied | state inspected |
| `guidance generate` | approved source manifests, template, explicit `--write` | guidance and manifest | declared guidance paths only | denied | deterministic output and provenance complete |
| `guidance check` | generation inputs | drift report | none | denied | no drift or exit 69 with exact metadata |
| `clean` | owned root, retention policy, confirmation | deletion manifest | Harness-owned generated artifacts only | denied | every deletion passed ownership and confinement |

No command may perform an unlisted write or network action. `--json` SHALL fully describe side effects, external commands, artifacts, and limitations.

## 41. Requirements Traceability and Validation Evidence

### 41.1 Critical invariant registry

| Requirement ID | Invariant | Required evidence |
|---|---|---|
| HAR-BOUND-001 | Harness never evaluates controls or issues verdicts | architecture import test and forbidden-symbol scan |
| HAR-BOUND-002 | SDK owns canonical check execution semantics | adapter contract test and duplicate-check inventory |
| HAR-BOUND-003 | authoritative Release-zero flow does not require Harness | CI Core integration contract test and topology assertion |
| HAR-BOUND-004 | Assurance input has no proprietary Harness envelope | admission integration fixture using observations directory directly |
| HAR-SUB-001 | exact immutable subject locked before execution | subject substitution and changed-worktree tests |
| HAR-SUB-002 | subject revalidated before Assurance input export and run-bundle completion | mutation-during-run integration test |
| HAR-PLAN-001 | no required capability mapping is guessed | ambiguous/missing mapping fixtures |
| HAR-OBS-001 | SDK observation bytes are preserved | source/export raw-digest equality test |
| HAR-OBS-002 | canonical payload digest matches authority vectors | Assurance canonicalization fixtures and conditional cross-language parity |
| HAR-ART-001 | digest scopes are distinct and reproducible | dual-build Assurance-input and run-bundle reproduction test |
| HAR-ART-002 | Assurance-input verification never claims admission | API/schema assertion and negative test |
| HAR-SIM-001 | simulation is always non-authoritative | command contract and output schema test |
| HAR-CACHE-001 | revision-bound observations are never reused | commit-A/commit-B invalidation test |
| HAR-CORPUS-001 | outbox cannot promote to approved cache | filesystem/API capability denial test |
| HAR-GUIDE-001 | generated guidance is deterministic and non-authoritative | two-build drift test and manifest assertion |
| HAR-SEC-001 | subprocesses avoid shell interpolation | static architecture test and adversarial arguments |
| HAR-SEC-002 | path/archive traversal is rejected | adversarial corpus, input-export, and run-bundle fixtures |
| HAR-CFG-001 | CI mode ignores user config | precedence integration test |
| HAR-REL-001 | failed SDK checks remain valid completed Harness output | lifecycle/observation integration test |
| HAR-REL-002 | incomplete outputs never become complete Release-zero exports | missing-observation negative test |
| HAR-VER-001 | unsupported/downgraded protocols fail closed | compatibility matrix fixtures |
| HAR-WRITE-001 | repository source is not implicitly modified | dirty-tree before/after tests for read-only commands |

### 41.2 Traceability artifact

`docs/requirements/traceability.yaml` MUST map every normative requirement to:

- source section;
- requirement ID;
- owning module;
- implementation symbol or file;
- test IDs;
- validation command;
- current status;
- evidence artifact;
- unresolved dependency.

No release-readiness claim is valid when a `MUST` requirement lacks executable evidence or an explicit blocked status.

### 41.3 Validation ladder

Validation MUST run in this order and continue collecting independent failures where safe:

1. generated-file drift;
2. formatting;
3. lint;
4. strict type checking;
5. schema and fixture validation;
6. unit tests;
7. architecture tests;
8. contract and conformance tests;
9. integration tests;
10. replay and reproducibility tests;
11. adversarial security tests;
12. performance/resource tests;
13. package inspection;
14. clean-checkout CI-equivalent run.

The final validation report MUST record command, environment, exact result, evidence path, skipped reason, and unresolved risk. Pass-only prose is prohibited.

## 42. Testing Strategy

### 42.1 Unit tests

Cover pure domain logic, ordering, digest inputs, reason codes, state transitions, mapping, and validation.

### 42.2 Contract tests

Cover all Harness schemas and imported Assurance/SDK contracts.

### 42.3 Integration tests

Cover CLI, process adapter, container adapter, SDK invocation, Assurance input export and run-bundle build, Assurance simulation, corpus adapters, and guidance generation.

### 42.4 Architecture tests

Architecture tests SHALL combine dependency/import inspection with executable negative fixtures. Source-grep-only theater is insufficient for behavioral boundaries, but targeted scans remain valid for prohibited imports, symbols, `PacketEnvelope`, dynamic execution primitives, and secret material.

Must enforce:

1. domain layer has no I/O imports;
2. Assurance evaluator internals are not imported;
3. SDK private modules are not imported;
4. fallback package cannot emit SDK identity;
5. reporting cannot be imported by domain core;
6. corpus cannot mutate Assurance registries;
7. guidance cannot import policy evaluation;
8. GitHub publication libraries are absent from runtime dependencies;
9. mutation libraries are absent;
10. test signers are absent from production exports;
11. `PacketEnvelope` and proprietary Assurance wrapper schemas are absent;
12. fallback artifacts cannot reach complete Release-zero export code paths;
13. dynamic `eval`, `exec`, and unsafe YAML loaders are absent from runtime paths.

### 42.5 Property tests

Properties MUST include:

- file-order independence;
- observation-order independence of Assurance input digest after canonical sorting;
- duplicate file rejection;
- subject change invalidates run key;
- config change invalidates run key;
- cache key sensitivity;
- Assurance input export and run-bundle build idempotency;
- path normalization safety;
- fallback cannot match SDK producer identity;
- projections do not affect canonical digest;
- partial results never become complete Release-zero exports.

### 42.6 Adversarial tests

Required cases:

- path traversal;
- symlink escape;
- archive bomb;
- malformed Unicode;
- terminal escape output;
- malicious Markdown;
- oversized observation;
- deeply nested JSON;
- duplicate normalized paths;
- SDK binary substitution;
- observation subject substitution;
- observation producer substitution;
- protocol downgrade;
- stale cache injection;
- corpus snapshot tampering;
- concurrent Assurance-input export or run-bundle write race;
- subject changes during run;
- cancellation during archive build;
- test key present in release artifact.

### 42.7 Replay tests

A stable fixture suite MUST produce zero deterministic mismatches across supported platforms, except fields explicitly classified as volatile.

### 42.8 Performance tests

Initial targets:

| Operation | Target |
|---|---:|
| Subject lock | p95 under 250 ms excluding Git network |
| Plan 500 requirements | p95 under 1 second |
| Validate 1,000 observations | p95 under 5 seconds |
| Build 250 MB run bundle | p95 under 15 seconds on reference runner |
| Verify 250 MB run bundle | p95 under 10 seconds |
| Corpus status | p95 under 500 ms local |
| Replay manifest comparison | p95 under 2 seconds |
| Idle Harness overhead excluding checks | under 256 MB memory |

## 43. Build and Release Architecture

### 43.1 Toolchain

Recommended baseline:

```text
Python >=3.11,<3.14
uv for dependency and lock management
hatchling or equivalent PEP 517 build backend
pytest
mypy strict
ruff lint and format
jsonschema or equivalent validator
```

### 43.2 Release artifacts

Each release SHOULD produce:

- Python wheel;
- source distribution;
- checksums;
- SBOM;
- provenance attestation;
- schema bundle;
- conformance fixture bundle;
- CLI help snapshot;
- package-content manifest.

### 43.3 Release gates

Release MUST fail when:

1. generated bindings drift;
2. schema registry drift exists;
3. lockfile is stale;
4. conformance fails;
5. replay mismatch exists;
6. package contains test keys;
7. package contains absolute local paths;
8. package contains corpus cache or run outputs;
9. package exports fallback as canonical SDK identity;
10. architecture tests fail;
11. dependency review is incomplete for security-sensitive additions;
12. enabled production adapters depend on an `UNKNOWN` or `PROVISIONAL` plan, SDK, schema, registry, or canonicalization contract;
13. canonical Assurance artifacts cannot be consumed without Harness-specific parsing;
14. fallback output is reachable from complete Release-zero exports;
15. the package contains `PacketEnvelope`, verdict logic, GitHub publication, or mutation capabilities.

## 44. Documentation Set

Required root documents:

### `README.md`

Mission, role, quick start, command surface, artifact flow, boundaries, status.

### `ARCHITECTURE.md`

Topology, layers, dependency direction, state machine, sequence diagrams, package boundaries.

### `SPECIFICATION.md`

Normative functional and non-functional requirements.

### `ROADMAP.md`

Phases, dependencies, exit criteria, migration, rollout, rollback.

### `SECURITY.md`

Threat model, reporting, security invariants, release security, runbooks.

### `CONTRIBUTING.md`

Scope test, change categories, protocol changes, fixture rules, determinism, review checklist.

### `CHANGELOG.md`

Semantic changes, protocol changes, migration notes, deprecations.

### Required ADRs

At minimum:

1. ADR-001 Harness is an execution and transport plane, not a trust plane.
2. ADR-002 Assurance plans are consumed, not reimplemented.
3. ADR-003 SDK-first execution with isolated fallback producer.
4. ADR-004 Exact subject locking before execution.
5. ADR-005 Byte-preserving observation transport.
6. ADR-006 Deterministic run key plus boundary execution ID.
7. ADR-007 Central corpus replaces sibling propagation.
8. ADR-008 Cache and outbox are separate.
9. ADR-009 Candidate promotion requires external governance.
10. ADR-010 Canonical JSON authority over projections.
11. ADR-011 Process adapter default, container adapter optional.
12. ADR-012 Assurance simulation is external and non-authoritative.
13. ADR-013 Protocol fixtures drive cross-language compatibility.
14. ADR-014 Operational telemetry is not assurance evidence.
15. ADR-015 Clean rewrite with explicit asset disposition.

## 45. Implementation Phases

### Phase 0: Repository and cross-repository contract lock

Deliverables:

- exact `l9-harness` baseline commit and clean-state report;
- complete asset-disposition matrix;
- locked Assurance v2 specification recorded as authority;
- pinned Assurance schema, registry, profile, policy, and fixture artifact inventory;
- captured canonical `l9-assurance plan` output, schema, digest, and embedded protocol-bundle status;
- pinned SDK public invocation and observation-contract inventory;
- compatibility matrix and Unknown register;
- ADRs for Harness non-authoritative placement, no competing envelope, and fallback exclusion.

Exit gate: repository facts are verified; Assurance Release-zero artifacts and plan contract are pinned; unresolved SDK public-contract gaps remain explicitly blocking production adapters.

### Phase 1: Repository skeleton and boundary enforcement

Deliverables:

- Python package skeleton;
- Harness-owned schemas only;
- architecture tests prohibiting Assurance evaluator imports, SDK private imports, GitHub publication, mutation, PacketEnvelope, and proprietary Assurance wrappers;
- L9 metadata index and generated provenance mechanism;
- deterministic formatting, lint, typing, tests, and lockfile.

Exit gate: all packages import and all boundary-negative fixtures fail as designed.

### Phase 2: Exact subject and toolchain locking

Deliverables:

- full Git revision resolution;
- repository identity normalization;
- dirty-state handling;
- subject and toolchain locks;
- pre-export subject revalidation;
- run-key derivation.

Exit gate: branch/tag selectors never become subject identity and mutation-during-run is detected.

### Phase 3: Assurance plan and SDK contract resolution

Deliverables:

- pinned Assurance plan adapter;
- exact Release-zero check mapping;
- SDK public CLI/API adapter;
- capability resolution and ambiguity rejection;
- incomplete-plan semantics;
- no private profile or control copies.

Exit gate: all six SDK checks resolve exactly or the run remains incomplete; Assurance-derived revision consistency is not misrepresented as an SDK check.

### Phase 4: SDK execution and observation preservation

Deliverables:

- bounded process/container invocation;
- public SDK execution only;
- exact observation capture;
- raw and canonical digests;
- Release-zero observation limits;
- fallback diagnostic isolation;
- missing-output and infrastructure-failure semantics.

Exit gate: canonical SDK observation bytes remain unchanged and fallback output cannot enter a complete Release-zero export.

### Phase 5: Assurance-compatible artifact export

Deliverables:

- exact `artifacts/observations/` and `artifacts/supporting/` layout;
- Release-zero canonical filenames and source mapping;
- Assurance input manifest;
- subject and completeness verification;
- no competing packet or envelope.

Exit gate: pinned Assurance CLI can discover the exported observations without Harness-specific parsing.

### Phase 6: Harness run bundle and replay

Deliverables:

- run-bundle manifest;
- normalized archive support;
- replay records and mismatch classification;
- separation between Assurance input digest and run-bundle digest;
- archive security tests.

Exit gate: two isolated builds reproduce deterministic bundle identities where semantic inputs are equal.

### Phase 7: Assurance external invocation and conformance

Deliverables:

- adapters for `plan`, `evidence admit`, `evaluate`, `verify`, `conformance`, and `simulate`;
- exact output and exit-code capture;
- permanent non-authoritative publication marker;
- producer and consumer fixture runners;
- conditional cross-language conformance.

Exit gate: API/CLI outputs are preserved and Harness never reconstructs a verdict.

### Phase 8: Shadow parity with CI Core

Deliverables:

- hosted versus Harness SDK observation comparison;
- byte/digest mismatch report;
- environment and configuration delta report;
- rollback-safe shadow runbook;
- no authority promotion.

Exit gate: sufficient evidence exists for a separate governance decision; this phase does not place Harness in the authoritative path.

### Phase 9: Central corpus and guidance

Deliverables:

- explicit corpus `pull`, `push`, `sync`, and `status`;
- separate cache and outbox;
- no sibling propagation or automatic promotion;
- deterministic `CLAUDE.md` and `.cursor/rules/l9.mdc` projections;
- source and digest manifests.

Exit gate: corpus candidates remain unapproved and guidance cannot affect Assurance input or decision semantics.

### Phase 10: Hardening and release

Deliverables:

- architecture, unit, contract, integration, conformance, replay, adversarial, property, and performance suites;
- security review;
- operator runbooks;
- release artifact inspection;
- actual repository migration report;
- final GO/NO_GO architecture review.

Exit gate: every Harness acceptance criterion passes and all cross-repository Unknowns that affect active code are resolved.

## 46. Initial Vertical Slice

The first production-oriented Harness slice SHALL mirror, not replace, the Assurance Release-zero contract.

```yaml
subject:
  kind: git-revision
producer:
  id: l9-ci-sdk
assuranceProfile:
  id: l9.pull-request
  version: 1.0.0
authoritativeConsumerAndPublisher:
  id: l9-ci-core
harnessRole:
  mode: optional_local_and_shadow
  publicationAuthority: none
requiredSdkChecks:
  - l9.repository-metadata
  - l9.transport-packet
  - l9.sdk-validation
  - l9.lint
  - l9.tests
  - l9.mandatory-findings
harnessCapabilities:
  - exact_subject_lock
  - pinned_assurance_plan_capture
  - sdk_public_contract_resolution
  - bounded_sdk_execution
  - byte_preserving_observation_capture
  - assurance_artifact_layout_export
  - input_integrity_verification
  - producer_and_consumer_conformance
  - deterministic_replay_bundle
  - non_authoritative_assurance_invocation
excludedUntilLater:
  - authoritative_ci_dependency_on_harness
  - authoritative_signing
  - repair_mutation_profile
  - prevention_pack_publication_profile
  - release_candidate_profile
  - multi_subject_runs
  - remote_execution_farm
  - automatic_repair
  - generalized_workflow_dag
```

The exact checks SHALL be read from the pinned Assurance plan and verified against the locked Release-zero profile. Harness SHALL fail closed on any mismatch rather than silently hardcode a divergent profile.

## 47. Acceptance Criteria

L9 Harness v2 is aligned and releasable only when all are true:

1. Harness is documented as optional local execution, preservation, conformance, replay, and shadow tooling.
2. The authoritative Release-zero CI path is documented without Harness as a required hop.
3. Assurance owns schemas, admission, registries, controls, profiles, policies, waivers, unknowns, and decisions.
4. SDK owns canonical check execution and observation emission.
5. CI Core owns authoritative orchestration, byte-preserving transport, and publication.
6. Harness imports no Assurance implementation internals.
7. Harness imports no SDK private modules.
8. Harness requests no GitHub write authority and publishes no checks.
9. Harness never applies or approves repository mutations.
10. Exact repository identity and full commit are locked before execution.
11. Subject is revalidated before Assurance input export and run-bundle completion.
12. Dirty worktree mode cannot masquerade as `git-revision`.
13. SDK version and build digest are pinned.
14. Assurance schema, registry, profile, policy, and fixture digests are pinned.
15. The Assurance plan artifact is captured with exact version and digest.
16. The authority-published plan schema, plan digest, and embedded protocol-bundle digest validate before production parsing is enabled.
17. The six Release-zero SDK checks resolve exactly.
18. `L9.CI.EVIDENCE_REVISION_CONSISTENCY` is not emitted as a fake SDK observation.
19. SDK observations retain exact bytes and canonical digests.
20. Producer, check, subject, configuration digest, execution status, counts, findings, artifacts, and extensions are preserved.
21. Observation mutation is detectable.
22. Check failure remains distinct from Harness infrastructure failure.
23. Missing required observations make the export incomplete, not failed evidence.
24. Fallback requires explicit opt-in and remains diagnostic-only.
25. Fallback output cannot enter a complete Release-zero Assurance input set.
26. Canonical `artifacts/observations/` and `artifacts/supporting/` layout matches Assurance v2.
27. Harness does not require Assurance to parse a Harness manifest, packet, or archive.
28. `PacketEnvelope` is absent.
29. Runtime TransportPacket rules are not misapplied to filesystem CI artifact exchange.
30. The `l9.transport-packet` SDK observation remains preserved as an exact check result.
31. Assurance input digest is reproducible.
32. Harness run-bundle digest and archive digest are separately scoped.
33. Paths are portable, confined, and safe.
34. Archives resist traversal, symlink escape, and decompression abuse.
35. Local preflight never claims evidence admission.
36. Harness-mediated Assurance invocation uses a separate pinned tool.
37. Exact Assurance outputs and exit codes are preserved.
38. Harness-mediated publication authority is always false.
39. Harness summaries never reconstruct or alter verdicts.
40. All Assurance Release-zero producer conformance fixtures pass.
41. All consumer conformance fixtures can be exercised and preserved.
42. Canonicalization fixtures pass.
43. Cross-language conformance passes when Python bindings are enabled, otherwise is explicitly not applicable.
44. Replay produces zero unexplained mismatch for stable fixtures.
45. Subject changes invalidate revision-bound observations and exports.
46. Toolchain or contract changes invalidate unsafe reuse.
47. Cache keys include all declared semantic inputs.
48. Corpus uses a central configured path or endpoint.
49. Corpus cache and outbox are separate.
50. Peer-to-peer sibling propagation is absent.
51. Candidate promotion cannot occur inside Harness.
52. Corpus snapshots are versioned and digest-bound.
53. Operational commands support complete JSON output.
54. `CLAUDE.md` and `.cursor/rules/l9.mdc` generation is deterministic.
55. Guidance identifies sources and remains non-authoritative.
56. Security-sensitive Harness schemas reject unknown fields by default.
57. Subprocess invocation avoids shell interpolation and environment leakage.
58. Resource ceilings and Assurance Release-zero observation limits are enforced or more restrictive.
59. Logs are sanitized and untrusted Markdown is escaped.
60. Test signers and keys are excluded from production dependencies and releases.
61. Architecture tests enforce all ownership and dependency boundaries.
62. Shadow comparison proves hosted and Harness SDK outputs equivalent before any future authority proposal.
63. A repaired commit always requires fresh SDK observations and a fresh Assurance decision.
64. Final architecture review returns `GO` or `GO_WITH_EXPLICIT_NON_BLOCKING_FOLLOWUPS` only under the defined release rules.

## 48. Rollout Strategy

### Stage A: Local contract exercise

Harness runs against pinned SDK and Assurance fixtures. No CI authority or publication exists.

### Stage B: Hosted shadow comparison

CI Core continues the locked direct SDK to Assurance flow. Harness runs separately and compares subject, configuration, observations, digests, environment, and timing.

### Stage C: Conformance and replay service

Harness becomes the standard local and CI-side conformance/replay utility while remaining outside authoritative publication.

### Stage D: Optional future CI integration proposal

Only after measured parity may maintainers propose CI Core invoking Harness as an execution helper. That proposal requires a separate specification amendment, cross-repository approval, rollback plan, and proof that observation bytes and authority boundaries remain unchanged.

### Stage E: Legacy Harness removal

Remove duplicated scanners, verdict logic, sibling corpus propagation, automatic promotion, proprietary envelopes, and ambiguous summary authorities.

### Rollback

Rollback SHALL:

1. preserve all Harness, Assurance, and mismatch artifacts;
2. avoid rewriting prior decisions;
3. leave the locked direct CI Core to SDK to Assurance path intact;
4. disable optional Harness shadow execution through CI Core configuration;
5. keep compatibility and conformance evidence;
6. document the exact failure reason;
7. never restore branch-only subjects, auto-promotion, or verdict reconstruction.

## 49. Operational Runbooks

Required runbooks:

1. exact subject cannot be resolved;
2. worktree changes during run;
3. SDK unavailable;
4. SDK digest mismatch;
5. SDK capability missing;
6. Assurance plan schema, profile, or canonical fixture unsupported;
7. SDK public invocation or capability contract unresolved;
8. observation schema invalid;
9. observation subject mismatch;
10. Assurance input or run-bundle digest mismatch;
11. archive safety violation;
12. Assurance CLI unavailable;
13. Assurance admission or evaluation command fails operationally;
14. Assurance local decision is `indeterminate`;
15. producer conformance regression;
16. consumer conformance regression;
17. canonicalization mismatch;
18. conditional cross-language mismatch;
19. replay mismatch;
20. hosted-versus-local observation mismatch;
21. corpus snapshot invalid;
22. corpus conflict;
23. candidate contains secrets;
24. fallback activated unexpectedly;
25. resource ceiling exceeded;
26. cancellation or worker crash;
27. generated guidance drift;
28. release artifact contains test material;
29. central corpus unavailable in offline mode;
30. cache poisoning suspected.

Every runbook MUST define:

- detection;
- immediate containment;
- user-visible lifecycle status;
- Assurance semantic status when an external command completed;
- preserved artifacts;
- recovery;
- retry conditions;
- escalation owner;
- whether a new subject, run, export, or Assurance decision is required.

## 50. Governance and Review Triggers

Mandatory architecture review is required for:

- changing Harness role;
- adding orchestration primitives;
- adding new producer identities;
- changing fallback behavior;
- changing run-key inputs;
- changing Assurance input layout or run-bundle contract;
- changing subject semantics;
- adding cache reuse classes;
- adding automatic corpus behavior;
- importing a sibling implementation module.

Mandatory security review is required for:

- subprocess changes;
- archive changes;
- path handling changes;
- remote corpus adapters;
- canonicalization changes;
- digest algorithm changes;
- signing support;
- environment exposure;
- new template engines;
- container privilege changes.

Joint Assurance and SDK review is required for:

- observation transport changes;
- capability mapping changes;
- conformance fixture changes;
- producer/check identity changes;
- Assurance planning contract changes;
- cross-language binding changes.

## 51. Prohibited Anti-Patterns

The following are release blockers:

1. `if all_checks_passed: verdict = pass` inside Harness;
2. copied or reimplemented Assurance control, policy, waiver, or verdict logic;
3. Harness inserted as an undocumented required hop in the authoritative Release-zero path;
4. branch name, tag, PR number, or path used as subject identity;
5. fallback output emitted under `l9-ci-sdk` identity or placed in complete Release-zero observations;
6. parsing logs to reconstruct canonical observations;
7. mutating SDK observation payloads or summary counts;
8. creating an SDK observation for Assurance-owned revision-consistency control;
9. wrapping Assurance inputs in a proprietary Harness packet or requiring `PacketEnvelope`;
10. treating runtime `TransportPacket` as the filesystem artifact envelope for Assurance;
11. copying Assurance schemas without provenance and drift enforcement;
12. importing Assurance evaluator, registry, control, policy, or evidence internals;
13. importing SDK private modules;
14. storing absolute paths in portable exports or bundles;
15. allowing Markdown or console summaries to drive automation;
16. importing GitHub publication libraries;
17. applying patches during any Harness command;
18. silently retrying with a different SDK, Assurance, schema, registry, profile, or policy version;
19. using floating latest tags without digest pinning;
20. treating missing required output as positive failure evidence;
21. reusing commit A observations for commit B;
22. hidden network access in offline mode;
23. random IDs or operational timestamps inside semantic digests;
24. auto-accepting corpus conflicts or promoting candidates;
25. shipping test signers, credentials, or private keys;
26. claiming cross-language conformance when Python bindings are deferred;
27. claiming production readiness while the Assurance plan schema or SDK public contract remains unresolved.

## 52. Definition of Done

The Harness rewrite is complete when, from a clean checkout and pinned toolchain, it can:

```text
1. resolve and lock an exact Git revision;
2. capture the pinned Assurance Release-zero plan for l9.pull-request@1.0.0;
3. resolve the six required checks against a pinned SDK public contract;
4. execute those SDK checks in a bounded environment;
5. preserve canonical SDK observation bytes without semantic mutation;
6. preflight observations against pinned Assurance schemas without claiming admission;
7. export the exact Assurance observations/ and supporting/ layout;
8. prove no Harness wrapper is required by Assurance;
9. build an optional deterministic Harness run bundle for replay;
10. pass producer, consumer, canonicalization, and applicable cross-language conformance;
11. replay the run and classify every mismatch;
12. invoke Assurance externally and preserve exact non-authoritative outputs;
13. compare local outputs with the locked CI Core direct path in shadow mode;
14. synchronize a versioned central corpus without sibling propagation or auto-promotion;
15. generate deterministic developer guidance projections;
16. prove through architecture tests that Harness does not admit, decide, publish, mutate, diagnose, mine, or serve editor behavior.
```

## 53. Specification Release Decision

This specification is aligned to the locked Assurance v2 Release-zero architecture and is implementation-ready for Harness Phase 0, repository architecture, Harness-owned schemas, and boundary tests.

```yaml
alignment:
  assurance_v2_specification_2_0_0: PASS
  release_zero_subject_producer_profile_consumer: PASS
  authoritative_ci_path_without_harness: PASS
  canonical_artifact_layout: PASS
  producer_and_check_ids: PASS
  verdict_and_admission_boundaries: PASS
  no_competing_transport_envelope: PASS
  fallback_excluded_from_release_zero: PASS
  conditional_cross_language_rule: PASS
implementation_readiness:
  repository_inventory: BLOCKED_PENDING_REPOSITORY_ACCESS
  assurance_plan_output_schema: PASS_LOCKED_L9_ASSURANCE_PLAN_V1
  sdk_public_invocation_contract: BLOCKED_PENDING_VERIFICATION
  sdk_capability_manifest: BLOCKED_PENDING_VERIFICATION
  canonicalization_fixture_set: PASS_LOCKED_L9_CANONICAL_JSON_V1
  harness_owned_architecture_and_schemas: APPROVED_FOR_PHASE_0_AND_PHASE_1
  production_cross_repository_adapters: BLOCKED
  authoritative_ci_dependency_on_harness: PROHIBITED_WITHOUT_SEPARATE_AMENDMENT
```

The smallest safe next action is Phase 0: inspect the actual Harness repository and lock the SDK public invocation, version, build-identity, capability, and observation-fixture contracts before production adapter code begins.

## 54. Final Target State

```text
Authoritative Release-zero path:

Pull request
  -> CI Core provisions pinned SDK
  -> SDK emits canonical observations
  -> CI Core transports observations unchanged
  -> Assurance admits evidence and evaluates l9.pull-request@1.0.0
  -> Assurance issues immutable decision
  -> CI Core publishes exact decision

Harness support path:

Developer, CI shadow job, or incident operator selects exact revision
  -> Harness locks subject and pinned contracts
  -> Harness invokes the same public SDK checks
  -> Harness preserves canonical observations
  -> Harness exports the exact Assurance artifact layout
  -> Harness optionally invokes Assurance non-authoritatively
  -> Harness runs conformance, replay, and hosted-parity comparison
  -> Harness stages sanitized corpus candidates and guidance projections
```

Permanent invariant:

```text
CI Core orchestrates and publishes.
CI SDK executes checks and emits observations.
Harness exercises, preserves, conforms, replays, and compares.
Assurance admits, evaluates, and decides.
Debt Resolver diagnoses.
PR Repair mutates.
Debt Intelligence learns.
Debt LSP prevents.
```

## 55. Immediate Next Build Artifacts

The first implementation pack SHALL contain only:

1. `README.md`;
2. `AGENTS.md`;
3. `RUNBOOK.md`;
4. `ARCHITECTURE.md`;
5. `SPECIFICATION.md`;
6. `ROADMAP.md`;
7. `SECURITY.md`;
8. `CONTRIBUTING.md`;
9. `CHANGELOG.md`;
10. `L9_META.yaml` and tracked-file metadata index rules;
11. `pyproject.toml`, lockfile, strict typing, linting, and test configuration;
12. verified target tree and license disposition;
13. complete Harness-owned schemas for subject lock, toolchain lock, run profile, plan, run manifest, execution record, observation index, Assurance input manifest, run-bundle manifest, replay, conformance, corpus, guidance, and command results;
14. source-provenance rules for imported Assurance schemas and bindings;
15. ADR-001 through ADR-008 covering role, authority path, artifact layout, no competing envelope, fallback isolation, digest scopes, simulation authority, and conditional cross-language support;
16. current asset-disposition matrix;
17. locked Assurance Release-zero artifact inventory and compatibility matrix;
18. captured digest-verified `assurance-plan.json`, plan schema, canonicalization vectors, and embedded protocol-bundle manifest;
19. SDK public-contract and capability-manifest inventory or explicit blocker record;
20. architecture tests proving prohibited dependencies, PacketEnvelope, verdict logic, GitHub publication, mutation, and fallback leakage are absent.

The first pack MUST NOT add an Assurance evaluator, evidence-admission implementation, canonical SDK scanner, GitHub publisher, mutation engine, automatic promotion path, generalized workflow engine, or proprietary cross-repository packet.
