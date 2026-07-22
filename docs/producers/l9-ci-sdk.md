# `l9-ci-sdk` Producer Contract

`l9-ci-sdk` is the sole Release-zero observation producer. Assurance does not import SDK internals or execute SDK checks.

An admitted observation must match the producer registry for:

- producer ID and semantic version range;
- repository identity when supplied;
- authorized subject kind;
- authorized check ID and exact check version;
- declared output schema;
- allowed execution status;
- required configuration digest;
- exact repository and revision subject.

The checked-in producer remains `pending` because the minimum production-trusted SDK version and build identity are unresolved (`UNKNOWN-001`). Pending producer evidence is quarantined, not silently trusted. Activation requires joint producer, assurance, architecture, and security review plus fixture conformance.
