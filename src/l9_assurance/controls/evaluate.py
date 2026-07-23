from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from l9_assurance.evidence.semver import compare_semver


def assess_control(
    control: Mapping[str, Any],
    evidence: Sequence[Mapping[str, Any]],
    subject: Mapping[str, Any],
) -> dict[str, Any]:
    applicability = control.get("applicability")
    if isinstance(applicability, Mapping) and applicability.get("subjectKind") != subject.get(
        "kind"
    ):
        return _result(
            "not-applicable",
            [],
            [("CONTROL_NOT_APPLICABLE", "subject kind does not match control applicability")],
        )
    evaluation_type = control["evaluation"]["type"]
    if evaluation_type == "exact-subject-consistency":
        return _assess_subject_consistency(evidence, subject)
    matches = [
        item
        for requirement in control["evidenceRequirements"]
        for item in evidence
        if _matches_requirement(item, requirement)
    ]
    refs = _unique(item["envelope"]["evidenceId"] for item in matches)
    if evaluation_type == "no-matching-findings":
        return _assess_findings(control, matches, refs)
    return _assess_requirements(control, evidence, refs)


def _assess_requirements(
    control: Mapping[str, Any],
    evidence: Sequence[Mapping[str, Any]],
    all_refs: list[str],
) -> dict[str, Any]:
    reasons: list[tuple[str, str]] = []
    status = "pass"
    missing = False
    for requirement in control["evidenceRequirements"]:
        matches = [item for item in evidence if _matches_requirement(item, requirement)]
        minimum = requirement["cardinality"]["minimum"]
        maximum = requirement["cardinality"]["maximum"]
        if len(matches) < minimum or len(matches) > maximum:
            status = "indeterminate"
            missing = missing or len(matches) < minimum
            reasons.append(
                (
                    "CONTROL_CARDINALITY_VIOLATION",
                    f"{requirement['check']} cardinality {len(matches)} outside {minimum}..{maximum}",
                )
            )
            continue
        unauthorized = [
            item
            for item in matches
            if item["observation"]["execution"]["status"]
            not in requirement["acceptedExecutionStatus"]
        ]
        if unauthorized:
            if status != "fail":
                status = "indeterminate"
            reasons.append(
                (
                    "CONTROL_EVIDENCE_ERROR",
                    f"{requirement['check']} reported a status not admitted by the control",
                )
            )
            continue
        statuses = [item["observation"]["execution"]["status"] for item in matches]
        if "failed" in statuses:
            status = "fail"
            reasons.append(
                ("CONTROL_POSITIVE_FAILURE", f"{requirement['check']} positively reported failure")
            )
        elif "error" in statuses:
            if status != "fail":
                status = "indeterminate"
            reasons.append(
                ("CONTROL_EVIDENCE_ERROR", f"{requirement['check']} reported execution error")
            )
        elif "skipped" in statuses:
            if status != "fail":
                status = "indeterminate"
            reasons.append(("CONTROL_EVIDENCE_SKIPPED", f"{requirement['check']} was skipped"))
        else:
            reasons.append(("CONTROL_REQUIREMENT_SATISFIED", f"{requirement['check']} passed"))
    result = {
        "status": status,
        "evidenceRefs": all_refs,
        "reasons": _sort_reasons(reasons),
    }
    if status == "indeterminate":
        result["unknownCategory"] = "missing-evidence" if missing else "environment-uncertainty"
    return result


def _assess_findings(
    control: Mapping[str, Any], matches: Sequence[Mapping[str, Any]], refs: list[str]
) -> dict[str, Any]:
    if not matches:
        return {
            "status": "indeterminate",
            "evidenceRefs": [],
            "reasons": [
                {
                    "code": "CONTROL_EVIDENCE_MISSING",
                    "message": "mandatory findings observation is missing",
                }
            ],
            "unknownCategory": "missing-evidence",
        }
    unauthorized = False
    for item in matches:
        requirement = next(
            (
                candidate
                for candidate in control["evidenceRequirements"]
                if candidate["producer"] == item["observation"]["producer"]["id"]
                and candidate["check"] == item["observation"]["check"]["id"]
            ),
            None,
        )
        if (
            requirement is None
            or item["observation"]["execution"]["status"]
            not in requirement["acceptedExecutionStatus"]
        ):
            unauthorized = True
            break
    if unauthorized:
        return {
            "status": "indeterminate",
            "evidenceRefs": refs,
            "reasons": [
                {
                    "code": "CONTROL_EVIDENCE_ERROR",
                    "message": "mandatory findings status is not admitted by the control",
                }
            ],
            "unknownCategory": "environment-uncertainty",
        }
    severities = set(control["evaluation"].get("mandatoryFindingSeverities", ["critical", "high"]))
    blocking = [
        finding
        for item in matches
        for finding in item["observation"]["findings"]
        if finding["disposition"] == "open" and finding["severity"] in severities
    ]
    if blocking:
        return _result(
            "fail",
            refs,
            [
                (
                    "CONTROL_MANDATORY_FINDING_PRESENT",
                    f"{len(blocking)} open mandatory finding(s) present",
                )
            ],
        )
    if any(item["observation"]["execution"]["status"] != "passed" for item in matches):
        return {
            "status": "indeterminate",
            "evidenceRefs": refs,
            "reasons": [
                {
                    "code": "CONTROL_EVIDENCE_ERROR",
                    "message": "mandatory findings check did not positively establish absence",
                }
            ],
            "unknownCategory": "environment-uncertainty",
        }
    return _result(
        "pass",
        refs,
        [("CONTROL_REQUIREMENT_SATISFIED", "no open mandatory findings were reported")],
    )


def _assess_subject_consistency(
    evidence: Sequence[Mapping[str, Any]], subject: Mapping[str, Any]
) -> dict[str, Any]:
    if not evidence:
        return {
            "status": "indeterminate",
            "evidenceRefs": [],
            "reasons": [
                {
                    "code": "CONTROL_EVIDENCE_MISSING",
                    "message": "no admitted evidence exists for consistency evaluation",
                }
            ],
            "unknownCategory": "missing-evidence",
        }
    inconsistent = []
    for item in evidence:
        item_subject = item["observation"]["subject"]
        if (
            item_subject["repository"]["host"].lower() != subject["repository"]["host"].lower()
            or item_subject["repository"]["owner"] != subject["repository"]["owner"]
            or item_subject["repository"]["name"].removesuffix(".git")
            != subject["repository"]["name"].removesuffix(".git")
            or item_subject["revision"]["commit"].lower() != subject["revision"]["commit"].lower()
        ):
            inconsistent.append(item)
    refs = _unique(item["envelope"]["evidenceId"] for item in evidence)
    if inconsistent:
        return _result(
            "fail",
            refs,
            [
                (
                    "CONTROL_POSITIVE_FAILURE",
                    f"{len(inconsistent)} admitted evidence item(s) reference a different subject",
                )
            ],
        )
    return _result(
        "pass",
        refs,
        [
            (
                "CONTROL_SUBJECT_CONSISTENT",
                "all admitted evidence references the exact subject revision",
            )
        ],
    )


def _matches_requirement(item: Mapping[str, Any], requirement: Mapping[str, Any]) -> bool:
    observation = item["observation"]
    return (
        observation["producer"]["id"] == requirement["producer"]
        and observation["check"]["id"] == requirement["check"]
        and compare_semver(
            observation["check"]["version"], requirement.get("minimumCheckVersion", "0.0.0")
        )
        >= 0
    )


def _result(status: str, refs: Sequence[str], reasons: Sequence[tuple[str, str]]) -> dict[str, Any]:
    return {"status": status, "evidenceRefs": _unique(refs), "reasons": _sort_reasons(reasons)}


def _sort_reasons(reasons: Sequence[tuple[str, str]]) -> list[dict[str, str]]:
    return [
        {"code": code, "message": message}
        for code, message in sorted(reasons, key=lambda item: (item[0], item[1]))
    ]


def _unique(values: Sequence[str] | Any) -> list[str]:
    return sorted(set(values))
