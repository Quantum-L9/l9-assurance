# Before and After Delta

| Dimension | Before | After |
|---|---|---|
| Release | 2.1.0 | 2.1.1 |
| Release files | 224 | 236 |
| Behavior tests | 71 | 77 |
| Repository classification | prose | `.l9/repo-spec.yaml` |
| Per-file L9 metadata | absent | deterministic complete manifest |
| Replay capacity | unbounded | positive configurable bound, default 100,000 |
| Replay rebinding | public method could overwrite | immutable and conflict-rejecting |
| Replay eviction | not specified | forbidden |
| Gate applicability | documentation only | machine-readable `not_applicable_no_egress` |
| YAML safety | implementation convention | locked deterministic JSON subset and validated |
| File enumeration | duplicated | shared primitive |
| Stub detection | marker scan | marker plus AST pass/ellipsis/NotImplemented checks |
| Wheel proof | could inherit source path | sanitized environment plus module-origin assertion |
| Agent operability | general contributing guide | explicit `AGENTS.md` authority and stop contract |
| Alignment evidence | distributed prose | dedicated human and machine-readable reports |

No public schema ID, CLI route, artifact filename, exit code, control ID, check ID, verdict, or ownership boundary changed.
