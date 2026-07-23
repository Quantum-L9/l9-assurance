# Authority Promotion

Python runtime migration does not grant production authority.

Promotion requires:

1. approved `l9-ci-sdk` version and build identity;
2. successful hosted CI on protected branches;
3. shadow-mode comparison with no unresolved mandatory semantic mismatch;
4. tested rollback;
5. package-channel installation evidence;
6. governance approval.

Until then, Assurance is suitable for branch review, local conformance, and shadow evaluation only.
