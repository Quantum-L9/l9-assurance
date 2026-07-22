# Final Source Tree

Source-only tree. Dependencies, build output, caches, logs, and temporary artifacts are excluded.

```text
l9-assurance
├── .github
│   └── workflows
│       └── ci.yml
├── .gitignore
├── .npmrc
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CHANGE_SUMMARY.md
├── CONTRIBUTING.md
├── FINAL_TREE.md
├── LICENSE
├── MANIFEST.md
├── README.md
├── REGRESSION_GUARD.md
├── REWRITE_EXECUTION_SPEC.md
├── RUNBOOK.md
├── SECURITY.md
├── SPECIFICATION.md
├── TRACEABILITY_MAP.yaml
├── UNKNOWN_REGISTER.md
├── VALIDATION.md
├── bindings
│   ├── manifest.json
│   ├── python
│   │   └── l9_assurance_types.py
│   └── typescript
│       └── index.ts
├── controls
│   └── ci
│       ├── evidence-revision-consistency.yaml
│       ├── lint.yaml
│       ├── mandatory-findings.yaml
│       ├── repository-metadata.yaml
│       ├── sdk-validation.yaml
│       ├── tests.yaml
│       └── transport-packet.yaml
├── docs
│   ├── adr
│   │   └── ADR-0001-clean-rewrite.md
│   ├── decisions
│   │   └── verdicts.md
│   ├── legacy
│   │   └── README.md
│   ├── migration
│   │   ├── legacy-extraction-ledger.md
│   │   └── legacy-source-quarry.md
│   ├── operations
│   │   └── authority-promotion.md
│   ├── producers
│   │   └── l9-ci-sdk.md
│   ├── profiles
│   │   └── pull-request.md
│   ├── protocol
│   │   └── README.md
│   └── reviews
│       ├── FINAL_ARCHITECTURE_REVIEW.md
│       ├── FLAWLESS_VICTORY_REPORT.md
│       ├── RECURSIVE_ALIGNMENT_REVIEW.md
│       └── STUB_GAP_AUDIT.md
├── eslint.config.js
├── fixtures
│   ├── adversarial
│   │   ├── duplicate-a.observation.json
│   │   ├── duplicate-b.observation.json
│   │   ├── lint-failed.observation.json
│   │   ├── malicious-markdown.observation.json
│   │   ├── mandatory-finding.observation.json
│   │   ├── revision-substitution.observation.json
│   │   ├── stale.observation.json
│   │   └── unauthorized-check.observation.json
│   ├── compatibility
│   │   ├── check-registry.json
│   │   ├── consumer-pass
│   │   │   ├── decision.json
│   │   │   ├── decision.summary.md
│   │   │   ├── published-verdict.txt
│   │   │   └── transported-decision.json
│   │   ├── policy.json
│   │   ├── producer-registry.trusted.json
│   │   ├── profile.json
│   │   └── unsupported-decision.json
│   ├── conformance
│   │   └── canonicalization-v1.json
│   ├── invalid
│   │   ├── invalid-extension.observation.json
│   │   ├── invalid-status.observation.json
│   │   ├── malformed-location.observation.json
│   │   ├── missing-configuration-digest.observation.json
│   │   ├── missing-subject.observation.json
│   │   ├── summary-mismatch.observation.json
│   │   ├── unknown-top-level.observation.json
│   │   └── unsupported-schema.observation.json
│   ├── replay
│   │   └── pull-request-pass
│   │       ├── accepted-evidence
│   │       │   ├── ev_64644e71789da2861babcd8c2dd311aa54db2e97.json
│   │       │   ├── ev_77bf9e3f50c3d561b3dcb2a7f43249154739dfc5.json
│   │       │   ├── ev_8f4f05d30975c1bdd559f60b0fc72f7bb031d06a.json
│   │       │   ├── ev_ba9c29dd7847b7312fb64f360bd1aa7ad558d25b.json
│   │       │   ├── ev_e11f311a92224de3124a92f50a322cb3d6966f0a.json
│   │       │   └── ev_f6fecb825aec3e859fefe5372c0582638d1a6cc5.json
│   │       ├── expected-decision.canonical.json
│   │       ├── expected-summary.md
│   │       ├── policy.yaml
│   │       ├── profile.yaml
│   │       └── subject.json
│   └── valid
│       ├── lint-waiver.json
│       ├── lint.observation.json
│       ├── mandatory-findings.observation.json
│       ├── repository-metadata.observation.json
│       ├── sdk-validation.observation.json
│       ├── subject.json
│       ├── tests.observation.json
│       └── transport-packet.observation.json
├── package-lock.json
├── package.json
├── packages
│   ├── cli
│   │   ├── package.json
│   │   ├── protocol
│   │   │   └── release-zero
│   │   │       ├── controls
│   │   │       │   └── ci
│   │   │       │       ├── evidence-revision-consistency.yaml
│   │   │       │       ├── lint.yaml
│   │   │       │       ├── mandatory-findings.yaml
│   │   │       │       ├── repository-metadata.yaml
│   │   │       │       ├── sdk-validation.yaml
│   │   │       │       ├── tests.yaml
│   │   │       │       └── transport-packet.yaml
│   │   │       ├── fixtures
│   │   │       │   ├── compatibility
│   │   │       │   │   ├── check-registry.json
│   │   │       │   │   └── producer-registry.trusted.json
│   │   │       │   └── conformance
│   │   │       │       └── canonicalization-v1.json
│   │   │       ├── manifest.json
│   │   │       ├── profiles
│   │   │       │   └── pull-request
│   │   │       │       ├── policy.yaml
│   │   │       │       └── profile.yaml
│   │   │       ├── registry
│   │   │       │   ├── checks.yaml
│   │   │       │   ├── claims.yaml
│   │   │       │   ├── controls.yaml
│   │   │       │   ├── producers.yaml
│   │   │       │   └── profiles.yaml
│   │   │       └── schemas
│   │   │           ├── registry.json
│   │   │           └── v1
│   │   │               ├── artifact-reference.schema.json
│   │   │               ├── assurance-plan.schema.json
│   │   │               ├── audit-bundle-manifest.schema.json
│   │   │               ├── check.schema.json
│   │   │               ├── claim.schema.json
│   │   │               ├── control-result.schema.json
│   │   │               ├── control.schema.json
│   │   │               ├── decision.schema.json
│   │   │               ├── digest.schema.json
│   │   │               ├── evidence-admission.schema.json
│   │   │               ├── evidence-envelope.schema.json
│   │   │               ├── finding.schema.json
│   │   │               ├── observation.schema.json
│   │   │               ├── policy.schema.json
│   │   │               ├── producer.schema.json
│   │   │               ├── profile.schema.json
│   │   │               ├── subject.schema.json
│   │   │               ├── unknown.schema.json
│   │   │               └── waiver.schema.json
│   │   ├── src
│   │   │   ├── args.ts
│   │   │   ├── bin.ts
│   │   │   ├── commands.ts
│   │   │   ├── config.ts
│   │   │   ├── engine.ts
│   │   │   ├── index.ts
│   │   │   └── io.ts
│   │   └── tsconfig.json
│   ├── conformance
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── consumer.ts
│   │   │   ├── index.ts
│   │   │   └── producer.ts
│   │   └── tsconfig.json
│   ├── contracts
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── constants.ts
│   │   │   ├── generated.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── tsconfig.json
│   ├── controls
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── evaluate.ts
│   │   │   ├── index.ts
│   │   │   ├── load.ts
│   │   │   └── resolve.ts
│   │   └── tsconfig.json
│   ├── evaluator
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── evaluate.ts
│   │   │   ├── index.ts
│   │   │   ├── summary.ts
│   │   │   └── verify.ts
│   │   └── tsconfig.json
│   ├── evidence
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── admission.ts
│   │   │   ├── canonical.ts
│   │   │   ├── digest.ts
│   │   │   ├── discovery.ts
│   │   │   ├── index.ts
│   │   │   ├── limits.ts
│   │   │   ├── replay.ts
│   │   │   ├── semver.ts
│   │   │   ├── subject.ts
│   │   │   └── validation.ts
│   │   └── tsconfig.json
│   ├── policy
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── load.ts
│   │   │   ├── resolve.ts
│   │   │   └── waiver.ts
│   │   └── tsconfig.json
│   └── testing
│       ├── package.json
│       ├── src
│       │   ├── builders.ts
│       │   ├── clock.ts
│       │   ├── ids.ts
│       │   ├── index.ts
│       │   └── signer.ts
│       └── tsconfig.json
├── profiles
│   └── pull-request
│       ├── policy.yaml
│       └── profile.yaml
├── registry
│   ├── checks.yaml
│   ├── claims.yaml
│   ├── controls.yaml
│   ├── producers.yaml
│   └── profiles.yaml
├── schemas
│   ├── registry.json
│   └── v1
│       ├── artifact-reference.schema.json
│       ├── assurance-plan.schema.json
│       ├── audit-bundle-manifest.schema.json
│       ├── check.schema.json
│       ├── claim.schema.json
│       ├── control-result.schema.json
│       ├── control.schema.json
│       ├── decision.schema.json
│       ├── digest.schema.json
│       ├── evidence-admission.schema.json
│       ├── evidence-envelope.schema.json
│       ├── finding.schema.json
│       ├── observation.schema.json
│       ├── policy.schema.json
│       ├── producer.schema.json
│       ├── profile.schema.json
│       ├── subject.schema.json
│       ├── unknown.schema.json
│       └── waiver.schema.json
├── scripts
│   ├── benchmark.mjs
│   ├── build.mjs
│   ├── ci.mjs
│   ├── clean.mjs
│   ├── format.mjs
│   ├── generate-bindings.mjs
│   ├── lib
│   │   ├── files.mjs
│   │   └── schema-validator.mjs
│   ├── lint.mjs
│   ├── run-tests.mjs
│   ├── sync-protocol-bundle.mjs
│   ├── validate-boundaries.mjs
│   ├── validate-build-evidence.mjs
│   ├── validate-cli-distribution.mjs
│   ├── validate-completeness.mjs
│   ├── validate-fixtures.mjs
│   ├── validate-registries.mjs
│   ├── validate-schemas.mjs
│   └── verify-replay.mjs
├── tests
│   ├── architecture
│   │   └── architecture.test.mjs
│   ├── conformance
│   │   └── conformance.test.mjs
│   ├── contract
│   │   ├── contracts.test.mjs
│   │   ├── plan-schema.test.mjs
│   │   └── python-bindings.test.mjs
│   ├── helpers
│   │   └── fixtures.mjs
│   ├── integration
│   │   └── vertical-slice.test.mjs
│   ├── performance
│   │   └── performance.test.mjs
│   ├── replay
│   │   └── replay.test.mjs
│   ├── security
│   │   └── security.test.mjs
│   └── unit
│       ├── controls-policy.test.mjs
│       ├── evaluator.test.mjs
│       └── evidence.test.mjs
├── tsconfig.base.json
├── tsconfig.json
├── tsconfig.typecheck.json
├── types
│   └── node-shims
│       └── index.d.ts
├── validation-benchmark.json
└── validation-report.json
```
