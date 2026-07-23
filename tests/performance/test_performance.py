from __future__ import annotations

from time import perf_counter

from l9_assurance.testing import build_observation, build_subject


def test_admission_throughput(engine) -> None:
    subject = build_subject()
    values = [build_observation(observation_id=f"obs_{i}", subject=subject) for i in range(1000)]
    started = perf_counter()
    report = engine.admit(subject, values, received_at="2026-07-21T00:00:02Z")
    elapsed = perf_counter() - started
    assert len(report["accepted"]) == 1
    assert report["duplicateCount"] == 999
    assert elapsed < 5.0


def test_evaluation_performance(engine, subject, valid_observations) -> None:
    report = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    started = perf_counter()
    for index in range(100):
        engine.evaluate(
            subject,
            report["accepted"],
            evaluation_time=f"2026-07-21T00:00:{3 + index % 50:02d}Z",
            decision_id=f"dec_perf_{index}",
        )
    assert perf_counter() - started < 2.0
