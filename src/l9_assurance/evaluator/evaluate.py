from __future__ import annotations

from copy import deepcopy
from typing import Any, Mapping, Sequence

from l9_assurance.constants import ASSURANCE_ID, ASSURANCE_REPOSITORY, ASSURANCE_VERSION
from l9_assurance.contracts.time import require_rfc3339_instant
from l9_assurance.controls.evaluate import assess_control
from l9_assurance.evidence.digest import sha256_digest
from l9_assurance.policy.waiver import find_active_waiver


def evaluate(
    subject: Mapping[str, Any],
    profile: Mapping[str, Any],
    policy: Mapping[str, Any],
    evidence: Sequence[Mapping[str, Any]],
    context: Mapping[str, Any],
) -> dict[str, Any]:
    decision_id = context.get("decisionId")
    if not isinstance(decision_id, str) or not decision_id.strip():
        raise ValueError("decisionId is required")
    evaluation_time = require_rfc3339_instant(context.get("evaluationTime"), "evaluationTime")
    results: list[dict[str, Any]] = []
    unknowns: list[dict[str, Any]] = [deepcopy(dict(x)) for x in context.get("admissionUnknowns", [])]
    applied_waivers: list[dict[str, Any]] = []
    by_control: dict[str, dict[str, Any]] = {}
    resolved_policy = policy["policy"]

    for original in profile["controls"]:
        control = _apply_override(original, resolved_policy)
        if control is None:
            disabled = _control_result(
                original,
                "not-applicable",
                evaluation_time,
                [],
                [],
                [],
                [("CONTROL_POLICY_DISABLED", "control disabled by resolved policy")],
            )
            results.append(disabled)
            by_control[original["id"]] = disabled
            continue

        blocked = next(
            (
                dependency
                for dependency in control.get("dependencies", [])
                if by_control.get(dependency["id"], {}).get("status", "indeterminate")
                not in {"pass", "conditional"}
            ),
            None,
        )
        if blocked is not None:
            unknown = _create_unknown(
                control,
                "external-dependency",
                f"Dependency {blocked['id']} did not complete successfully.",
            )
            unknowns.append(unknown)
            result = _control_result(
                control,
                "indeterminate",
                evaluation_time,
                [],
                [],
                [unknown["unknownId"]],
                [("CONTROL_EVIDENCE_MISSING", f"dependency {blocked['id']} is unresolved")],
            )
            results.append(result)
            by_control[control["id"]] = result
            continue

        effective = deepcopy(control)
        if effective["evaluation"]["type"] == "no-matching-findings":
            effective["evaluation"]["mandatoryFindingSeverities"] = list(
                resolved_policy["mandatoryFindingSeverities"]
            )
        assessment = assess_control(effective, evidence, subject)
        status = assessment["status"]
        waiver_refs: list[str] = []
        unknown_refs: list[str] = []
        reasons = [(item["code"], item["message"]) for item in assessment["reasons"]]

        if status == "fail":
            waiver = find_active_waiver(
                policy["waivers"], control, subject, resolved_policy, evaluation_time
            )
            if waiver is not None:
                status = "conditional"
                waiver_refs.append(waiver["waiverId"])
                applied_waivers.append(waiver)
                reasons.append(
                    ("CONTROL_WAIVER_APPLIED", f"active waiver {waiver['waiverId']} applied")
                )

        if status == "indeterminate":
            handling = resolved_policy["unknownHandling"][
                "mandatory" if control["severity"] == "mandatory" else "advisory"
            ]
            if handling == "fail":
                status = "fail"
                reasons.append(
                    (
                        "CONTROL_POLICY_UNKNOWN_FAIL",
                        f"policy converts unresolved mandatory control {control['id']} to fail",
                    )
                )
            elif handling != "ignore":
                unknown = _create_unknown(
                    control,
                    assessment.get("unknownCategory", "other"),
                    f"Control {control['id']} could not be established.",
                )
                unknowns.append(unknown)
                unknown_refs.append(unknown["unknownId"])

        result = _control_result(
            control,
            status,
            evaluation_time,
            assessment["evidenceRefs"],
            waiver_refs,
            unknown_refs,
            reasons,
        )
        results.append(result)
        by_control[control["id"]] = result

    results.sort(key=lambda item: item["controlId"])
    verdict = reduce_verdict(results)
    claims = _build_claims(profile, results, verdict)
    manifest = sorted(
        (
            {
                "evidenceId": item["envelope"]["evidenceId"],
                "digest": deepcopy(item["envelope"]["payloadDigest"]),
                "evidenceType": item["envelope"]["evidenceType"],
            }
            for item in evidence
        ),
        key=lambda item: item["evidenceId"],
    )
    evaluator = deepcopy(
        context.get("evaluator")
        or {"id": ASSURANCE_ID, "version": ASSURANCE_VERSION, "repository": ASSURANCE_REPOSITORY}
    )
    decision: dict[str, Any] = {
        "schema": "l9.assurance-decision",
        "schemaVersion": "1.0.0",
        "decisionId": decision_id,
        "subject": deepcopy(dict(subject)),
        "profile": {
            "id": profile["profile"]["id"],
            "version": profile["profile"]["version"],
            "digest": sha256_digest(profile["profile"]),
        },
        "policy": {
            "id": resolved_policy["id"],
            "version": resolved_policy["version"],
            "digest": sha256_digest(resolved_policy),
        },
        "verdict": verdict,
        "controlResults": results,
        "claims": claims,
        "evidenceManifest": manifest,
        "waivers": [
            {"waiverId": item["waiverId"], "controlId": item["controlId"]}
            for item in _unique_by(applied_waivers, "waiverId")
        ],
        "unknowns": _unique_by(unknowns, "unknownId"),
        "dimensions": _dimensions(results, profile["controls"], evidence),
        "issuedAt": evaluation_time,
        "evaluator": evaluator,
    }
    if context.get("previousDecisionId"):
        decision["supersedes"] = context["previousDecisionId"]
    return decision


def reduce_verdict(results: Sequence[Mapping[str, Any]]) -> str:
    mandatory = [
        item
        for item in results
        if item.get("severity") == "mandatory" and item.get("status") != "not-applicable"
    ]
    if any(item["status"] == "fail" for item in mandatory):
        return "fail"
    if any(item["status"] == "indeterminate" for item in mandatory):
        return "indeterminate"
    if any(item["status"] == "conditional" for item in mandatory):
        return "conditional"
    return "pass"


def _apply_override(control: Mapping[str, Any], policy: Mapping[str, Any]) -> dict[str, Any] | None:
    override = next(
        (item for item in policy.get("controlOverrides", []) if item.get("controlId") == control["id"]),
        None,
    )
    if override and override.get("enabled") is False:
        return None
    output = deepcopy(dict(control))
    if not override:
        return output
    if override.get("severity"):
        output["severity"] = override["severity"]
    if "waiverAllowed" in override:
        output.setdefault("waiver", {"allowed": False})["allowed"] = bool(
            override["waiverAllowed"]
        )
    return output


def _build_claims(
    profile: Mapping[str, Any], results: Sequence[Mapping[str, Any]], verdict: str
) -> list[dict[str, Any]]:
    by_id = {item["controlId"]: item for item in results}
    output: list[dict[str, Any]] = []
    for control in profile["controls"]:
        status = by_id.get(control["id"], {}).get("status", "fail")
        output.append(
            {
                "claimId": control["claim"],
                "claimVersion": "1.0.0",
                "status": _claim_status(status),
                "controlRefs": [control["id"]],
            }
        )
    aggregate_status = {
        "pass": "supported",
        "conditional": "conditional",
        "indeterminate": "indeterminate",
        "fail": "unsupported",
    }[verdict]
    refs = sorted(item["controlId"] for item in results)
    for claim in profile["profile"]["outputClaims"]:
        output.append(
            {
                "claimId": claim["id"],
                "claimVersion": claim["version"],
                "status": aggregate_status,
                "controlRefs": refs,
            }
        )
    return sorted(output, key=lambda item: item["claimId"])


def _claim_status(status: str) -> str:
    return {
        "pass": "supported",
        "conditional": "conditional",
        "indeterminate": "indeterminate",
    }.get(status, "unsupported")


def _dimensions(
    results: Sequence[Mapping[str, Any]],
    controls: Sequence[Mapping[str, Any]],
    evidence: Sequence[Mapping[str, Any]],
) -> dict[str, float]:
    applicable = [item for item in results if item["status"] != "not-applicable"]
    passed = sum(item["status"] == "pass" for item in applicable)
    conditional = sum(item["status"] == "conditional" for item in applicable)
    required = {
        requirement["check"]
        for control in controls
        for requirement in control.get("evidenceRequirements", [])
    }
    present = {item["observation"]["check"]["id"] for item in evidence}
    completeness = 1.0 if not required else len(required & present) / len(required)
    return {
        "controlSatisfaction": round(
            1.0 if not applicable else (passed + conditional * 0.5) / len(applicable), 4
        ),
        "evidenceCompleteness": round(completeness, 4),
        "evidenceFreshness": 1.0 if evidence else 0.0,
        "producerTrust": 1.0 if evidence else 0.0,
    }


def _create_unknown(control: Mapping[str, Any], category: str, description: str) -> dict[str, Any]:
    slug = "_".join(filter(None, __import__("re").split(r"[^a-z0-9]+", control["id"].lower())))
    return {
        "unknownId": f"unknown_{slug}",
        "category": category,
        "description": description,
        "impact": "decision" if control["severity"] == "mandatory" else "advisory",
        "relatedControls": [control["id"]],
        "resolvableBy": [f"provide admissible evidence for {control['id']}"],
    }


def _control_result(
    control: Mapping[str, Any],
    status: str,
    evaluated_at: str,
    evidence_refs: Sequence[str],
    waiver_refs: Sequence[str],
    unknown_refs: Sequence[str],
    reasons: Sequence[tuple[str, str]],
) -> dict[str, Any]:
    return {
        "controlId": control["id"],
        "controlVersion": control["version"],
        "status": status,
        "severity": control["severity"],
        "evidenceRefs": sorted(set(evidence_refs)),
        "waiverRefs": sorted(set(waiver_refs)),
        "unknownRefs": sorted(set(unknown_refs)),
        "reasons": [
            {"code": code, "message": message}
            for code, message in sorted(set(reasons), key=lambda item: (item[0], item[1]))
        ],
        "evaluatedAt": evaluated_at,
    }


def _unique_by(values: Sequence[Mapping[str, Any]], key: str) -> list[dict[str, Any]]:
    mapped = {str(item[key]): deepcopy(dict(item)) for item in values}
    return [mapped[item] for item in sorted(mapped)]
