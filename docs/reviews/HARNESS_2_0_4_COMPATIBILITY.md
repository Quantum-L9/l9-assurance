# Harness 2.0.4 Compatibility Review

## Decision

`PASS`

The Python-authoritative Assurance 2.1.1 wheel was installed without an Assurance repository checkout and invoked through the uploaded L9 Harness 2.0.4 Python adapters.

## Verified seam

| Harness adapter | Assurance command | Result |
|---|---|---|
| `l9_harness.assurance.plan.capture_plan` | `l9-assurance plan` | PASS |
| `l9_harness.assurance.evaluation.evaluate` | `l9-assurance evaluate` | PASS |
| Harness subprocess boundary | installed Python console script | PASS |
| Harness invocation evidence | stdout, stderr, exit code, argv digest, timestamps | PASS |
| Plan verification | `l9-assurance verify-plan` | PASS |
| Decision verification | `l9-assurance verify` | PASS |

The evaluation used six admitted Release-zero observations and produced a valid `pass` decision. Harness retained two non-authoritative invocation records, one for planning and one for evaluation.

## Compatibility conclusion

Harness depends on the executable and artifact contracts, not on the former TypeScript implementation. The Python runtime preserves those contracts, so the runtime migration requires no Harness ownership change and no second toolchain.

## Limit

This local proof does not replace hosted shadow-mode evidence or production producer-trust activation. Those remain governed promotion requirements.
