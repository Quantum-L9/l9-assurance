"""Executed proof that `L9.CI.REPOSITORY_METADATA` has a real producer.

The companion to `test_sdk_validation_control`. SDK #94 shipped two derived
projectors and only one of them was proven against this consumer, which is the
weaker half of the same problem those tests exist to fix: a control with a
producer nobody exercises is one rename away from going quietly indeterminate.

What makes this closed rather than merely populated is the same property as
sdk-validation: `project_repository_metadata_observation` *derives* the verdict.
It compares the manifest committed to a repository against what the SDK builds
from repository truth right now, and takes no status argument. It also refuses
to describe a subject it cannot observe -- a non-git root, a dirty tree, or a
`revision` that disagrees with HEAD all raise rather than emit evidence bound
to the caller's word.

So the repository here is a real git repository built in a temp directory, not
a fixture: HEAD is a real commit and the manifest is the SDK's own rendering.
The subject is bound to that commit, because the control declares
`subjectBinding.exactRevision` and the shared `fixtures/valid/subject.json`
pins a placeholder revision that no real repository can have.

Same import contract as the other two cross-repo modules: the CI job sets
L9_CROSS_REPO_SDK_REQUIRED=1, and under it a missing SDK or a missing producer
is a failure, never a skip.
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

import pytest

REPO = Path(__file__).resolve().parents[2]
CONFIGURATION_DIGEST = "b" * 64
STARTED = "2026-07-21T00:00:00Z"
COMPLETED = "2026-07-21T00:00:01Z"
RECEIVED = "2026-07-21T00:00:02Z"

_SDK_REQUIRED = os.environ.get("L9_CROSS_REPO_SDK_REQUIRED") == "1"

try:  # pragma: no cover - import guard, exercised by the cross-repo CI job
    from l9_ci.commands.observations import project_repository_metadata_observation
    from l9_ci.repository.manifest import build_repository_manifest
except ImportError as exc:  # pragma: no cover
    if _SDK_REQUIRED:
        raise RuntimeError(
            "L9_CROSS_REPO_SDK_REQUIRED=1 but the installed l9-ci has no "
            "project_repository_metadata_observation; the repository-metadata "
            "control has no producer to prove against"
        ) from exc
    pytest.skip(
        f"l9-ci has no repository-metadata producer ({exc}); "
        "run the cross-repo CI job to prove this",
        allow_module_level=True,
    )


def _git(root: Path, *args: str) -> str:
    """Run git in `root`, with an identity so commits work on a bare runner."""
    result = subprocess.run(
        ("git", *args),
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
        env={
            **os.environ,
            "GIT_AUTHOR_NAME": "cross-repo-test",
            "GIT_AUTHOR_EMAIL": "cross-repo-test@example.invalid",
            "GIT_COMMITTER_NAME": "cross-repo-test",
            "GIT_COMMITTER_EMAIL": "cross-repo-test@example.invalid",
        },
    )
    return result.stdout.strip()


@pytest.fixture
def repository(tmp_path: Path) -> tuple[Path, str]:
    """A real git repository whose committed manifest is the SDK's rendering.

    Committed in two steps because the manifest describes the tracked files:
    it can only be rendered once they exist, and the tree must be clean again
    afterwards or the projector refuses to describe the revision at all.
    """
    root = tmp_path / "subject-repo"
    (root / "src").mkdir(parents=True)
    (root / "src" / "example.py").write_text("VALUE = 1\n", encoding="utf-8")
    (root / "README.md").write_text("# example\n", encoding="utf-8")

    _git(root, "init", "--quiet", "--initial-branch", "main")
    _git(root, "add", "--all")
    _git(root, "commit", "--quiet", "--message", "seed")

    manifest_path = root / "MANIFEST.md"
    manifest = build_repository_manifest(root, manifest_path=manifest_path)
    manifest_path.write_text(manifest.render_markdown(), encoding="utf-8")
    _git(root, "add", "--all")
    _git(root, "commit", "--quiet", "--message", "record the manifest")

    return root, _git(root, "rev-parse", "HEAD")


def _project(root: Path, revision: str) -> dict[str, Any]:
    return dict(
        project_repository_metadata_observation(
            repository_root=root,
            repository="Quantum-L9/example",
            revision=revision,
            configuration_digest=CONFIGURATION_DIGEST,
            run_id="12345",
            attempt=1,
            started_at=STARTED,
            completed_at=COMPLETED,
        )
    )


def _configuration() -> dict[str, Any]:
    from l9_assurance.cli import load_configuration

    return load_configuration()


def _subject(revision: str) -> dict[str, Any]:
    """The shared fixture, rebound to the revision actually observed.

    `exactRevision` binding means the placeholder commit in the checked-in
    fixture would be rejected against a real repository -- correctly, which is
    what `test_evidence_bound_to_another_revision_is_rejected` pins.
    """
    subject: dict[str, Any] = json.loads(
        (REPO / "fixtures/valid/subject.json").read_text(encoding="utf-8")
    )
    subject["revision"]["commit"] = revision
    return subject


def _admit(observation: dict[str, Any], revision: str) -> dict[str, Any]:
    from l9_assurance.evidence import admit_observations

    configuration = _configuration()
    report: dict[str, Any] = admit_observations(
        [observation],
        {
            "subject": _subject(revision),
            "producerRegistry": configuration["producerRegistry"],
            "checkRegistry": configuration["checkRegistry"],
            "receivedAt": RECEIVED,
            "channel": "local",
        },
    )
    return report


def _codes(report: dict[str, Any]) -> list[str]:
    return [reason["code"] for result in report["results"] for reason in result["reasons"]]


def _control(observation: dict[str, Any], revision: str) -> dict[str, Any]:
    from l9_assurance.controls.resolve import resolve_profile
    from l9_assurance.evaluator import evaluate

    configuration = _configuration()
    report = _admit(observation, revision)
    decision = evaluate(
        _subject(revision),
        resolve_profile(configuration["profile"], configuration["controls"]),
        {"policy": configuration["policy"], "waivers": []},
        report["accepted"],
        {
            "decisionId": "dec_repository_metadata_cross_repo",
            "evaluationTime": "2026-07-21T00:00:03Z",
        },
    )
    result: dict[str, Any] = next(
        item
        for item in decision["controlResults"]
        if item["controlId"] == "L9.CI.REPOSITORY_METADATA"
    )
    return result


def test_the_live_check_registry_already_admits_repository_metadata(
    repository: tuple[Path, str],
) -> None:
    """Read against the checked-in registry, not a trusted fixture."""
    root, revision = repository
    report = _admit(_project(root, revision), revision)
    assert _codes(report) == []
    assert report["rejectedCount"] == 0


def test_a_reconciled_manifest_satisfies_the_control(
    repository: tuple[Path, str],
) -> None:
    """The row that read CONTROL_CARDINALITY_VIOLATION for want of a producer."""
    root, revision = repository
    observation = _project(root, revision)
    assert observation["execution"]["status"] == "passed"

    result = _control(observation, revision)
    assert result["status"] == "pass"
    assert [reason["code"] for reason in result["reasons"]] == ["CONTROL_REQUIREMENT_SATISFIED"]


def test_real_manifest_drift_is_admitted_and_fails_the_control(
    repository: tuple[Path, str],
) -> None:
    """Drift is evidence, and must not be suppressed.

    A committed manifest that no longer matches repository truth is exactly the
    condition this control exists to catch. Dropping the observation would turn
    a revision known to have drifted into one with no evidence -- indeterminate
    rather than failed, which reads as a missing producer instead of a real
    defect.
    """
    root, _ = repository
    (root / "src" / "added_after_the_manifest.py").write_text("VALUE = 2\n", encoding="utf-8")
    _git(root, "add", "--all")
    _git(root, "commit", "--quiet", "--message", "add a file without regenerating")
    revision = _git(root, "rev-parse", "HEAD")

    observation = _project(root, revision)
    assert observation["execution"]["status"] == "failed"

    report = _admit(observation, revision)
    assert report["rejectedCount"] == 0

    result = _control(observation, revision)
    assert result["status"] == "fail"
    assert "CONTROL_POSITIVE_FAILURE" in [reason["code"] for reason in result["reasons"]]


class TestItRefusesToDescribeWhatItCannotObserve:
    """The projector's own fail-closed conditions, at the real seam.

    Each of these would otherwise produce evidence bound to the caller's
    assertion rather than to an observed repository -- the exact substitution
    the derived projectors exist to prevent.
    """

    def test_a_dirty_tree_is_refused(self, repository: tuple[Path, str]) -> None:
        root, revision = repository
        (root / "src" / "example.py").write_text("VALUE = 99\n", encoding="utf-8")
        with pytest.raises(ValueError, match="dirty"):
            _project(root, revision)

    def test_a_revision_that_is_not_head_is_refused(self, repository: tuple[Path, str]) -> None:
        root, _ = repository
        with pytest.raises(ValueError, match="does not match the repository HEAD"):
            _project(root, "c" * 40)

    def test_a_non_git_root_is_refused(self, tmp_path: Path) -> None:
        plain = tmp_path / "not-a-repo"
        plain.mkdir()
        with pytest.raises(ValueError):
            _project(plain, "d" * 40)


class TestTamperedEvidenceStillFailsClosed:
    def test_a_flipped_status_is_rejected(self, repository: tuple[Path, str]) -> None:
        """`observationId` is a content address and admission recomputes it."""
        root, _ = repository
        (root / "src" / "drifted.py").write_text("VALUE = 3\n", encoding="utf-8")
        _git(root, "add", "--all")
        _git(root, "commit", "--quiet", "--message", "drift")
        revision = _git(root, "rev-parse", "HEAD")

        tampered = json.loads(json.dumps(_project(root, revision)))
        assert tampered["execution"]["status"] == "failed"
        tampered["execution"]["status"] = "passed"

        report = _admit(tampered, revision)
        assert "EVIDENCE_PAYLOAD_DIGEST_MISMATCH" in _codes(report)
        assert report["rejectedCount"] == 1

    def test_evidence_bound_to_another_revision_is_rejected(
        self, repository: tuple[Path, str]
    ) -> None:
        root, revision = repository
        observation = _project(root, revision)
        report = _admit(observation, "e" * 40)
        assert "EVIDENCE_REVISION_MISMATCH" in _codes(report)
        assert report["rejectedCount"] == 1

    def test_a_malformed_payload_is_rejected(self, repository: tuple[Path, str]) -> None:
        root, revision = repository
        tampered = json.loads(json.dumps(_project(root, revision)))
        del tampered["summary"]
        report = _admit(tampered, revision)
        assert "EVIDENCE_SCHEMA_INVALID" in _codes(report)
        assert report["rejectedCount"] == 1
