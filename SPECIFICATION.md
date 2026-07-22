# L9 Assurance Release-zero Specification

The locked build contract is [REWRITE_EXECUTION_SPEC.md](REWRITE_EXECUTION_SPEC.md).

Release zero supports one immutable subject kind (`git-revision`), one producer contract (`l9-ci-sdk`), one assurance profile (`l9.pull-request@1.0.0`), and one decision consumer (`l9-ci-core`).

All mandatory evidence must be structurally valid, authorized, exact-revision-bound, fresh under the applicable policy, and accepted before it can satisfy a control. Missing, stale, malformed, unauthorized, or revision-mismatched mandatory evidence is indeterminate, not demonstrated failure.

The seven mandatory controls are repository metadata, transport packet, SDK validation, lint, tests, mandatory findings absent, and evidence revision consistency.
