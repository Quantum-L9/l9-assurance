# Verdict Semantics

- `pass`: every applicable mandatory control passed and no decision-impacting unknown remains.
- `fail`: accepted evidence positively demonstrates a mandatory violation, a supported hard prohibition fires, or resolved policy explicitly converts a mandatory unknown to failure.
- `indeterminate`: mandatory assurance cannot be established because evidence or policy is missing, invalid, stale, unauthorized, mismatched, or unevaluable.
- `conditional`: mandatory controls are otherwise acceptable under an active approved waiver or declared limitation.

Reduction order is `fail` → `indeterminate` → `conditional` → `pass`. Advisory controls cannot independently block pass. The verifier recomputes reduction and rejects a decision whose declared verdict does not match its control results.
