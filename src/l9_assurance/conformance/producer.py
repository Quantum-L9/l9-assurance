from __future__ import annotations

from typing import Any, Mapping, Sequence

from l9_assurance.evidence import admit_observations, validate_observation


def run_producer_conformance(
    values: Sequence[Any],
    *,
    producer_id: str,
    subject: Mapping[str, Any],
    producer_registry: Mapping[str, Any],
    check_registry: Mapping[str, Any],
    received_at: str,
    maximum_age_seconds_by_check: Mapping[str, int] | None = None,
    limits: Mapping[str, int] | None = None,
) -> dict[str, Any]:
    cases: list[dict[str, Any]] = []
    for index, value in enumerate(values):
        validation = validate_observation(value)
        producer_matches = bool(
            validation.observation
            and validation.observation["producer"]["id"] == producer_id
        )
        reasons = list(validation.errors)
        if not producer_matches:
            reasons.append(f"Expected producer {producer_id}.")
        cases.append(
            {
                "index": index,
                "status": "pass" if validation.valid and producer_matches else "fail",
                "reasons": reasons,
            }
        )
    context: dict[str, Any] = {
        "subject": subject,
        "producerRegistry": producer_registry,
        "checkRegistry": check_registry,
        "receivedAt": received_at,
        "channel": "local",
    }
    if maximum_age_seconds_by_check is not None:
        context["maximumAgeSecondsByCheck"] = maximum_age_seconds_by_check
    if limits is not None:
        context["limits"] = limits
    admission = admit_observations(values, context)
    passed = bool(values) and all(item["status"] == "pass" for item in cases) and admission["rejectedCount"] == 0 and admission["quarantinedCount"] == 0
    return {"producerId": producer_id, "passed": passed, "cases": cases, "admission": admission}


def run_producer_admission_cases(
    cases: Sequence[Mapping[str, Any]],
    **options: Any,
) -> dict[str, Any]:
    admission = admit_observations(
        [item["value"] for item in cases],
        {
            "subject": options["subject"],
            "producerRegistry": options["producer_registry"],
            "checkRegistry": options["check_registry"],
            "receivedAt": options["received_at"],
            "channel": "local",
            **({"maximumAgeSecondsByCheck": options["maximum_age_seconds_by_check"]} if options.get("maximum_age_seconds_by_check") else {}),
            **({"limits": options["limits"]} if options.get("limits") else {}),
        },
    )
    results = []
    for index, item in enumerate(cases):
        actual = admission["results"][index]
        codes = [reason["code"] for reason in actual["reasons"]]
        expected_reason = item.get("expectedReason")
        results.append(
            {
                "id": item["id"],
                "passed": actual["status"] == item["expectedStatus"] and (expected_reason is None or expected_reason in codes),
                "actualStatus": actual["status"],
                "reasonCodes": codes,
            }
        )
    return {"producerId": options["producer_id"], "passed": all(item["passed"] for item in results), "cases": results, "admission": admission}
