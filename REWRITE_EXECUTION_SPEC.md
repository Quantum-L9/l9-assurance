# L9 Assurance v2 Clean Rewrite Execution Specification

## 0. Specification identity

```yaml
specification:
  id: l9-assurance-v2-clean-rewrite-execution
  title: L9 Assurance v2 Clean Rewrite Execution Specification
  version: 2.0.0
  status: locked
  document_type: architecture_and_execution_contract
  normative_language: RFC_2119
  target_repository: Quantum-L9/l9-assurance
  target_repository_url: https://github.com/Quantum-L9/l9-assurance
  target_branch: rewrite/v2-assurance-plane
  target_release: 2.0.0
  implementation_strategy: clean_rewrite_in_place
  legacy_baseline:
    branch: main
    commit: af79053c5b7f9c0338edf5f1ff7253f429646cf9
    disposition: preserved_as_historical_source_quarry
  canonical_runtime_language: typescript
  canonical_schema_language: json_schema_2020_12
  secondary_binding_language: python
  compatibility_policy: intentional_break
  mutation_authorized_by_this_spec: false
  git_write_authorized_by_this_spec: false
  authority: repository_architecture_contract
  supersedes:
    - broad_l9_assurance_testing_platform_architecture
    - package_preserving_migration_strategy
  derived_from:
    - L9 Assurance Integration Specification 1.0.0-draft
    - package disposition review of the legacy assurance platform
  last_locked: 2026-07-21
```

This specification authorizes a clean architectural rewrite of `Quantum-L9/l9-assurance` in place. It does not authorize a GitHub mutation, branch creation, commit, force-push, package publication, or release by itself. Those actions require a separate explicit execution instruction.

The terms MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, and MAY are normative.

---

## 1. Executive decision

`l9-assurance` SHALL be rebuilt as the Quantum-L9 CI constellation's protocol authority, evidence-admission boundary, deterministic control evaluator, decision issuer, and optional attestation producer.

The current broad platform SHALL NOT be incrementally refactored into the target architecture. The target architecture SHALL be implemented as a clean v2 codebase on a dedicated rewrite branch and merged into the existing repository only after all replacement gates pass.

The rewrite SHALL preserve repository identity while intentionally breaking the legacy runtime API.

The permanent responsibility split SHALL be:

```text
l9-ci-core                  orchestrates hosted CI and publishes decisions
l9-ci-sdk                   executes checks and emits canonical observations
l9-ci-debt-resolver         diagnoses failed controls and selects repair strategy
PR_Repair                   performs governed mutation and emits repair observations
l9-ci-debt-intelligence     learns from historical failures and builds candidate prevention packs
l9-ci-debt-lsp              presents approved prevention rules in editors
l9-assurance                admits evidence, evaluates controls, and issues decisions
```

The permanent invariant SHALL be:

```text
Execution systems observe.
Repair systems mutate.
Intelligence systems learn.
Control-plane systems orchestrate and publish.
Assurance verifies and decides.
```

---

## 2. Rewrite rationale

The legacy repository contains useful trust, evidence, policy, testing, red-team, CI, release, and governance capabilities, but its package topology and runtime ownership are incompatible with the target assurance boundary.

A package-preserving migration would retain or recreate the following defects:

1. assurance-owned check execution;
2. assurance-owned plugin and validator orchestration;
3. aggregate scoring that competes with hard-gate verdict semantics;
4. mixed production and testing trust primitives;
5. GitHub and CI-provider behavior inside the assurance runtime;
6. scanners and test harnesses inside the decision plane;
7. meta-workspaces and compatibility packages with unclear authority;
8. duplicate policy engines across constellation repositories;
9. package identity preservation without architectural justification;
10. dependency paths from assurance back into execution systems.

The rewrite SHALL therefore preserve only verified invariants, algorithms, fixtures, and schema concepts that satisfy the target boundary. Legacy package identities SHALL NOT be considered assets by default.

---

## 3. Mission

For an exact immutable subject, under an exact assurance profile and policy version, `l9-assurance` SHALL determine:

- which evidence is structurally valid;
- which evidence is admissible;
- which producer and check identities are authorized;
- which controls apply;
- which controls pass, fail, are conditional, are indeterminate, or are not applicable;
- which claims are supported;
- which waivers apply;
- which facts remain unknown;
- which final verdict can defensibly be issued.

The result SHALL be:

- deterministic;
- exact-subject-bound;
- producer-attributed;
- policy-versioned;
- replay-verifiable;
- machine-readable;
- human-inspectable;
- immutable after issuance;
- independently verifiable from a complete audit bundle;
- transportable without reconstruction by `l9-ci-core`.

---

## 4. Rewrite outcome

The rewrite SHALL replace the legacy implementation with a deliberately narrow assurance plane.

### 4.1 Release-zero outcome

Release zero SHALL support exactly:

```yaml
release_zero:
  subject_kinds:
    - git-revision
  producers:
    - l9-ci-sdk
  profiles:
    - l9.pull-request@1.0.0
  consumers:
    - l9-ci-core
  authoritative_runtime_language: typescript
  schemas:
    - subject
    - producer
    - check
    - finding
    - observation
    - evidence-envelope
    - evidence-admission
    - claim
    - control
    - control-result
    - profile
    - policy
    - waiver
    - unknown
    - decision
    - audit-bundle-manifest
  controls:
    - repository_metadata_valid
    - transport_packet_valid
    - sdk_validation_passed
    - lint_passed
    - tests_passed
    - mandatory_findings_absent
    - evidence_revision_consistent
  outputs:
    - admission-report.json
    - decision.json
    - decision.summary.md
    - evidence-manifest.json
```

### 4.2 Deferred outcomes

The following SHALL NOT be production dependencies of Release zero:

- repair-mutation assurance profile;
- prevention-pack-publication profile;
- release-candidate profile;
- external audit gateway;
- remote transparency log;
- multi-signer policy;
- privacy transformation engine;
- red-team execution;
- scanner execution;
- MCP execution adapter;
- GitHub check-run publication;
- debt corpus mining;
- LSP operation;
- generic workflow orchestration;
- distributed job scheduling.

Contracts MAY reserve future-compatible extension points, but no deferred capability may widen the Release-zero runtime boundary.

---

## 5. Authority order

When sources conflict, implementation decisions SHALL follow this order:

```yaml
authority_order:
  - latest_explicit_user_instruction
  - this_locked_execution_specification
  - locked_json_schemas
  - locked_registry_records
  - locked_profile_and_policy_definitions
  - accepted_architecture_decision_records
  - verified_target_repository_facts
  - producer_and_consumer_conformance_contracts
  - tests_and_replay_fixtures
  - legacy_repository_implementation
  - legacy_documentation
  - inference
```

Rules:

1. Legacy code SHALL never override this specification.
2. Tests that encode legacy behavior SHALL be rewritten or removed when they conflict with the target architecture.
3. Unknown facts SHALL be recorded as `UNKNOWN`; they SHALL NOT be guessed into contracts.
4. Schemas SHALL be authoritative over handwritten language bindings.
5. Generated bindings SHALL NOT redefine schema meaning.

---

## 6. Scope

### 6.1 In scope

The rewrite SHALL implement:

- canonical assurance schemas;
- TypeScript schema bindings;
- optional generated Python schema bindings;
- canonical JSON serialization;
- digest creation and verification;
- evidence discovery from supplied local paths;
- evidence structural validation;
- producer authorization;
- check authorization;
- exact subject binding;
- freshness evaluation;
- duplicate detection;
- replay detection hooks;
- evidence lineage validation;
- evidence admission reports;
- claim definitions;
- declarative controls;
- profile resolution;
- policy precedence;
- waiver semantics;
- explicit unknown propagation;
- deterministic verdict reduction;
- immutable decision creation;
- canonical JSON decision output;
- Markdown decision projection;
- evidence manifest generation;
- producer conformance suite;
- consumer conformance suite;
- deterministic replay fixtures;
- adversarial protocol tests;
- local CLI;
- pure programmatic API;
- architecture-boundary tests;
- legacy-source provenance records for any ported code.

### 6.2 Out of scope

The rewrite MUST NOT implement:

- source scanning;
- repository enumeration for quality analysis;
- command execution for checks;
- test execution orchestration;
- GitHub webhook interpretation;
- GitHub Actions job topology;
- GitHub check-run publication;
- repair planning;
- patch generation;
- repository mutation;
- repair approval;
- editor diagnostics;
- LSP behavior;
- debt-corpus analysis;
- prevention-rule generation;
- arbitrary plugin execution;
- arbitrary user-supplied code execution;
- network access inside the evaluator;
- mutable global registries;
- a score capable of overriding hard gates.

---

## 7. Clean-rewrite rules

### 7.1 Source-quarry rule

The legacy repository SHALL be treated as a source quarry, not as the new foundation.

A legacy capability MAY be ported only when all of the following are documented:

```yaml
port_record:
  legacy_source_path: string
  legacy_commit: sha40
  extracted_capability: string
  target_package: string
  target_boundary_justification: string
  behavior_preserved: string
  behavior_rejected: string
  security_review: required
  tests_added: []
  reviewer: UNKNOWN_until_assigned
```

### 7.2 No package-preservation rule

No legacy workspace package SHALL survive under its legacy identity merely for compatibility.

Permitted outcomes are:

- algorithm ported into a target v2 package;
- schema concept rewritten under the v2 protocol;
- fixture converted into a v2 conformance fixture;
- documentation preserved under `docs/legacy/`;
- package archived outside the active workspace;
- package deleted from the v2 branch after evidence-backed extraction.

### 7.3 No legacy import rule

Active v2 source code MUST NOT import from:

```text
legacy/
docs/legacy/
archived/
packages/l9-assurance-platform/
packages/l9-testing-platform/
packages/l9-cicd-platform-root/
```

An architecture test SHALL fail on any active import or runtime file reference into legacy paths.

### 7.4 Compatibility rule

```yaml
compatibility:
  semantic_version: 2.0.0
  legacy_runtime_api: unsupported
  legacy_plugin_api: unsupported
  legacy_validator_execution: unsupported
  legacy_score_model: unsupported
  artifact_compatibility: explicit_adapters_only
  migration_facade: prohibited
  deprecation_window_inside_v2: none
```

A legacy artifact adapter MAY exist only as a one-way conversion tool. It MUST NOT make legacy runtime packages dependencies of the v2 evaluator.

### 7.5 Feature-parity rule

Feature parity with the legacy platform SHALL NOT be a rewrite objective.

The target is boundary correctness, not capability count.

---

## 8. Branch, history, and release strategy

### 8.1 Repository identity

The target SHALL remain:

```text
Quantum-L9/l9-assurance
```

No parallel authoritative repository such as `l9-assurance-v2` SHALL be created.

### 8.2 Rewrite branch

The implementation branch SHOULD be:

```text
rewrite/v2-assurance-plane
```

The branch SHALL start from the locked baseline commit unless the execution agent first refreshes and records a newer explicit baseline.

### 8.3 Baseline refresh rule

Before branch creation, the executor MUST:

1. fetch current `main`;
2. record the exact commit SHA;
3. compare it with the locked baseline;
4. classify any delta;
5. stop if the delta introduces unreviewed architecture changes;
6. update the rewrite contract only through explicit approval.

### 8.4 History preservation

The rewrite SHALL preserve legacy history through Git history and optional archived documentation. It SHALL NOT preserve old code in the active package graph merely to retain access.

### 8.5 Merge policy

The rewrite SHALL merge only when:

- all Release-zero gates pass;
- the v2 dependency graph passes boundary tests;
- producer and consumer conformance fixtures pass;
- deterministic replay passes;
- security tests pass;
- legacy imports are zero;
- package count matches the target package graph;
- a rollback tag or branch is created from the pre-merge `main`;
- the final architecture review returns `GO`.

### 8.6 Release policy

The first release SHALL be `2.0.0`.

No `1.x` release may contain the rewrite architecture.

---

## 9. Target repository structure

Release zero SHALL converge on this tree:

```text
l9-assurance/
├── README.md
├── ARCHITECTURE.md
├── SPECIFICATION.md
├── REWRITE_EXECUTION_SPEC.md
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── eslint.config.js
├── .gitignore
├── .npmrc
├── schemas/
│   ├── registry.json
│   └── v1/
│       ├── digest.schema.json
│       ├── subject.schema.json
│       ├── producer.schema.json
│       ├── check.schema.json
│       ├── artifact-reference.schema.json
│       ├── finding.schema.json
│       ├── observation.schema.json
│       ├── evidence-envelope.schema.json
│       ├── evidence-admission.schema.json
│       ├── claim.schema.json
│       ├── control.schema.json
│       ├── control-result.schema.json
│       ├── profile.schema.json
│       ├── policy.schema.json
│       ├── waiver.schema.json
│       ├── unknown.schema.json
│       ├── decision.schema.json
│       └── audit-bundle-manifest.schema.json
├── registry/
│   ├── producers.yaml
│   ├── checks.yaml
│   ├── claims.yaml
│   ├── controls.yaml
│   └── profiles.yaml
├── packages/
│   ├── contracts/
│   ├── evidence/
│   ├── controls/
│   ├── policy/
│   ├── evaluator/
│   ├── conformance/
│   ├── cli/
│   └── testing/
├── profiles/
│   └── pull-request/
│       ├── profile.yaml
│       └── policy.yaml
├── controls/
│   └── ci/
│       ├── repository-metadata.yaml
│       ├── transport-packet.yaml
│       ├── sdk-validation.yaml
│       ├── lint.yaml
│       ├── tests.yaml
│       ├── mandatory-findings.yaml
│       └── evidence-revision-consistency.yaml
├── bindings/
│   ├── typescript/
│   └── python/
├── fixtures/
│   ├── valid/
│   ├── invalid/
│   ├── adversarial/
│   ├── compatibility/
│   └── replay/
├── tests/
│   ├── architecture/
│   ├── unit/
│   ├── contract/
│   ├── conformance/
│   ├── integration/
│   ├── replay/
│   ├── security/
│   └── performance/
├── scripts/
│   ├── generate-bindings.mjs
│   ├── validate-schemas.mjs
│   ├── validate-registries.mjs
│   ├── validate-boundaries.mjs
│   ├── validate-fixtures.mjs
│   └── verify-replay.mjs
└── docs/
    ├── protocol/
    ├── producers/
    ├── profiles/
    ├── decisions/
    ├── migration/
    ├── operations/
    ├── adr/
    └── legacy/
```

### 9.1 Deferred directories

The following SHALL NOT be active production packages in Release zero:

```text
packages/attestations/
packages/audit/
profiles/release-candidate/
profiles/repair-mutation/
profiles/prevention-pack-publication/
controls/repair/
controls/release/
controls/intelligence/
```

The `decision` schema MAY include an optional signature field, but Release zero SHALL support unsigned local decisions and SHALL NOT claim production signing readiness.

---

## 10. Target package graph

Release zero SHALL contain exactly eight active workspaces.

```text
@l9/assurance-contracts
@l9/assurance-evidence
@l9/assurance-controls
@l9/assurance-policy
@l9/assurance-evaluator
@l9/assurance-conformance
@l9/assurance-cli
@l9/assurance-testing
```

### 10.1 Permitted dependency graph

```text
contracts
  ↑
  ├── evidence
  ├── controls
  ├── policy
  ├── evaluator
  ├── conformance
  ├── cli
  └── testing

evidence ───────────────┐
controls ───────────────┤
policy ─────────────────┼──> evaluator
contracts ──────────────┘

evidence + controls + policy + evaluator + contracts ──> cli
contracts + evidence + evaluator ──> conformance
contracts ──> testing
```

### 10.2 Forbidden dependencies

- `contracts` MUST depend on no other workspace.
- `evidence` MUST NOT depend on `evaluator`.
- `controls` MUST NOT depend on `evaluator`.
- `policy` MUST NOT depend on `evaluator`.
- `evaluator` MUST NOT depend on `cli`.
- production packages MUST NOT depend on `testing`.
- no active package may depend on a constellation execution repository implementation package.
- no active package may import GitHub SDKs.
- no active package may execute shell commands.
- no active package may import legacy workspaces.

An automated architecture test SHALL enforce these rules from `package.json` and source imports.

---

## 11. Package specifications

### 11.1 `@l9/assurance-contracts`

Purpose: canonical protocol types, schema identifiers, value objects, and generated bindings.

MUST contain:

- schema-derived TypeScript types;
- schema IDs and versions;
- discriminated unions;
- stable reason-code enums;
- digest type;
- subject type;
- observation type;
- evidence envelope type;
- control and profile types;
- policy and waiver types;
- unknown type;
- decision type;
- audit bundle manifest type.

MUST NOT contain:

- filesystem access;
- clock access;
- network access;
- hashing implementation;
- signature implementation;
- policy evaluation;
- control evaluation;
- CLI code;
- test signers;
- Zod-only semantics not represented in JSON Schema.

Required public exports:

```ts
export type {
  Digest,
  SubjectReference,
  ProducerIdentity,
  CheckIdentity,
  ExecutionDescriptor,
  ArtifactReference,
  Finding,
  Observation,
  EvidenceEnvelope,
  EvidenceAdmissionResult,
  ClaimDefinition,
  ControlDefinition,
  ControlResult,
  AssuranceProfile,
  AssurancePolicy,
  Waiver,
  Unknown,
  AssuranceDecision,
  AuditBundleManifest
};
```

### 11.2 `@l9/assurance-evidence`

Purpose: evidence normalization, integrity validation, authorization, subject binding, lineage, and admission.

MUST implement:

- JSON Schema dispatch;
- structural validation;
- canonical JSON serialization;
- digest calculation;
- digest verification;
- evidence identity derivation;
- producer registry validation;
- producer-version authorization;
- check authorization;
- exact subject comparison;
- execution interval validation;
- freshness evaluation;
- duplicate detection;
- replay-store interface;
- lineage validation;
- size and nesting limits;
- evidence acceptance, rejection, quarantine, and duplicate outcomes;
- machine-readable admission reason codes.

MUST NOT:

- execute producers;
- invoke checks;
- reconstruct findings from logs;
- download remote artifacts;
- infer a producer from path or filename;
- mutate submitted evidence;
- treat quarantined evidence as admissible.

### 11.3 `@l9/assurance-controls`

Purpose: load, validate, resolve, and compose declarative controls.

MUST implement:

- control definition loading;
- control version resolution;
- claim mapping;
- evidence-requirement matching;
- cardinality validation;
- applicability evaluation from a bounded expression model;
- dependency ordering;
- cycle detection;
- supersession rules;
- profile composition validation;
- registered evaluator references for explicitly approved non-declarative cases.

MUST NOT:

- execute commands;
- inspect repositories;
- perform network calls;
- calculate final verdicts;
- authorize waivers;
- import producer implementation packages.

### 11.4 `@l9/assurance-policy`

Purpose: deterministic policy resolution and waiver semantics.

MUST implement:

- profile default policy;
- organization overlay;
- repository overlay;
- branch and release classification input models;
- explicit precedence order;
- conflict detection;
- mandatory and advisory classification;
- unknown handling;
- hard-gate semantics;
- waiver eligibility;
- waiver authorization requirements;
- waiver expiry;
- policy digest generation;
- rollback and minimum-version checks.

Policy resolution MUST be deterministic for equivalent normalized inputs.

### 11.5 `@l9/assurance-evaluator`

Purpose: pure control evaluation and immutable decision issuance.

Required function:

```ts
evaluate(
  subject: SubjectReference,
  profile: ResolvedAssuranceProfile,
  policy: ResolvedAssurancePolicy,
  evidence: readonly AdmittedEvidence[],
  context: EvaluationContext
): AssuranceDecision
```

`EvaluationContext` MUST include:

- explicit evaluation timestamp;
- deterministic decision-ID input or externally supplied ID;
- evaluator identity;
- optional previous-decision reference.

The evaluator MUST NOT:

- access the network;
- read the repository;
- read mutable environment variables;
- use implicit wall-clock time;
- execute a producer;
- perform filesystem writes;
- sign decisions directly;
- mutate input objects;
- depend on insertion order;
- collapse indeterminate into fail;
- allow scores to override hard gates.

### 11.6 `@l9/assurance-conformance`

Purpose: producer, consumer, and protocol compatibility verification.

MUST provide:

- producer fixture runner;
- consumer fixture runner;
- schema compatibility tests;
- canonicalization fixtures;
- malformed evidence fixtures;
- subject mismatch fixtures;
- revision mismatch fixtures;
- stale evidence fixtures;
- unauthorized producer and check fixtures;
- duplicate and replay fixtures;
- unsupported schema fixtures;
- oversized payload fixtures;
- decision transport fixtures;
- unsupported decision schema fixtures.

### 11.7 `@l9/assurance-cli`

Purpose: local protocol tooling and evaluator entrypoint.

MUST expose:

```text
l9-assurance plan
l9-assurance evidence admit
l9-assurance evaluate
l9-assurance verify
l9-assurance conformance producer
l9-assurance conformance consumer
l9-assurance simulate
```

Release zero MAY return `unsupported` for production signature verification and bundling, provided the command behavior is explicit and non-authoritative.

The CLI MUST NOT contain GitHub-provider-specific code.

### 11.8 `@l9/assurance-testing`

Purpose: deterministic testing helpers only.

MAY contain:

- fake clocks;
- deterministic ID factories;
- in-memory registries;
- in-memory replay stores;
- fixture builders;
- test-only signers;
- adversarial object generators.

MUST:

- be marked testing-only;
- carry unmistakable test identities;
- be absent from production dependencies;
- be rejected by production trust-policy fixtures;
- never be exported from default production entrypoints.

---

## 12. Canonical protocol

### 12.1 Schema law

All protocol objects SHALL be defined first in JSON Schema Draft 2020-12.

Rules:

1. Every schema SHALL have a stable `$id`.
2. Every schema SHALL declare a semantic version.
3. Security-sensitive top-level schemas SHALL use `unevaluatedProperties: false` or equivalent strict behavior.
4. Extensibility SHALL occur only through a namespaced `extensions` field.
5. Unknown top-level fields SHALL be rejected unless explicitly allowed.
6. Schema examples SHALL be executable fixtures.
7. Schema changes SHALL pass compatibility classification.
8. Bindings SHALL be regenerated, not manually drifted.
9. Canonical JSON SHALL be defined once and reused for hashing and decision replay.

### 12.2 Digest

```ts
interface Digest {
  algorithm: "sha256";
  value: string;
}
```

Release zero SHALL support SHA-256 only.

Unsupported algorithms SHALL be rejected, not ignored.

### 12.3 Subject

Release zero SHALL support only `git-revision`.

```ts
interface GitRevisionSubject {
  kind: "git-revision";
  repository: {
    host: string;
    owner: string;
    name: string;
  };
  revision: {
    commit: string;
    treeDigest?: Digest;
  };
  metadata?: Record<string, string>;
}
```

Rules:

- commit MUST be a full immutable commit identifier;
- branch name MUST NOT satisfy subject identity;
- tag name MUST NOT satisfy subject identity until resolved to a commit;
- normalized subject MUST be embedded in the decision;
- every revision-bound mandatory evidence item MUST match the decision subject.

### 12.4 Observation

An observation SHALL be a producer-generated statement about an execution or inspection.

Required fields:

- schema and schema version;
- observation ID;
- producer identity;
- exact subject;
- check identity;
- configuration digest;
- execution run ID and attempt;
- execution status;
- start and completion timestamps;
- summary counts;
- findings;
- artifact references;
- optional provenance;
- namespaced extensions.

Observation status SHALL be one of:

```text
passed
failed
error
skipped
```

`error` SHALL not be treated as demonstrated control failure unless policy explicitly defines a corresponding positive violation control.

### 12.5 Evidence envelope

An evidence envelope SHALL bind:

- normalized subject;
- producer identity;
- evidence type;
- observed time;
- issued time;
- payload;
- payload digest;
- source observation identity;
- lineage;
- admission channel;
- optional signature;
- optional redaction descriptor.

Evidence identity SHOULD be content-derived from normalized trust-relevant fields.

### 12.6 Claim

A claim SHALL state a supportable assurance proposition. Claims SHALL NOT directly encode implementation details.

Release-zero claims:

```text
l9.claim.repository-metadata-valid
l9.claim.transport-packet-valid
l9.claim.sdk-validation-satisfied
l9.claim.lint-satisfied
l9.claim.tests-satisfied
l9.claim.mandatory-findings-absent
l9.claim.evidence-revision-consistent
l9.claim.pull-request-controls-satisfied
```

### 12.7 Unknown

Unknowns SHALL be first-class records.

Required categories:

```text
missing-evidence
invalid-evidence
stale-evidence
unsupported-check
unverified-producer
policy-ambiguity
environment-uncertainty
external-dependency
other
```

Unknowns SHALL identify impact and related controls.

### 12.8 Decision

The canonical decision SHALL include:

- schema identity;
- decision ID;
- exact subject;
- profile identity, version, and digest;
- policy identity, version, and digest;
- verdict;
- sorted control results;
- claim results;
- sorted evidence manifest;
- waiver references;
- explicit unknowns;
- optional informational dimensions;
- explicit issuance time;
- evaluator identity;
- optional supersedes reference;
- optional signature.

The decision object SHALL be deep-frozen or otherwise immutable after creation.

---

## 13. Evidence admission contract

### 13.1 Admission sequence

The evidence package SHALL process evidence in this exact order:

1. artifact discovery from explicitly supplied local path;
2. media-type validation;
3. maximum-size validation;
4. schema-version dispatch;
5. structural validation;
6. canonicalization;
7. payload-digest verification;
8. producer-registry lookup;
9. producer-version authorization;
10. check authorization;
11. subject normalization;
12. exact revision comparison;
13. execution-time validation;
14. freshness validation;
15. signature verification when required by policy;
16. lineage verification;
17. duplicate and replay checks;
18. policy admissibility;
19. terminal classification.

### 13.2 Admission outcomes

```text
accepted
rejected
quarantined
duplicate
```

Only `accepted` evidence MAY satisfy controls.

### 13.3 Rejection codes

The implementation MUST include stable reason codes at minimum:

```text
EVIDENCE_MEDIA_TYPE_UNSUPPORTED
EVIDENCE_TOO_LARGE
EVIDENCE_SCHEMA_UNSUPPORTED
EVIDENCE_SCHEMA_INVALID
EVIDENCE_CANONICALIZATION_FAILED
EVIDENCE_PAYLOAD_DIGEST_MISMATCH
EVIDENCE_PRODUCER_UNKNOWN
EVIDENCE_PRODUCER_VERSION_REVOKED
EVIDENCE_CHECK_UNAUTHORIZED
EVIDENCE_SUBJECT_INVALID
EVIDENCE_SUBJECT_MISMATCH
EVIDENCE_REVISION_MISMATCH
EVIDENCE_EXECUTION_INTERVAL_INVALID
EVIDENCE_STALE
EVIDENCE_SIGNATURE_REQUIRED
EVIDENCE_SIGNATURE_INVALID
EVIDENCE_LINEAGE_INVALID
EVIDENCE_REPLAY_DETECTED
EVIDENCE_POLICY_INADMISSIBLE
EVIDENCE_EXTENSION_NAMESPACE_INVALID
EVIDENCE_LIMIT_EXCEEDED
```

### 13.4 Quarantine rule

Quarantine MAY be used when evidence is reviewable but not currently admissible, including:

- known producer pending authorization;
- forward-compatible unsupported schema;
- temporarily unavailable external verification;
- explicit human-review policy.

Quarantine SHALL never silently degrade to acceptance.

### 13.5 Limits

Release zero MUST define and test:

```yaml
admission_limits:
  maximum_single_observation_bytes: 1048576
  maximum_observation_count: 1000
  maximum_findings_per_observation: 10000
  maximum_lineage_depth: 32
  maximum_json_depth: 64
  maximum_string_bytes: 1048576
  maximum_extension_namespaces: 64
```

Any change to these defaults SHALL be policy-versioned or configuration-digest-bound.

---

## 14. Registries

### 14.1 Producer registry

The Release-zero producer registry SHALL authorize only `l9-ci-sdk`.

```yaml
schema_version: 1.0.0
producers:
  - id: l9-ci-sdk
    repository: Quantum-L9/l9-ci-sdk
    allowed_versions: ">=2.0.0 <3.0.0"
    subject_kinds:
      - git-revision
    checks:
      - l9.repository-metadata
      - l9.transport-packet
      - l9.sdk-validation
      - l9.lint
      - l9.tests
      - l9.mandatory-findings
```

The exact minimum trusted SDK version SHALL remain `UNKNOWN` until the producer contract is implemented and versioned. The placeholder range above SHALL NOT be activated as production trust policy without explicit verification.

### 14.2 Check registry

Each check record SHALL define:

- stable ID;
- semantic version;
- owner repository;
- output schema;
- meaning;
- determinism declaration;
- revision-binding declaration;
- accepted execution statuses;
- configuration-digest requirement;
- superseded versions;
- revoked versions.

Behaviorally incompatible changes MUST increment the check major version.

### 14.3 Registry governance

Registry changes SHALL be treated as trust-boundary changes.

The following require architecture and security review:

- new producer;
- producer version range expansion;
- check authorization expansion;
- signer authorization;
- revoked-version removal;
- subject-kind expansion;
- evidence freshness relaxation.

---

## 15. Controls and profile

### 15.1 Declarative controls

Release-zero controls SHALL be declarative and data-driven.

The supported evaluation types SHALL initially be limited to:

```text
all-requirements-satisfied
no-matching-findings
exact-subject-consistency
```

No arbitrary script evaluator SHALL be supported.

### 15.2 Release-zero controls

#### `L9.CI.REPOSITORY_METADATA`

Requires one accepted `l9.repository-metadata` observation for the exact revision with `passed` status.

#### `L9.CI.TRANSPORT_PACKET`

Requires one accepted `l9.transport-packet` observation for the exact revision with `passed` status.

#### `L9.CI.SDK_VALIDATION`

Requires one accepted `l9.sdk-validation` observation for the exact revision with `passed` status.

#### `L9.CI.LINT`

Requires one accepted `l9.lint` observation for the exact revision with `passed` status.

#### `L9.CI.TESTS`

Requires one accepted `l9.tests` observation for the exact revision with `passed` status.

#### `L9.CI.MANDATORY_FINDINGS_ABSENT`

Requires accepted findings evidence showing no open finding whose mapped policy severity is mandatory-blocking.

#### `L9.CI.EVIDENCE_REVISION_CONSISTENCY`

Requires all mandatory admitted evidence to reference the exact decision subject revision.

### 15.3 Pull-request profile

```yaml
id: l9.pull-request
version: 1.0.0
subject_kinds:
  - git-revision
controls:
  - L9.CI.REPOSITORY_METADATA@1.0.0
  - L9.CI.TRANSPORT_PACKET@1.0.0
  - L9.CI.SDK_VALIDATION@1.0.0
  - L9.CI.LINT@1.0.0
  - L9.CI.TESTS@1.0.0
  - L9.CI.MANDATORY_FINDINGS_ABSENT@1.0.0
  - L9.CI.EVIDENCE_REVISION_CONSISTENCY@1.0.0
default_policy: l9.organization-default@1.0.0
output_claims:
  - l9.claim.pull-request-controls-satisfied@1.0.0
```

---

## 16. Verdict semantics

### 16.1 Pass

A decision SHALL be `pass` only when:

- every applicable mandatory control passes;
- every mandatory evidence requirement is satisfied;
- all mandatory evidence is accepted;
- exact subject binding holds;
- no decision-impacting unknown exists;
- no active waiver requires conditional semantics;
- policy permits pass.

### 16.2 Fail

A decision SHALL be `fail` only when:

- accepted evidence positively demonstrates failure of an applicable mandatory control; or
- a policy-defined hard prohibition is positively triggered.

Failure requires positive evidence of violation.

### 16.3 Indeterminate

A decision SHALL be `indeterminate` when assurance cannot establish the mandatory claim, including:

- missing mandatory evidence;
- malformed mandatory evidence;
- stale mandatory evidence;
- unauthorized producer;
- unauthorized check;
- revision mismatch;
- required signature verification failure;
- policy resolution failure;
- incomplete mandatory control evaluation;
- infrastructure inability to establish the result.

`indeterminate` MUST NOT be collapsed into `fail`.

### 16.4 Conditional

A decision SHALL be `conditional` when:

- mandatory controls otherwise pass;
- an approved active waiver applies;
- policy permits constrained issuance;
- limitations are declared in the decision.

### 16.5 Verdict reduction order

```text
positive mandatory failure     -> fail
unresolved mandatory unknown   -> indeterminate
approved conditional waiver    -> conditional
all mandatory controls pass    -> pass
```

Policy-defined hard prohibitions SHALL be evaluated before normal reduction.

### 16.6 Scores

Informational dimensions MAY be reported, including evidence completeness or freshness, but they:

- MUST NOT determine the authoritative verdict;
- MUST NOT override a mandatory failure;
- MUST NOT convert indeterminate into pass;
- MUST be derivable from canonical decision inputs.

---

## 17. Determinism and immutability

### 17.1 Pure evaluator

The evaluator SHALL behave as a pure deterministic function over normalized inputs and explicit context.

### 17.2 Required determinism controls

- explicit evaluation timestamp;
- externally supplied or deterministically derived decision ID;
- stable profile resolution;
- stable policy resolution;
- sorted evidence references;
- sorted control results;
- sorted claims;
- sorted reason codes;
- canonical JSON serialization;
- no locale-dependent formatting;
- no implicit filesystem order;
- no random UUID generation inside evaluation;
- no nondeterministic map or set iteration;
- no ambient environment reads;
- immutable output.

### 17.3 Canonical output

Equivalent normalized inputs and equivalent explicit context MUST produce byte-equivalent canonical decision JSON.

Markdown output SHALL be generated from canonical decision JSON and SHALL NOT be an independent source of truth.

### 17.4 Replay

Each locked replay fixture SHALL contain:

```text
subject.json
profile.yaml
policy.yaml
accepted-evidence/
expected-decision.canonical.json
expected-summary.md
```

Replay mismatch rate SHALL be zero.

---

## 18. Security contract

### 18.1 Threat model

The rewrite SHALL explicitly test:

- forged observation;
- tampered payload;
- digest mismatch;
- revision substitution;
- repository identity substitution;
- replayed evidence;
- stale evidence;
- unauthorized producer;
- revoked producer version;
- unauthorized check;
- malicious extension namespace;
- excessive nesting;
- oversized findings set;
- path traversal during artifact discovery;
- archive bomb if archive support is later introduced;
- canonicalization ambiguity;
- malformed Unicode;
- signature stripping;
- algorithm downgrade;
- waiver forgery;
- waiver expiry bypass;
- policy rollback;
- profile substitution;
- selective omission of failed evidence;
- malicious Markdown content;
- test signer use in production.

### 18.2 Release-zero cryptography

Release zero MUST:

- use SHA-256 digests;
- include algorithm identifiers;
- canonicalize digest preimages;
- reject unsupported algorithms;
- reserve signature fields without claiming production signing readiness;
- isolate test signers;
- include a production-policy fixture that rejects all test identities.

### 18.3 Test signer isolation

Any legacy test signer SHALL be rewritten into `@l9/assurance-testing` or discarded.

Production entrypoints SHALL NOT export test signers.

An architecture test SHALL scan exports and dependencies for prohibited test signer reachability.

### 18.4 Input handling

- all file paths MUST remain under explicitly supplied evidence roots;
- symbolic-link traversal MUST be rejected or safely contained;
- JSON parser limits MUST be enforced;
- Markdown rendering MUST escape untrusted content;
- evidence payloads MUST NOT be logged by default;
- errors MUST contain stable reason codes without leaking secrets.

---

## 19. CLI contract

### 19.1 Stable commands

#### Plan

```bash
l9-assurance plan \
  --profile l9.pull-request@1.0.0 \
  --subject subject.json \
  --output artifacts/assurance-plan.json
```

Outputs applicable controls, required producers, required checks, waiver rules, and expected evidence.

#### Admit

```bash
l9-assurance evidence admit \
  --subject subject.json \
  --input artifacts/observations \
  --output artifacts/admission
```

#### Evaluate

```bash
l9-assurance evaluate \
  --subject subject.json \
  --profile l9.pull-request@1.0.0 \
  --policy l9.organization-default@1.0.0 \
  --evidence artifacts/admission/accepted \
  --evaluation-time 2026-07-21T00:00:00Z \
  --output artifacts/assurance
```

#### Verify

```bash
l9-assurance verify \
  --decision decision.json
```

Release zero verification SHALL validate canonical structure, digests, profile/policy references, and optional signatures when a verifier is explicitly supplied.

#### Conformance

```bash
l9-assurance conformance producer \
  --producer l9-ci-sdk \
  --input fixtures/sdk-output

l9-assurance conformance consumer \
  --consumer l9-ci-core \
  --fixture fixtures/decisions
```

#### Simulate

```bash
l9-assurance simulate \
  --profile l9.pull-request@1.0.0 \
  --policy proposed-policy.yaml \
  --evidence historical-bundle/
```

Simulation output MUST be marked non-authoritative.

### 19.2 Exit codes

```text
0   decision issued: pass
10  decision issued: conditional
20  decision issued: fail
30  decision issued: indeterminate
40  input or schema error
41  profile or policy resolution error
42  evidence admission system error
43  signature verification system error
50  internal invariant violation
```

Exit codes SHALL be tested as public contract behavior.

---

## 20. Programmatic API

```ts
interface AssuranceEngine {
  plan(request: PlanRequest): Promise<AssurancePlan>;
  admit(request: AdmissionRequest): Promise<AdmissionReport>;
  evaluate(request: EvaluationRequest): Promise<AssuranceDecision>;
  verify(request: VerificationRequest): Promise<VerificationReport>;
}
```

Dependency injection SHALL support:

- explicit clock;
- producer registry;
- check registry;
- profile registry;
- policy registry;
- replay store;
- optional verifier;
- telemetry sink;
- deterministic ID provider.

The default engine SHALL remain offline and local-first.

---

## 21. CI integration contract

### 21.1 Canonical flow

```text
pull request event
  -> l9-ci-core resolves workflow inputs
  -> l9-ci-core provisions pinned l9-ci-sdk
  -> l9-ci-sdk executes checks
  -> l9-ci-sdk emits canonical observations
  -> l9-ci-core transports observations unchanged
  -> l9-assurance admits observations
  -> l9-assurance evaluates l9.pull-request@1.0.0
  -> l9-assurance emits immutable decision artifacts
  -> l9-ci-core publishes the decision without reinterpretation
```

### 21.2 Artifact contract

```text
artifacts/
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
└── assurance/
    ├── admission-report.json
    ├── decision.json
    ├── decision.summary.md
    └── evidence-manifest.json
```

Assurance SHALL not require supporting logs unless a future control explicitly declares content validation.

### 21.3 Consumer invariant

`l9-ci-core` SHALL transport and publish the decision. It SHALL NOT:

- reconstruct findings;
- alter control status;
- calculate verdicts;
- replace indeterminate with fail;
- regenerate decision IDs;
- rewrite the decision artifact;
- publish a summary that contradicts the canonical JSON.

---

## 22. Conformance contract

### 22.1 Producer conformance

`l9-ci-sdk` MUST pass fixtures for:

- valid observation;
- invalid schema;
- missing subject;
- repository mismatch;
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
- configuration digest absence.

### 22.2 Consumer conformance

`l9-ci-core` MUST prove that it:

- transports decisions byte-for-byte;
- preserves decision digest;
- publishes verdict accurately;
- displays mandatory failures;
- displays indeterminate reasons;
- displays active waivers;
- does not reinterpret control status;
- rejects unsupported decision schemas safely;
- escapes untrusted summary content.

### 22.3 Cross-language conformance

If Python bindings are generated, TypeScript and Python MUST:

- parse the same valid fixtures;
- reject the same invalid fixtures;
- emit equivalent normalized objects;
- produce the same canonical JSON;
- produce the same digest preimage;
- preserve extension namespaces.

---

## 23. Testing strategy

### 23.1 Architecture tests

Required tests:

- exact workspace count;
- permitted dependency graph;
- forbidden dependencies absent;
- no legacy imports;
- no GitHub SDK imports;
- no shell execution imports;
- production packages do not depend on testing;
- evaluator has no filesystem, network, environment, or clock access;
- test signers unreachable from production exports;
- schema files are canonical authority.

### 23.2 Unit tests

Cover:

- canonical JSON;
- SHA-256 digest formatting;
- subject normalization;
- timestamp parsing;
- freshness logic;
- evidence identity;
- duplicate detection;
- replay hooks;
- control matching;
- cardinality;
- dependency ordering;
- cycle detection;
- policy precedence;
- waiver eligibility;
- waiver expiry;
- unknown propagation;
- verdict reduction;
- stable reason ordering.

### 23.3 Contract tests

Cover all public exports, CLI exit codes, schema examples, and error codes.

### 23.4 Integration tests

Required Release-zero integrations:

1. SDK observation fixture to accepted evidence;
2. accepted evidence to pass decision;
3. positive failure observation to fail decision;
4. missing test observation to indeterminate decision;
5. revision-mismatched evidence to rejection and indeterminate decision;
6. active waiver to conditional decision;
7. decision JSON to Markdown projection;
8. decision artifact to CI-core consumer fixture.

### 23.5 Replay tests

Known inputs SHALL produce byte-identical canonical outputs across repeated runs.

### 23.6 Adversarial tests

Must include:

- revision substitution;
- changed payload with preserved digest;
- duplicate evidence with changed IDs;
- canonicalization confusion;
- deeply nested objects;
- malformed Unicode;
- path traversal;
- symlink escape;
- waiver clock manipulation;
- reordered evidence;
- profile digest mismatch;
- policy rollback;
- omitted failed observation;
- malicious Markdown;
- fake production signer using test algorithm.

### 23.7 Property-based tests

Properties:

- evidence order does not affect decision;
- control declaration order does not affect decision;
- duplicate evidence does not improve verdict;
- irrelevant advisory evidence does not change mandatory status;
- subject revision change invalidates revision-bound evidence;
- expired waiver never improves verdict;
- failed mandatory control prevents pass;
- missing mandatory evidence never produces fail by default;
- canonicalization is idempotent;
- decision serialization is stable.

### 23.8 Performance tests

Initial objectives:

| Operation | Target |
|---|---:|
| Validate one observation under 1 MB | p95 under 100 ms |
| Admit 1,000 observations | p95 under 5 seconds |
| Evaluate 500 controls | p95 under 2 seconds |
| Generate decision summary | p95 under 500 ms |
| Memory for 1,000 observations | under 512 MB |
| Replay mismatch | 0 |

Performance misses SHALL block production promotion only when they exceed an explicitly approved threshold. Correctness and determinism SHALL dominate micro-optimization.

---

## 24. Required root commands

The rewritten root package SHALL expose:

```json
{
  "scripts": {
    "clean": "...",
    "format": "...",
    "format:check": "...",
    "lint": "...",
    "typecheck": "...",
    "build": "...",
    "test": "...",
    "test:unit": "...",
    "test:contract": "...",
    "test:architecture": "...",
    "test:conformance": "...",
    "test:integration": "...",
    "test:replay": "...",
    "test:security": "...",
    "test:performance": "...",
    "validate:schemas": "...",
    "validate:registries": "...",
    "validate:boundaries": "...",
    "validate:fixtures": "...",
    "generate:bindings": "...",
    "check:generated": "...",
    "validate": "...",
    "ci": "..."
  }
}
```

The exact tools MAY be selected during bootstrap, but command semantics and required coverage are locked.

The `ci` command SHALL run all merge-blocking checks and SHALL not stop after the first independently runnable lint or test family when a complete diagnostic sweep can safely continue.

A CI aggregator SHOULD collect failures and exit non-zero after all independent checks complete.

---

## 25. Implementation phases

## Phase 0: Rewrite preflight and branch lock

### Objective

Create a verified rewrite workspace without changing architectural scope.

### Deliverables

- current `main` commit recorded;
- baseline comparison report;
- rewrite branch created only under explicit authorization;
- legacy package inventory captured;
- public export inventory captured;
- downstream consumer unknown register created;
- this specification added as `REWRITE_EXECUTION_SPEC.md`;
- architecture decision records initialized;
- legacy source marked read-only.

### Validation

- baseline SHA is exact;
- repository status is clean;
- no unreviewed commits exist between locked and actual baseline;
- no generated artifacts are mistaken for source;
- package inventory count is reproducible.

### Exit gate

```yaml
phase_0_exit:
  baseline_verified: true
  source_inventory_complete: true
  consumer_inventory_status: complete_or_explicit_unknown
  rewrite_scope_locked: true
  architecture_review: GO
```

### Stop conditions

Stop if:

- target repository is not `Quantum-L9/l9-assurance`;
- `main` includes unreviewed architecture changes;
- rewrite branch cannot be created from an exact baseline;
- uncommitted changes would be overwritten;
- the executor lacks explicit mutation authorization.

---

## Phase 1: Repository skeleton and boundary enforcement

### Objective

Build the empty v2 chassis with enforceable package boundaries.

### Deliverables

- root manifests;
- eight workspace skeletons;
- TypeScript strict configuration;
- formatting and linting;
- test runner;
- architecture test harness;
- dependency graph validator;
- no-legacy-import validator;
- generated-file drift check;
- empty docs and ADR structure;
- legacy docs preserved outside active workspace.

### Required tests

- workspace names exact;
- dependency graph exact;
- forbidden imports fail fixtures;
- testing dependency leakage fails fixtures;
- evaluator I/O import fails fixtures;
- GitHub SDK import fails fixtures.

### Exit gate

All skeleton packages build and boundary tests pass before domain implementation begins.

### Stop conditions

Stop if any target package requires a dependency on a legacy workspace or execution repository implementation.

---

## Phase 2: Canonical schemas and generated bindings

### Objective

Establish protocol authority before runtime behavior.

### Deliverables

- all Release-zero JSON Schemas;
- schema registry;
- valid, invalid, and adversarial examples;
- TypeScript generated bindings;
- Python generated bindings or explicit deferral record;
- schema compatibility classifier;
- canonical JSON definition;
- binding drift checks.

### Required tests

- every example validates or fails as declared;
- unknown top-level fields fail where required;
- binding generation is deterministic;
- generated files are clean after regeneration;
- TypeScript round-trip passes;
- Python round-trip passes if bindings are enabled;
- cross-language canonical JSON matches.

### Exit gate

No runtime package may define duplicate handwritten protocol models.

### Stop conditions

Stop if schema semantics cannot be represented consistently across the canonical and generated bindings.

---

## Phase 3: Registries and producer conformance

### Objective

Lock producer and check identity before accepting evidence.

### Deliverables

- producer registry schema and records;
- check registry schema and records;
- registry loaders;
- semantic-version authorization;
- revocation model;
- registry digest;
- producer conformance suite;
- `l9-ci-sdk` fixture pack.

### Exit gate

The SDK fixture set passes all positive and negative conformance cases.

### Stop conditions

Stop if check ownership or check semantics remain ambiguous.

---

## Phase 4: Evidence admission

### Objective

Implement the trust boundary from raw artifact to accepted evidence.

### Deliverables

- local artifact discovery;
- schema dispatch;
- canonicalization;
- digest verification;
- producer and check authorization;
- exact subject binding;
- freshness evaluation;
- lineage validation;
- duplicate detection;
- replay-store interface;
- quarantine semantics;
- admission report;
- size and depth limits.

### Required adversarial tests

- digest mismatch;
- producer spoof;
- revision substitution;
- replay;
- stale evidence;
- malformed Unicode;
- path traversal;
- symlink escape;
- excessive nesting;
- oversized findings.

### Exit gate

No unadmitted payload may enter control evaluation.

### Stop conditions

Stop if any control path bypasses the admission result.

---

## Phase 5: Controls, profiles, policy, and waivers

### Objective

Implement declarative control and policy resolution without verdict issuance.

### Deliverables

- seven Release-zero controls;
- pull-request profile;
- default policy;
- bounded applicability model;
- evidence-requirement matching;
- dependency resolution;
- cycle detection;
- policy precedence;
- policy conflict detection;
- waiver model;
- waiver expiry;
- explicit unknown creation.

### Exit gate

For a fixed subject and evidence set, resolved controls and policy are deterministic and digest-bound.

### Stop conditions

Stop if arbitrary code execution is required to express a Release-zero control.

---

## Phase 6: Pure evaluator and decision projection

### Objective

Issue deterministic immutable decisions.

### Deliverables

- pure evaluator;
- control result generation;
- claim result generation;
- verdict reduction;
- evidence manifest;
- decision ID strategy;
- canonical JSON decision;
- Markdown summary projection;
- deep immutability;
- replay fixtures.

### Required golden cases

- complete pass;
- demonstrated mandatory fail;
- missing mandatory evidence indeterminate;
- invalid evidence indeterminate;
- active waiver conditional;
- revision mismatch indeterminate;
- advisory failure without mandatory failure;
- policy hard prohibition fail.

### Exit gate

Repeated evaluation of equivalent normalized input produces byte-identical canonical decision JSON.

### Stop conditions

Stop if wall-clock time, filesystem order, random ID generation, or environment state affects canonical output.

---

## Phase 7: CLI and programmatic API

### Objective

Expose the protocol without provider coupling.

### Deliverables

- plan command;
- admit command;
- evaluate command;
- verify command;
- conformance commands;
- simulate command;
- stable exit codes;
- structured errors;
- machine-readable output;
- programmatic engine API.

### Exit gate

CLI outputs equal API outputs for the same normalized inputs.

### Stop conditions

Stop if the CLI begins interpreting GitHub events or running checks.

---

## Phase 8: End-to-end vertical slice

### Objective

Prove SDK observation to assurance decision to CI-core transport.

### Deliverables

- SDK observation fixture set;
- admission integration;
- pull-request evaluation integration;
- CI-core consumer fixture;
- decision publication contract;
- byte-preservation test;
- summary-accuracy test;
- unsupported-schema handling.

### Exit gate

```text
l9-ci-sdk fixture
  -> admitted evidence
  -> l9.pull-request decision
  -> unchanged CI-core consumer artifact
```

passes for pass, fail, conditional, and indeterminate cases.

### Stop conditions

Stop if `l9-ci-core` must reconstruct or reinterpret the decision.

---

## Phase 9: Shadow mode readiness

### Objective

Prepare non-authoritative real-CI comparison.

### Deliverables

- shadow-mode workflow contract;
- mismatch report schema;
- missing-evidence metrics;
- invalid-evidence metrics;
- unknown-frequency metrics;
- publication discrepancy checks;
- rollback switch design;
- operator runbook;
- external CI validation plan.

### Exit gate

The rewrite is ready for a separate authorized integration PR into `l9-ci-core` and `l9-ci-sdk`.

### Stop conditions

Stop before making assurance authoritative. Authority promotion requires measured shadow-mode evidence and a separate approval.

---

## 26. Commit and pull-request decomposition

The rewrite SHOULD be delivered through small architecture-complete PRs rather than one opaque replacement.

Recommended sequence:

1. `rewrite: establish v2 skeleton and boundary tests`
2. `feat(contracts): add canonical assurance schemas and bindings`
3. `feat(conformance): add producer and schema fixtures`
4. `feat(evidence): implement deterministic evidence admission`
5. `feat(controls): add release-zero controls and profile`
6. `feat(policy): add precedence, waivers, and unknown handling`
7. `feat(evaluator): issue deterministic assurance decisions`
8. `feat(cli): expose plan, admit, evaluate, verify, and simulate`
9. `test(integration): prove sdk-to-assurance-to-ci-core vertical slice`
10. `docs: finalize operations, migration, and v2 release contract`

Each PR MUST:

- have one dominant architectural purpose;
- include tests for every public behavior;
- update schemas and fixtures together;
- update generated bindings when schemas change;
- preserve a green architecture test;
- include no unrelated legacy cleanup;
- include a migration or provenance note for ported logic;
- declare unknowns;
- avoid TODO, FIXME, placeholder, or stub behavior in merged source.

---

## 27. Documentation requirements

### README

MUST explain:

- what assurance owns;
- what assurance does not own;
- the Release-zero flow;
- local CLI quick start;
- artifact inputs and outputs;
- package map;
- current maturity and trust level.

### ARCHITECTURE

MUST document:

- boundaries;
- dependency graph;
- state ownership;
- pure evaluator;
- evidence admission sequence;
- decision flow;
- extension points;
- prohibited dependencies.

### SPECIFICATION

MUST contain the canonical protocol and normative semantics without implementation-phase details.

### SECURITY

MUST contain:

- threat model;
- trust policy;
- cryptographic status;
- input limits;
- test signer isolation;
- disclosure process;
- incident handling.

### CONTRIBUTING

MUST define:

- schema-first changes;
- generated binding workflow;
- architecture tests;
- registry review requirements;
- control and profile versioning;
- fixture requirements;
- no-legacy-import rule.

### CHANGELOG

MUST declare `2.0.0` as an intentional architecture and API break.

---

## 28. Legacy disposition during rewrite

### 28.1 Active workspace policy

The v2 branch SHALL contain only the eight Release-zero workspaces.

### 28.2 Legacy preservation

Useful legacy material MAY be preserved under:

```text
docs/legacy/v1-platform/
docs/migration/legacy-package-disposition/
```

Source snapshots SHOULD NOT be copied into the active tree when Git history already preserves them.

### 28.3 Extraction ledger

Every ported capability SHALL be recorded in:

```text
docs/migration/LEGACY_EXTRACTION_LEDGER.yaml
```

The ledger SHALL include source commit, source path, target path, retained behavior, rejected behavior, and validation evidence.

### 28.4 Delete threshold

Legacy active source may be removed from the rewrite branch when:

- inventory exists;
- required invariants are extracted;
- extraction ledger is complete;
- replacement tests pass;
- downstream imports are searched;
- unknown consumers are recorded;
- architecture review approves removal.

---

## 29. Operational telemetry

Runtime telemetry SHALL remain separate from assurance evidence.

Recommended metrics:

```text
assurance_evaluations_total
assurance_decisions_total{verdict}
assurance_evaluation_duration_seconds
assurance_evidence_received_total
assurance_evidence_accepted_total
assurance_evidence_rejected_total{reason}
assurance_evidence_quarantined_total{reason}
assurance_controls_total{status}
assurance_unknowns_total{category}
assurance_waivers_total{status}
assurance_replay_detected_total
```

Release zero MAY expose a telemetry interface without shipping a production exporter.

Logs SHOULD include correlation ID, run ID, decision ID, subject digest, profile ID, policy version, and reason codes.

Logs MUST NOT include unrestricted payloads, secrets, or raw sensitive findings by default.

---

## 30. Failure semantics

### 30.1 Operational fail-closed

Security-sensitive runtime errors SHOULD block authoritative publication.

### 30.2 Semantic precision

The decision SHALL distinguish:

- positive violation evidence: `fail`;
- inability to establish a mandatory claim: `indeterminate`.

### 30.3 Partial evidence

The evaluator SHALL:

- evaluate controls with complete evidence;
- mark dependent controls indeterminate when required evidence is unavailable;
- preserve partial control results;
- never synthesize missing evidence.

### 30.4 Internal invariant violation

Internal invariant failures SHALL:

- emit exit code 50;
- produce no authoritative decision;
- preserve diagnostic context without leaking evidence payloads;
- require operator review.

---

## 31. Versioning

### 31.1 Schema versioning

- Patch: non-semantic correction.
- Minor: backward-compatible optional field or extension.
- Major: incompatible structure or meaning.

### 31.2 Control versioning

Control version MUST change when:

- evidence requirements change;
- applicability changes;
- mandatory/advisory severity changes;
- evaluation semantics change;
- waiver policy changes;
- freshness requirements change.

### 31.3 Profile versioning

Profile version MUST change when the control set, output claims, default policy, or compatibility requirements change.

### 31.4 Registry versioning

Registry changes SHALL produce a new registry digest. Trust expansion SHALL receive architecture and security review.

### 31.5 Decision compatibility

Consumers SHALL fail safely on unsupported decision major versions.

---

## 32. Release-zero acceptance criteria

The rewrite SHALL be considered technically complete only when all criteria pass:

1. exactly eight active workspace packages exist;
2. all active packages conform to the permitted dependency graph;
3. no active source imports legacy packages;
4. canonical schemas exist and validate all fixtures;
5. generated bindings are deterministic and drift-free;
6. `l9-ci-sdk` producer fixtures pass conformance;
7. evidence admission rejects malformed, unauthorized, stale, replayed, and revision-mismatched evidence;
8. only accepted evidence can satisfy controls;
9. all seven pull-request controls are declarative;
10. profile and policy resolution are deterministic;
11. missing mandatory evidence produces `indeterminate`;
12. demonstrated mandatory violation produces `fail`;
13. approved active waiver produces `conditional` when policy permits;
14. complete valid mandatory evidence produces `pass`;
15. hard-gate failures cannot be overridden by scores;
16. evaluator uses explicit time and deterministic ID inputs;
17. replay produces byte-identical canonical decisions;
18. Markdown summary is a projection of canonical JSON;
19. test signers are unreachable from production exports;
20. production trust fixtures reject test identities;
21. CLI exit codes match the contract;
22. API and CLI produce equivalent outputs;
23. CI-core consumer fixtures preserve decisions byte-for-byte;
24. unsupported schema versions fail safely;
25. architecture, unit, contract, conformance, integration, replay, and security suites pass;
26. performance objectives are measured and recorded;
27. legacy extraction ledger is complete for any ported code;
28. documentation reflects the implemented boundary;
29. no TODO, FIXME, stub, placeholder, or fake validation claim remains in merged source;
30. final architecture review returns `GO`.

---

## 33. Non-acceptance conditions

The rewrite SHALL NOT be declared complete if any of the following are true:

- assurance still runs scanners or tests;
- assurance still discovers arbitrary execution plugins;
- the evaluator reads files or network state;
- aggregate score can produce pass despite a failed mandatory control;
- missing evidence is reported as demonstrated failure;
- evidence for commit A can satisfy commit B;
- test signing identities are production-reachable;
- CI Core must reinterpret the decision;
- legacy workspace dependencies remain;
- active package count exceeds the locked target without approved spec amendment;
- Python and TypeScript bindings disagree;
- replay output is nondeterministic;
- registry trust expansion is unreviewed;
- authoritative CI promotion occurs without shadow-mode evidence.

---

## 34. Rollback and recovery

### 34.1 Pre-merge rollback

The rewrite branch may be abandoned without changing `main`.

### 34.2 Merge rollback

Before merging v2, create an immutable rollback reference to the final v1 commit.

Recommended tag:

```text
v1-platform-final
```

### 34.3 Runtime rollback

During shadow and authority promotion, CI Core SHALL retain a documented switch to disable v2 authority and restore the previous gate path.

Rollback SHALL not alter or delete issued v2 decisions.

### 34.4 Data preservation

Admission reports, decisions, mismatch reports, and replay evidence SHALL be preserved for retrospective analysis.

---

## 35. Required runbooks

Before authoritative promotion, documentation MUST cover:

1. unsupported schema version;
2. producer version revoked;
3. evidence artifact missing;
4. subject mismatch;
5. decision replay mismatch;
6. policy registry corruption;
7. profile rollback;
8. waiver compromise;
9. test signer exposure;
10. CI-core publication discrepancy;
11. evidence-store corruption;
12. excessive replay detections;
13. shadow-mode verdict mismatch;
14. emergency authority disablement.

Each runbook SHALL define detection, containment, user-visible behavior, decision semantics, recovery, and evidence preservation.

---

## 36. Governance

### 36.1 Ownership

```yaml
ownership:
  protocol_schemas: assurance_maintainers
  evidence_admission: assurance_maintainers_and_security
  producer_contracts: assurance_and_producer_owner
  check_semantics: l9_ci_sdk_maintainers
  controls_and_profiles: assurance_and_governance
  policy_and_waivers: governance_and_security
  evaluator: assurance_maintainers
  ci_transport_and_publication: l9_ci_core_maintainers
  conformance_fixtures: joint_ownership
```

### 36.2 Mandatory review

Architecture and security review are required for:

- schema major version;
- new producer;
- new signer;
- trust-range expansion;
- mandatory-to-advisory change;
- control removal;
- profile weakening;
- waiver relaxation;
- freshness relaxation;
- unknown-to-pass rule;
- evaluator I/O capability;
- arbitrary evaluator registration;
- Release-zero package count change.

### 36.3 Specification amendment

Changes to locked requirements SHALL use an amendment record containing:

```yaml
amendment:
  id: string
  specification_version: string
  proposed_change: string
  rationale: string
  security_impact: string
  compatibility_impact: string
  alternatives_considered: []
  approvals: []
  effective_version: string
```

Silent scope drift is prohibited.

---

## 37. Unknown register

The following remain explicitly unknown until implementation evidence exists:

```yaml
unknowns:
  - id: UNKNOWN-001
    topic: minimum_trusted_l9_ci_sdk_version
    impact: producer_registry_activation
    resolution: implement_and_version_sdk_observation_contract
  - id: UNKNOWN-002
    topic: downstream_consumers_of_legacy_workspace_packages
    impact: legacy_source_removal_risk
    resolution: organization_wide_code_and_manifest_search
  - id: UNKNOWN-003
    topic: exact_python_binding_generator
    impact: cross_language_workflow
    resolution: evaluate_generators_against_schema_fidelity_and_determinism
  - id: UNKNOWN-004
    topic: production_signing_provider
    impact: signed_release_decisions
    resolution: deferred_beyond_release_zero
  - id: UNKNOWN-005
    topic: authoritative_shadow_mode_duration_and_mismatch_threshold
    impact: authority_promotion
    resolution: governance_approval_after_real_ci_measurement
  - id: UNKNOWN-006
    topic: package_registry_and_publication_model
    impact: downstream_installation
    resolution: define_after_vertical_slice_stability
```

Unknowns SHALL not block Release-zero implementation unless they affect a current phase exit gate.

---

## 38. Execution protocol for implementation agents

Any implementation agent operating under this specification SHALL:

1. inspect the exact current repository state;
2. confirm the target branch and baseline;
3. read this specification before modifying files;
4. preserve scope boundaries;
5. implement only the current authorized phase;
6. avoid hidden compatibility layers;
7. avoid speculative future features;
8. record every ported legacy capability;
9. add or update tests with each behavior change;
10. run the complete required validation set;
11. report commands actually executed;
12. distinguish pass, fail, partial, skipped, and unknown;
13. stop on a locked invariant violation;
14. never claim GitHub or external CI success without evidence;
15. never commit, push, open a PR, publish, or release without explicit authorization.

### 38.1 Required phase report

```yaml
phase_report:
  phase: string
  baseline_commit: sha40
  files_added: []
  files_modified: []
  files_deleted: []
  legacy_capabilities_ported: []
  validations_run: []
  validation_results: []
  architecture_invariants_checked: []
  unknowns_added: []
  blockers: []
  exit_gate_status: pass | fail | partial
  next_authorized_phase: string | none
```

### 38.2 Stop conditions

The implementation agent MUST stop and report rather than improvise when:

- a required authority is ambiguous;
- a target package would violate dependency direction;
- a legacy API appears necessary for compatibility;
- a schema cannot express the intended semantics;
- exact subject binding cannot be proven;
- a required test would need fabricated fixtures;
- a production signer is required before being selected;
- validation commands fail and the failure cannot be repaired within authorized scope;
- repository mutation exceeds the explicitly authorized phase.

---

## 39. Release decision

The final rewrite review SHALL issue one of:

```text
GO
GO_WITH_EXPLICIT_NON_BLOCKING_FOLLOWUPS
NO_GO
```

`GO` requires every Release-zero acceptance criterion.

`GO_WITH_EXPLICIT_NON_BLOCKING_FOLLOWUPS` MAY be used only for documented deferred capabilities that do not weaken the Release-zero trust boundary.

`NO_GO` is mandatory for:

- subject-binding defect;
- determinism defect;
- trust-policy bypass;
- test signer exposure;
- evidence admission bypass;
- hard-gate override;
- CI-core reinterpretation requirement;
- legacy execution dependency;
- unresolved mandatory conformance mismatch.

---

## 40. Final target state

At successful completion, the repository SHALL behave as follows:

```text
l9-ci-sdk observations
  -> structural validation
  -> producer and check authorization
  -> exact subject validation
  -> integrity and freshness validation
  -> accepted evidence
  -> declarative control evaluation
  -> deterministic verdict reduction
  -> immutable assurance decision
  -> l9-ci-core transport and publication
```

The rewritten repository SHALL be understood as:

> The protocol authority, evidence-admission boundary, deterministic control evaluator, and decision issuer for the Quantum-L9 CI constellation.

It SHALL not be understood as a testing platform, scanner host, workflow engine, CI runner, repair system, red-team harness, LSP, or debt-mining platform.

The final permanent invariant SHALL remain:

```text
CI Core orchestrates.
CI SDK observes.
Debt Resolver diagnoses.
PR Repair mutates.
Debt Intelligence learns.
Debt LSP prevents.
Assurance decides.
```

---

## Appendix A. Machine-readable rewrite contract

```yaml
rewrite_contract:
  repository: Quantum-L9/l9-assurance
  branch: rewrite/v2-assurance-plane
  release: 2.0.0
  strategy: clean_rewrite_in_place
  baseline:
    branch: main
    commit: af79053c5b7f9c0338edf5f1ff7253f429646cf9
    refresh_required_before_execution: true
  compatibility:
    legacy_runtime_api: unsupported
    legacy_plugin_api: unsupported
    migration_facade: prohibited
  active_packages:
    - "@l9/assurance-contracts"
    - "@l9/assurance-evidence"
    - "@l9/assurance-controls"
    - "@l9/assurance-policy"
    - "@l9/assurance-evaluator"
    - "@l9/assurance-conformance"
    - "@l9/assurance-cli"
    - "@l9/assurance-testing"
  release_zero:
    subject: git-revision
    producer: l9-ci-sdk
    profile: l9.pull-request@1.0.0
    consumer: l9-ci-core
  prohibited:
    - scanner_execution
    - test_execution
    - github_publication
    - repository_mutation
    - arbitrary_plugin_execution
    - networked_evaluator
    - legacy_runtime_imports
    - score_overrides_hard_gates
  authority_promotion:
    included: false
    requires_shadow_mode: true
    requires_separate_approval: true
  git_mutation_authorized: false
```

## Appendix B. First implementation milestone

The first build milestone SHALL contain only:

- repository skeleton;
- eight workspace manifests;
- strict dependency boundaries;
- architecture tests;
- schema registry;
- Release-zero schemas;
- deterministic binding generation;
- valid and invalid schema fixtures;
- no evidence admission implementation yet;
- no evaluator implementation yet;
- no legacy runtime compatibility.

This milestone SHALL prove that the new foundation cannot grow back into the old platform by accident.
