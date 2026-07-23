from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Callable, Mapping, Sequence

from l9_assurance.constants import (
    ASSURANCE_ID,
    ASSURANCE_REPOSITORY,
    ASSURANCE_VERSION,
    CANONICALIZATION_ALGORITHM,
    PLAN_SCHEMA,
    SCHEMA_VERSION,
)
from l9_assurance.contracts.schema import validate_instance
from l9_assurance.controls.resolve import resolve_profile
from l9_assurance.evaluator import evaluate, verify_decision
from l9_assurance.evidence import InMemoryReplayStore, admit_observations, sha256_digest
from l9_assurance.policy import resolve_policy


class AssuranceEngine:
    def __init__(
        self,
        configuration: Mapping[str, Any],
        *,
        clock: Callable[[], str] | None = None,
        replay_store: Any | None = None,
        evaluator: Mapping[str, Any] | None = None,
    ) -> None:
        self.configuration = configuration
        self.profile = resolve_profile(configuration["profile"], configuration["controls"])
        self.clock = clock or (lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        self.replay_store = replay_store or InMemoryReplayStore()
        self.evaluator = evaluator or {"id": ASSURANCE_ID, "version": ASSURANCE_VERSION, "repository": ASSURANCE_REPOSITORY}

    def plan(self, subject: Mapping[str, Any]) -> dict[str, Any]:
        checks = {item["id"]: item for item in self.configuration["checkRegistry"]["checks"]}
        producers = {item["id"]: item for item in self.configuration["producerRegistry"]["producers"]}
        producer_ids: set[str] = set()
        check_ids: set[str] = set()
        planned_controls: list[dict[str, Any]] = []
        for control in self.profile["controls"]:
            requirements: list[dict[str, Any]] = []
            for requirement in control.get("evidenceRequirements", []):
                check = checks.get(requirement["check"])
                producer = producers.get(requirement["producer"])
                if check is None or producer is None:
                    raise ValueError(f"Plan references unregistered evidence requirement {requirement}")
                if check["owner"] != producer["id"]:
                    raise ValueError(f"Plan check {check['id']} owner mismatch")
                producer_ids.add(producer["id"])
                check_ids.add(check["id"])
                freshness = requirement.get("freshness", control.get("freshness", {"mode": "revision-bound"}))
                item = {
                    "producer": producer["id"],
                    "check": check["id"],
                    "checkVersion": check["version"],
                    "outputSchema": check["output_schema"],
                    "acceptedExecutionStatuses": list(requirement["acceptedExecutionStatus"]),
                    "cardinality": deepcopy(requirement["cardinality"]),
                    "subjectBinding": deepcopy(requirement["subjectBinding"]),
                    "configurationDigestRequired": check["configuration_digest_required"],
                    "freshness": {"mode": freshness["mode"]},
                }
                if "maximumAgeSeconds" in freshness:
                    item["freshness"]["maximumAgeSeconds"] = freshness["maximumAgeSeconds"]
                requirements.append(item)
            waiver = control.get("waiver", {"allowed": False})
            planned_waiver = {"allowed": bool(waiver.get("allowed", False)), "requiredRoles": list(waiver.get("requiredRoles", []))}
            if "maximumDurationSeconds" in waiver:
                planned_waiver["maximumDurationSeconds"] = waiver["maximumDurationSeconds"]
            planned_controls.append({"id": control["id"], "version": control["version"], "severity": control["severity"], "evidenceRequirements": requirements, "waiver": planned_waiver})
        required_producers = [
            {
                "id": producers[item]["id"],
                "repository": producers[item]["repository"],
                "authorizationStatus": producers[item]["authorization_status"],
                "candidateVersionRange": producers[item].get("candidate_version_range"),
                "allowedVersions": producers[item].get("allowed_versions"),
                "subjectKinds": sorted(producers[item]["subject_kinds"]),
                "checks": sorted(producers[item]["checks"]),
            }
            for item in sorted(producer_ids)
        ]
        required_checks = [
            {
                "id": checks[item]["id"],
                "version": checks[item]["version"],
                "owner": checks[item]["owner"],
                "outputSchema": checks[item]["output_schema"],
                "deterministic": checks[item]["deterministic"],
                "revisionBound": checks[item]["revision_bound"],
                "acceptedExecutionStatuses": list(checks[item]["accepted_execution_statuses"]),
                "configurationDigestRequired": checks[item]["configuration_digest_required"],
            }
            for item in sorted(check_ids)
        ]
        waiver_rules = []
        for control in self.profile["controls"]:
            waiver = control.get("waiver", {"allowed": False})
            waiver_rules.append({"controlId": control["id"], "allowed": bool(waiver.get("allowed", False)), "requiredRoles": list(waiver.get("requiredRoles", [])), "maximumDurationSeconds": waiver.get("maximumDurationSeconds")})
        controls_for_digest = sorted(self.profile["controls"], key=lambda item: (item["id"], item["version"]))
        preimage = {
            "schema": PLAN_SCHEMA,
            "schemaVersion": SCHEMA_VERSION,
            "subject": deepcopy(dict(subject)),
            "profile": {"id": self.profile["profile"]["id"], "version": self.profile["profile"]["version"], "digest": sha256_digest(self.profile["profile"])},
            "policy": {"id": self.configuration["policy"]["id"], "version": self.configuration["policy"]["version"], "digest": sha256_digest(self.configuration["policy"])},
            "protocol": {"assuranceVersion": ASSURANCE_VERSION, "schemaVersion": SCHEMA_VERSION, "canonicalization": CANONICALIZATION_ALGORITHM, "digestAlgorithm": "sha256", "bundleDigest": deepcopy(self.configuration["protocolBundleDigest"])},
            "controls": planned_controls,
            "requiredProducers": required_producers,
            "requiredChecks": required_checks,
            "waiverRules": sorted(waiver_rules, key=lambda item: item["controlId"]),
            "sourceDigests": {"producerRegistry": sha256_digest(self.configuration["producerRegistry"]), "checkRegistry": sha256_digest(self.configuration["checkRegistry"]), "controls": sha256_digest(controls_for_digest)},
        }
        plan_digest = sha256_digest(preimage)
        plan = {**preimage, "planId": f"plan_{plan_digest['value'][:40]}", "planDigest": plan_digest}
        errors = validate_instance(plan, "assurance-plan.schema.json")
        if errors:
            raise ValueError("Generated plan failed schema validation: " + "; ".join(errors))
        return plan

    def admit(self, subject: Mapping[str, Any], observations: Sequence[Any], *, received_at: str | None = None, channel: str = "local") -> dict[str, Any]:
        return admit_observations(observations, {"subject": subject, "producerRegistry": self.configuration["producerRegistry"], "checkRegistry": self.configuration["checkRegistry"], "receivedAt": received_at or self.clock(), "channel": channel, "replayStore": self.replay_store})

    def evaluate(self, subject: Mapping[str, Any], accepted_evidence: Sequence[Mapping[str, Any]], *, evaluation_time: str | None = None, decision_id: str | None = None, waivers: Sequence[Mapping[str, Any]] = (), overlays: Sequence[Mapping[str, Any]] = (), admission_report: Mapping[str, Any] | None = None, previous_decision_id: str | None = None) -> dict[str, Any]:
        timestamp = evaluation_time or self.clock()
        policy = resolve_policy(self.configuration["policy"], overlays, waivers)
        identity = decision_id or _derive_decision_id(subject, self.profile, policy, accepted_evidence, timestamp)
        context: dict[str, Any] = {"evaluationTime": timestamp, "decisionId": identity, "evaluator": deepcopy(self.evaluator)}
        if previous_decision_id:
            context["previousDecisionId"] = previous_decision_id
        if admission_report and admission_report.get("unknowns"):
            context["admissionUnknowns"] = deepcopy(admission_report["unknowns"])
        return evaluate(subject, self.profile, policy, accepted_evidence, context)

    def verify(self, decision: Any) -> dict[str, Any]:
        return verify_decision(decision)


def verify_plan(plan: Any) -> dict[str, Any]:
    reasons: list[str] = []
    if not isinstance(plan, Mapping):
        return {"valid": False, "reasons": ["Plan must be an object."]}
    reasons.extend(validate_instance(plan, "assurance-plan.schema.json"))
    plan_id = plan.get("planId") if isinstance(plan.get("planId"), str) else None
    supplied = plan.get("planDigest") if isinstance(plan.get("planDigest"), Mapping) else None
    digest = None
    if supplied and supplied.get("algorithm") == "sha256":
        preimage = {key: deepcopy(value) for key, value in plan.items() if key not in {"planId", "planDigest"}}
        calculated = sha256_digest(preimage)
        digest = calculated["value"]
        if calculated != supplied:
            reasons.append("Plan digest mismatch.")
        if plan_id != f"plan_{calculated['value'][:40]}":
            reasons.append("Plan identifier mismatch.")
    else:
        reasons.append("Missing or invalid planDigest.")
    report: dict[str, Any] = {"valid": not reasons, "reasons": sorted(set(reasons))}
    if plan_id:
        report["planId"] = plan_id
    if digest:
        report["digest"] = digest
    return report


def _derive_decision_id(subject: Mapping[str, Any], profile: Mapping[str, Any], policy: Mapping[str, Any], evidence: Sequence[Mapping[str, Any]], evaluation_time: str) -> str:
    digest = sha256_digest({"subject": subject, "profile": profile["profile"], "policy": policy["policy"], "evidence": sorted(item["envelope"]["evidenceId"] for item in evidence), "evaluationTime": evaluation_time})
    return f"dec_{digest['value'][:40]}"
