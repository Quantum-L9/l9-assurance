from __future__ import annotations

import json
from pathlib import Path

import pytest

from l9_assurance.evidence import InMemoryReplayStore, admit_observations

REPO = Path(__file__).resolve().parents[2]


def test_replay_store_persists_across_admissions(trusted_config, subject) -> None:
    value = json.loads((REPO / "fixtures/valid/lint.observation.json").read_text())
    store = InMemoryReplayStore()
    context = {
        "subject": subject,
        "producerRegistry": trusted_config["producerRegistry"],
        "checkRegistry": trusted_config["checkRegistry"],
        "receivedAt": "2026-07-21T00:00:02Z",
        "channel": "local",
        "replayStore": store,
    }
    first = admit_observations([value], context)
    second = admit_observations([value], context)
    assert len(first["accepted"]) == 1
    assert second["duplicateCount"] == 1


def test_replay_store_is_bounded_append_only_and_idempotent() -> None:
    from l9_assurance.evidence import (
        InMemoryReplayStore,
        ReplayRecord,
        ReplayStoreCapacityError,
        ReplayStoreConflictError,
    )

    store = InMemoryReplayStore(maximum_records=1)
    original = ReplayRecord("obs-1", "fingerprint-1", "evidence-1")
    store.record(original)
    store.record(original)
    assert len(store) == 1

    with pytest.raises(ReplayStoreConflictError):
        store.record(ReplayRecord("obs-1", "fingerprint-2", "evidence-2"))
    with pytest.raises(ReplayStoreConflictError):
        store.record(ReplayRecord("obs-2", "fingerprint-1", "evidence-2"))
    with pytest.raises(ReplayStoreCapacityError):
        store.record(ReplayRecord("obs-2", "fingerprint-2", "evidence-2"))


def test_invalid_replay_capacity_fails_closed() -> None:
    from l9_assurance.evidence import InMemoryReplayStore

    with pytest.raises(ValueError, match="positive integer"):
        InMemoryReplayStore(maximum_records=0)
