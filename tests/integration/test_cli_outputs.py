from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from l9_assurance.cli import run_cli


def _trusted_protocol(tmp_path: Path, repo: Path) -> Path:
    source = repo / "src" / "l9_assurance" / "protocol" / "release-zero"
    target = tmp_path / "protocol"
    shutil.copytree(source, target)
    trusted = repo / "fixtures" / "compatibility" / "producer-registry.trusted.json"
    (target / "registry" / "producers.yaml").write_bytes(trusted.read_bytes())
    manifest_path = target / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    for item in manifest["files"]:
        path = target / item["path"]
        item["digest"] = hashlib.sha256(path.read_bytes()).hexdigest()
    preimage = {key: manifest[key] for key in ("schema", "schemaVersion", "assuranceVersion", "canonicalization", "files")}
    manifest["protocolDigest"] = {"algorithm": "sha256", "value": hashlib.sha256(json.dumps(preimage, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()}
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    return target


def test_cli_admit_and_evaluate(tmp_path: Path) -> None:
    repo = Path(__file__).resolve().parents[2]
    protocol = _trusted_protocol(tmp_path, repo)
    admission = tmp_path / "admission"
    decision = tmp_path / "decision"
    observations = tmp_path / "observations"
    observations.mkdir()
    for path in (repo / "fixtures" / "valid").glob("*.observation.json"):
        shutil.copy2(path, observations / path.name)
    common = ["--root", str(protocol)]
    assert run_cli(["evidence", "admit", *common, "--subject", str(repo / "fixtures/valid/subject.json"), "--input", str(observations), "--received-at", "2026-07-21T00:00:02Z", "--output", str(admission)], stdout=lambda _: None, stderr=lambda _: None) == 0
    assert len(list((admission / "accepted").glob("*.json"))) == 6
    code = run_cli(["evaluate", *common, "--subject", str(repo / "fixtures/valid/subject.json"), "--profile", "l9.pull-request@1", "--policy", "l9.organization-default@1", "--evidence", str(admission / "accepted"), "--evaluation-time", "2026-07-21T00:00:03Z", "--output", str(decision)], stdout=lambda _: None, stderr=lambda _: None)
    assert code == 0
    raw = (decision / "decision.json").read_text()
    assert raw.endswith("\n") and "\n " not in raw
    assert json.loads(raw)["verdict"] == "pass"


def test_simulate_is_non_authoritative(tmp_path: Path, engine, subject, valid_observations) -> None:
    report = engine.admit(subject, valid_observations, received_at="2026-07-21T00:00:02Z")
    evidence = tmp_path / "accepted"
    evidence.mkdir()
    for item in report["accepted"]:
        (evidence / f"{item['envelope']['evidenceId']}.json").write_text(json.dumps(item["envelope"]))
    output = tmp_path / "simulation"
    repo = Path(__file__).resolve().parents[2]
    code = run_cli(["simulate", "--subject", str(repo / "fixtures/valid/subject.json"), "--profile", "l9.pull-request@1", "--policy", "l9.organization-default@1", "--evidence", str(evidence), "--evaluation-time", "2026-07-21T00:00:03Z", "--output", str(output)], stdout=lambda _: None, stderr=lambda _: None)
    assert code == 0
    assert json.loads((output / "decision.json").read_text())["extensions"]["l9.assurance.simulation"]["authoritative"] is False
