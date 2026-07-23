from __future__ import annotations

from dataclasses import dataclass

DEFAULT_REPLAY_CAPACITY = 100_000


class ReplayStoreError(RuntimeError):
    """Base class for fail-closed replay-store errors."""


class ReplayStoreCapacityError(ReplayStoreError):
    """Raised when append-only replay state reaches its configured capacity."""


class ReplayStoreConflictError(ReplayStoreError):
    """Raised when an immutable replay identity is rebound to different content."""


@dataclass(frozen=True, slots=True)
class ReplayRecord:
    observation_id: str
    fingerprint: str
    evidence_id: str


class InMemoryReplayStore:
    """Bounded, append-only replay state for one Assurance execution context.

    The store never evicts records because eviction would weaken replay detection.
    It fails closed at capacity and rejects any attempt to rebind an observation ID
    or fingerprint to different evidence.
    """

    def __init__(self, maximum_records: int = DEFAULT_REPLAY_CAPACITY) -> None:
        if isinstance(maximum_records, bool) or not isinstance(maximum_records, int) or maximum_records < 1:
            raise ValueError("maximum_records must be a positive integer")
        self._maximum_records = maximum_records
        self._by_observation: dict[str, ReplayRecord] = {}
        self._by_fingerprint: dict[str, ReplayRecord] = {}

    @property
    def maximum_records(self) -> int:
        return self._maximum_records

    def __len__(self) -> int:
        return len(self._by_observation)

    def find_by_observation_id(self, observation_id: str) -> ReplayRecord | None:
        return self._by_observation.get(observation_id)

    def find_by_fingerprint(self, fingerprint: str) -> ReplayRecord | None:
        return self._by_fingerprint.get(fingerprint)

    def record(self, record: ReplayRecord) -> None:
        by_observation = self._by_observation.get(record.observation_id)
        by_fingerprint = self._by_fingerprint.get(record.fingerprint)

        if by_observation is not None and by_observation != record:
            raise ReplayStoreConflictError(
                f"observation ID {record.observation_id} is already bound to different replay state"
            )
        if by_fingerprint is not None and by_fingerprint != record:
            raise ReplayStoreConflictError(
                f"fingerprint {record.fingerprint} is already bound to different replay state"
            )
        if by_observation == record and by_fingerprint == record:
            return
        if len(self) >= self._maximum_records:
            raise ReplayStoreCapacityError(
                f"replay store capacity {self._maximum_records} reached; refusing to evict replay state"
            )

        self._by_observation[record.observation_id] = record
        self._by_fingerprint[record.fingerprint] = record
