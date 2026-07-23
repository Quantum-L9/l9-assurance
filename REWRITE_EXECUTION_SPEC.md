# L9 Assurance 2.1 Python-Authoritative Runtime Migration Specification

## Status

```yaml
specification_id: l9-assurance-python-authoritative-runtime
version: 2.1.1
status: implemented_and_validated
target_repository: Quantum-L9/l9-assurance
supersedes_runtime_choice: TypeScript authoritative runtime in v2.0
preserves:
  - repository identity
  - JSON Schema protocol authority
  - evidence and verdict semantics
  - CLI command surface
  - canonical artifact formats
  - constellation ownership boundaries
```

## Executive decision

L9 Assurance SHALL use Python as its authoritative runtime because its direct producers, coordinators, control plane, repair systems, and CI debt siblings are Python repositories. The migration SHALL remove Node.js and npm as runtime and build requirements without widening Assurance responsibility.

The runtime-language change is architectural plumbing, not a protocol redesign.

## Invariants

1. JSON Schema Draft 2020-12 remains the public contract authority.
2. `l9.canonical-json/v1` remains byte authoritative.
3. Existing schema IDs, reason codes, check IDs, control IDs, verdicts, output names, and CLI routes remain stable except where runtime capability metadata explicitly identifies Python entrypoints.
4. Python 3.11 is the minimum runtime, matching the constellation control plane.
5. The package MUST install as `l9-assurance` and expose the `l9-assurance` console command.
6. No Node.js, npm, TypeScript compiler, workspace, or JavaScript runtime artifact may be required.
7. The evaluator remains offline, deterministic, and free of filesystem/network/process access.
8. The CLI remains the single operator ingress and fails closed.
9. Root protocol files remain authoritative; the wheel carries a digest-verified embedded copy.
10. Production trust activation remains a governance action, not a migration shortcut.

## Target layout

```text
src/l9_assurance/
  contracts/
  evidence/
  controls/
  policy/
  evaluator/
  conformance/
  cli/
  testing/
  protocol/release-zero/
schemas/
registry/
controls/
profiles/
fixtures/
tests/
scripts/
```

## Required migration mapping

| Former responsibility | Python owner |
|---|---|
| protocol constants/types | `l9_assurance.contracts` |
| canonicalization/admission/replay | `l9_assurance.evidence` |
| control loading/resolution/assessment | `l9_assurance.controls` |
| policy and waiver semantics | `l9_assurance.policy` |
| decisions, summaries, verification | `l9_assurance.evaluator` |
| producer/consumer conformance | `l9_assurance.conformance` |
| engine and command routing | `l9_assurance.cli` |
| test builders and signer | `l9_assurance.testing` |

## Validation gates

The migration is complete only when:

- all schemas validate;
- root and embedded protocol assets are byte-consistent;
- canonicalization vectors pass;
- valid and invalid fixtures classify correctly;
- pass, fail, conditional, and indeterminate decisions are behavior-tested;
- replay output is byte-identical;
- CLI routes and exit codes are tested;
- producer and consumer conformance pass;
- evaluator boundary scans pass;
- wheel build and clean installation pass;
- no Node/TypeScript runtime artifacts remain;
- clean-room CI passes from source-only state.

## Rollback

The TypeScript implementation remains available through Git history. Rollback requires an explicit repository decision and must not create a dual-authoritative runtime. During migration, only the Python implementation is active in the release tree.

## Authority promotion

Runtime migration does not activate `l9-ci-sdk` producer trust. Authority promotion still requires an approved producer version/build identity, hosted CI evidence, shadow-mode parity, rollback proof, and governance approval.
