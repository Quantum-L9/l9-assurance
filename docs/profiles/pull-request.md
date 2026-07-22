# Pull-request Assurance Profile

`l9.pull-request@1.0.0` applies to an exact Git commit and evaluates seven mandatory controls:

1. repository metadata;
2. transport packet validity;
3. SDK validation;
4. lint/static validation;
5. tests;
6. absence of policy-defined mandatory findings;
7. evidence revision consistency.

Positive accepted violation evidence produces `fail`. Missing, malformed, stale, unauthorized, or mismatched mandatory evidence produces `indeterminate` unless the resolved policy explicitly converts mandatory unknowns to `fail`. An active authorized waiver may convert an otherwise failed waivable control to `conditional`. Scores never override these rules.
