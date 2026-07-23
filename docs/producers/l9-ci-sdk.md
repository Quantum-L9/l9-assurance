# Producer: l9-ci-sdk

`l9-ci-sdk` is the sole Release-zero producer contract. It emits canonical `l9.observation/v1` records for six registered checks.

The checked-in production registry remains `pending` until a trusted SDK version range and build identity are approved. Pending observations are quarantined, not silently trusted.

Assurance does not import or execute SDK check code. The integration boundary is schema-valid observation artifacts.
