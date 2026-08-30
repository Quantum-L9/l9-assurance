"""The packaged protocol bundle must not drift from the source of truth.

Only ``src/l9_assurance/protocol/release-zero/`` is loaded at runtime, while
``schemas/v1/``, ``registry/``, ``controls/`` and ``profiles/`` are the authored
source. Nothing failed the day those two copies disagreed -- a consumer would
simply have been judged against a schema no one had reviewed.

``scripts/sync_protocol_bundle.py --check`` already enforces this inside
``scripts/ci.py``. This test puts the same guarantee inside ``pytest -q``, which
is what most contributors actually run before pushing.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SOURCE_SCHEMAS = REPO / "schemas" / "v1"
PACKAGED_SCHEMAS = REPO / "src" / "l9_assurance" / "protocol" / "release-zero" / "schemas" / "v1"


def test_every_source_schema_has_a_byte_identical_packaged_copy() -> None:
    source = sorted(path.name for path in SOURCE_SCHEMAS.glob("*.json"))
    packaged = sorted(path.name for path in PACKAGED_SCHEMAS.glob("*.json"))
    assert source == packaged, "schema set differs between source and packaged bundle"
    assert source, "no schemas found; the source of truth path is wrong"
    for name in source:
        assert (SOURCE_SCHEMAS / name).read_bytes() == (PACKAGED_SCHEMAS / name).read_bytes(), (
            f"{name} drifted; run `python scripts/sync_protocol_bundle.py --write`"
        )


def test_artifact_reference_admits_sdk_version_in_both_copies() -> None:
    """Regression anchor for the SDK -> assurance seam.

    ``l9-ci`` unconditionally attaches ``sdkVersion`` to the finding-bundle
    artifact. Dropping the property here re-closes the only finding-carrying
    path in the constellation, so assert it in both copies rather than trusting
    the sync check alone.
    """
    for root in (SOURCE_SCHEMAS, PACKAGED_SCHEMAS):
        text = (root / "artifact-reference.schema.json").read_text(encoding="utf-8")
        assert '"sdkVersion"' in text
        # Widening the artifact reference is not an acceptable way to keep this
        # passing: unknown fields must still be refused.
        assert '"unevaluatedProperties": false' in text


def test_sync_check_passes() -> None:
    """The whole bundle -- not only schemas -- must be in sync."""
    result = subprocess.run(
        [sys.executable, "scripts/sync_protocol_bundle.py", "--check"],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
