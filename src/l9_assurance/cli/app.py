from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Callable, Mapping, Sequence

from l9_assurance.conformance import run_consumer_conformance, run_producer_conformance
from l9_assurance.constants import EXIT_CODES
from l9_assurance.contracts.schema import validate_instance
from l9_assurance.evaluator import render_decision_summary, verify_decision
from l9_assurance.evidence import (
    canonical_json,
    discover_json_artifacts,
    observation_fingerprint,
    validate_observation,
    verify_envelope_integrity,
)
from l9_assurance.policy import parse_waiver

from .catalog import describe_capabilities, resolve_cli_command
from .config import load_configuration
from .engine import AssuranceEngine, verify_plan
from .io import read_json_file, write_canonical_file, write_json_file, write_text_file


def parse_argv(argv: Sequence[str]) -> tuple[list[str], dict[str, str | bool]]:
    positionals: list[str] = []
    flags: dict[str, str | bool] = {}
    index = 0
    while index < len(argv):
        token = argv[index]
        if token == "--":
            positionals.extend(argv[index + 1 :])
            break
        if not token.startswith("--"):
            positionals.append(token)
            index += 1
            continue
        raw = token[2:]
        if not raw:
            raise ValueError("Empty flag name is not allowed")
        name, separator, embedded = raw.partition("=")
        if not name.replace("-", "").isalnum() or not name[0].isalpha() or name.lower() != name:
            raise ValueError(f"Invalid flag --{name}")
        if name in flags:
            raise ValueError(f"Duplicate flag --{name}")
        if separator:
            if not embedded:
                raise ValueError(f"Missing --{name} value")
            flags[name] = embedded
        elif index + 1 < len(argv) and not argv[index + 1].startswith("--"):
            flags[name] = argv[index + 1]
            index += 1
        else:
            flags[name] = True
        index += 1
    return positionals, flags


def run_cli(
    argv: Sequence[str],
    *,
    stdout: Callable[[str], Any] = sys.stdout.write,
    stderr: Callable[[str], Any] = sys.stderr.write,
) -> int:
    try:
        positionals, flags = parse_argv(argv)
        route = resolve_cli_command(positionals)
        unknown = sorted(set(flags) - set(route["flags"]))
        if unknown:
            raise ValueError("Unknown flag(s): " + ", ".join(f"--{item}" for item in unknown))

        if route["id"] == "capabilities":
            if flags.get("json") is not True:
                raise ValueError("Missing --json")
            config = load_configuration(_optional(flags, "root"))
            capabilities = describe_capabilities(config)
            errors = validate_instance(capabilities, "assurance-capabilities.schema.json")
            if errors:
                raise ValueError("Generated capabilities are invalid: " + "; ".join(errors))
            stdout(canonical_json(capabilities) + "\n")
            return EXIT_CODES["pass"]

        if route["id"] == "verify":
            report = verify_decision(read_json_file(_require(flags, "decision")))
            stdout(json.dumps(report, indent=2) + "\n")
            return EXIT_CODES["pass"] if report["valid"] else EXIT_CODES["input"]

        if route["id"] == "verify-plan":
            report = verify_plan(read_json_file(_require(flags, "plan")))
            stdout(json.dumps(report, indent=2) + "\n")
            return EXIT_CODES["pass"] if report["valid"] else EXIT_CODES["input"]

        if route["id"] == "conformance.consumer":
            fixture = Path(_require(flags, "fixture"))
            if _optional(flags, "root"):
                fixture = Path(str(flags["root"])).resolve() / fixture
            decision = read_json_file(fixture / "decision.json")
            report = run_consumer_conformance(
                consumer_id=_require(flags, "consumer"),
                canonical_decision=decision,
                transported_decision_text=(fixture / "transported-decision.json").read_text(encoding="utf-8"),
                published_verdict=(fixture / "published-verdict.txt").read_text(encoding="utf-8").strip(),
                published_summary=(fixture / "decision.summary.md").read_text(encoding="utf-8"),
            )
            stdout(json.dumps(report, indent=2) + "\n")
            return EXIT_CODES["pass"] if report["passed"] else EXIT_CODES["input"]

        config = load_configuration(_optional(flags, "root"))

        if route["id"] == "conformance.producer":
            artifacts = discover_json_artifacts(_require(flags, "input"))
            values = [item["value"] for item in artifacts]
            subject = read_json_file(_require(flags, "subject")) if _optional(flags, "subject") else _derive_subject(values)
            received_at = _optional(flags, "received-at") or _derive_received_at(values)
            producers = read_json_file(_require(flags, "producer-registry")) if _optional(flags, "producer-registry") else config["producerRegistry"]
            checks = read_json_file(_require(flags, "check-registry")) if _optional(flags, "check-registry") else config["checkRegistry"]
            report = run_producer_conformance(values, producer_id=_require(flags, "producer"), subject=subject, producer_registry=producers, check_registry=checks, received_at=received_at)
            report["files"] = len(artifacts)
            stdout(json.dumps(report, indent=2) + "\n")
            return EXIT_CODES["pass"] if report["passed"] else EXIT_CODES["input"]

        engine = AssuranceEngine(config)
        if route["id"] == "plan":
            _assert_selections(flags, config, require_policy=False)
            plan = engine.plan(read_json_file(_require(flags, "subject")))
            verification = verify_plan(plan)
            if not verification["valid"]:
                raise ValueError("Generated plan failed self-verification: " + "; ".join(verification["reasons"]))
            write_canonical_file(_require(flags, "output"), plan)
            stdout(f"Planned {len(plan['controls'])} controls as {plan['planId']}.\n")
            return EXIT_CODES["pass"]

        if route["id"] == "evidence.admit":
            subject = read_json_file(_require(flags, "subject"))
            artifacts = discover_json_artifacts(_require(flags, "input"))
            report = engine.admit(subject, [item["value"] for item in artifacts], received_at=_optional(flags, "received-at"))
            output = Path(_require(flags, "output"))
            write_json_file(output / "admission-report.json", report)
            for item in report["accepted"]:
                write_json_file(output / "accepted" / f"{item['envelope']['evidenceId']}.json", item["envelope"])
            stdout(f"Accepted {len(report['accepted'])}; rejected {report['rejectedCount']}; quarantined {report['quarantinedCount']}; duplicate {report['duplicateCount']}.\n")
            return EXIT_CODES["pass"]

        if route["id"] in {"evaluate", "simulate"}:
            _assert_selections(flags, config, require_policy=True)
            subject = read_json_file(_require(flags, "subject"))
            accepted = _load_accepted(_require(flags, "evidence"))
            waivers = [parse_waiver(json.dumps(item["value"])) for item in discover_json_artifacts(_require(flags, "waivers"))] if _optional(flags, "waivers") else []
            decision = engine.evaluate(subject, accepted, evaluation_time=_require(flags, "evaluation-time"), waivers=waivers)
            if route["id"] == "simulate":
                decision.setdefault("extensions", {})["l9.assurance.simulation"] = {"authoritative": False}
            output = Path(_require(flags, "output"))
            write_canonical_file(output / "decision.json", decision)
            write_text_file(output / "decision.summary.md", render_decision_summary(decision))
            write_json_file(output / "evidence-manifest.json", decision["evidenceManifest"])
            stdout(f"{'Simulation' if route['id'] == 'simulate' else 'Decision'} {decision['verdict']}.\n")
            return EXIT_CODES["pass"] if route["id"] == "simulate" else EXIT_CODES[decision["verdict"]]

        raise ValueError(f"Command route {route['id']} has no implementation.")
    except Exception as error:  # CLI boundary intentionally catches and classifies all errors.
        stderr(f"{error}\n")
        return _classify_error(error)


def main(argv: Sequence[str] | None = None) -> int:
    code = run_cli(list(sys.argv[1:] if argv is None else argv))
    if argv is None:
        raise SystemExit(code)
    return code


def _require(flags: Mapping[str, str | bool], name: str) -> str:
    value = flags.get(name)
    if not isinstance(value, str) or not value:
        raise ValueError(f"Missing --{name}")
    return value


def _optional(flags: Mapping[str, str | bool], name: str) -> str | None:
    value = flags.get(name)
    if value is True:
        raise ValueError(f"Missing --{name} value")
    return value if isinstance(value, str) else None


def _assert_selections(flags: Mapping[str, str | bool], config: Mapping[str, Any], *, require_policy: bool) -> None:
    for key in ("profile", "policy"):
        selection = _optional(flags, key)
        if not selection:
            if key == "policy" and require_policy:
                raise ValueError("Missing --policy")
            continue
        value = config[key]
        major = value["version"].split(".")[0]
        allowed = {value["id"], f"{value['id']}@{value['version']}", f"{value['id']}@{major}"}
        if selection not in allowed:
            raise ValueError(f"Unsupported {key} {selection}. Release zero supports {value['id']}@{value['version']}.")


def _derive_subject(values: Sequence[Any]) -> Mapping[str, Any]:
    subjects = [result.observation["subject"] for value in values if (result := validate_observation(value)).valid and result.observation]
    if not subjects:
        raise ValueError("Producer conformance requires --subject when no valid observation supplies one.")
    first = canonical_json(subjects[0])
    if any(canonical_json(item) != first for item in subjects):
        raise ValueError("Producer conformance observations contain multiple subjects")
    return subjects[0]


def _derive_received_at(values: Sequence[Any]) -> str:
    timestamps = sorted(result.observation["execution"]["completedAt"] for value in values if (result := validate_observation(value)).valid and result.observation)
    if not timestamps:
        raise ValueError("Producer conformance requires --received-at when no valid observation supplies one.")
    return timestamps[-1]


def _load_accepted(path: str) -> list[dict[str, Any]]:
    output = []
    for artifact in discover_json_artifacts(path):
        envelope = artifact["value"]
        if not isinstance(envelope, Mapping):
            raise ValueError(f"EVIDENCE_SCHEMA_INVALID: {artifact['path']}: envelope must be an object")
        if envelope.get("schema") != "l9.evidence-envelope" or envelope.get("schemaVersion") != "1.0.0":
            raise ValueError(f"EVIDENCE_SCHEMA_UNSUPPORTED: {artifact['path']}")
        if not verify_envelope_integrity(envelope):
            raise ValueError(f"EVIDENCE_PAYLOAD_DIGEST_MISMATCH: {artifact['path']}")
        structural = validate_observation(envelope.get("payload"))
        if not structural.valid or structural.observation is None:
            raise ValueError(f"EVIDENCE_SCHEMA_INVALID: {artifact['path']}: {'; '.join(structural.errors)}")
        observation = structural.observation
        if envelope.get("sourceObservationId") != observation["observationId"]:
            raise ValueError(f"EVIDENCE_LINEAGE_INVALID: {artifact['path']}")
        if canonical_json(envelope.get("subject")) != canonical_json(observation["subject"]):
            raise ValueError(f"EVIDENCE_SUBJECT_MISMATCH: {artifact['path']}")
        if envelope.get("producer", {}).get("id") != observation["producer"]["id"] or envelope.get("producer", {}).get("version") != observation["producer"]["version"]:
            raise ValueError(f"EVIDENCE_PRODUCER_UNKNOWN: {artifact['path']}")
        output.append({"envelope": dict(envelope), "observation": observation, "fingerprint": observation_fingerprint(observation)})
    return sorted(output, key=lambda item: item["envelope"]["evidenceId"])


def _classify_error(error: Exception) -> int:
    message = str(error)
    if "Policy" in message or "policy" in message or "profile" in message:
        return EXIT_CODES["policy"]
    if "EVIDENCE_" in message:
        return EXIT_CODES["admission"]
    if "signature" in message:
        return EXIT_CODES["signature"]
    return EXIT_CODES["input"]


if __name__ == "__main__":
    main()
