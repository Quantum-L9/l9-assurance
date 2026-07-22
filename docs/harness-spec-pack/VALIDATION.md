# Validation

## Validation decision

`PASS_WITH_EXTERNAL_UNKNOWNS`

## Executed Assurance checks

- strict plan schema validation;
- plan digest and identity verification;
- embedded protocol file and aggregate digest verification;
- clean offline local-tarball CLI installation without a repository checkout;
- TypeScript/Python canonicalization vectors;
- registry-aware producer conformance;
- full Assurance CI and replay;
- source-only clean-room CI;
- package dry-runs and ZIP integrity.

## Spec checks

- version advanced to 1.3.0;
- Assurance baseline pinned to `be8100797cae30eeca31763ea74c5f7eca7bde82`;
- candidate release pinned to `2.0.1`;
- protocol digest pinned to `46c8328bbdc12452f8c61f6e43c3b3f001189ccf8321a364d4c1f0f79c9d4e2a`;
- no admission report remains under `artifacts/assurance/`;
- Harness-only invocation markers are forbidden from canonical decisions;
- SDK and unavailable repository facts remain `UNKNOWN` rather than fabricated.

## Not executed

No actual `l9-harness` repository was available. Therefore no Harness implementation, CI, import, or runtime claim is made. Production SDK invocation and trust remain blocked pending their own contract evidence.
