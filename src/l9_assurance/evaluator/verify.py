from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any

from l9_assurance.contracts.schema import validate_instance
from l9_assurance.contracts.time import parse_rfc3339_instant
from l9_assurance.evidence.canonical import canonical_json
from l9_assurance.evidence.digest import sha256_digest

from .evaluate import reduce_verdict

_SEMVER = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$")


def verify_decision(value: Any) -> dict[str, Any]:
    reasons: list[str] = []
    if not isinstance(value, Mapping):
        return {
            "valid": False,
            "signatureStatus": "not-present",
            "reasons": ["decision must be object"],
        }
    reasons.extend(validate_instance(value, "decision.schema.json"))
    _validate_cross_references(value, reasons)
    try:
        canonical_json(value)
        digest = sha256_digest(value)["value"]
    except (TypeError, ValueError) as error:
        reasons.append(str(error))
        digest = None
    signature = value.get("signature") if isinstance(value.get("signature"), Mapping) else None
    signature_status = "not-present"
    if signature:
        algorithm = signature.get("algorithm")
        if algorithm == "TEST_HMAC_SHA256":
            signature_status = "invalid"
            reasons.append("test signing algorithm is rejected by production verification")
        else:
            signature_status = "unsupported"
            reasons.append(f"unsupported signature algorithm {algorithm}")
    report: dict[str, Any] = {
        "valid": not reasons,
        "signatureStatus": signature_status,
        "reasons": sorted(set(reasons)),
    }
    if isinstance(value.get("decisionId"), str):
        report["decisionId"] = value["decisionId"]
    if digest:
        report["digest"] = digest
    return report


def _validate_cross_references(value: Mapping[str, Any], reasons: list[str]) -> None:
    for field in ("issuedAt",):
        if field in value and parse_rfc3339_instant(value[field]) is None:
            reasons.append(f"$.{field} must be an RFC3339 instant with an explicit known offset")
    results = _as_list(value.get("controlResults"))
    control_ids = _unique_ids(results, "controlId", "control result", reasons)
    evidence = _as_list(value.get("evidenceManifest"))
    evidence_ids = _unique_ids(evidence, "evidenceId", "evidence", reasons)
    waivers = _as_list(value.get("waivers"))
    waiver_ids = _unique_ids(waivers, "waiverId", "waiver", reasons)
    unknowns = _as_list(value.get("unknowns"))
    unknown_ids = _unique_ids(unknowns, "unknownId", "unknown", reasons)
    claims = _as_list(value.get("claims"))
    claim_keys: set[str] = set()
    for index, claim in enumerate(claims):
        if not isinstance(claim, Mapping):
            continue
        key = f"{claim.get('claimId')}@{claim.get('claimVersion')}"
        if key in claim_keys:
            reasons.append(f"duplicate claim result {key}")
        claim_keys.add(key)
        if isinstance(claim.get("claimVersion"), str) and not _SEMVER.fullmatch(
            claim["claimVersion"]
        ):
            reasons.append(f"$.claims[{index}].claimVersion must be semantic")
        for ref in claim.get("controlRefs", []):
            if ref not in control_ids:
                reasons.append(f"$.claims[{index}] references missing control {ref}")
    projection: list[dict[str, Any]] = []
    for index, result in enumerate(results):
        if not isinstance(result, Mapping):
            continue
        if parse_rfc3339_instant(result.get("evaluatedAt")) is None:
            reasons.append(
                f"$.controlResults[{index}].evaluatedAt must be an RFC3339 instant with an explicit known offset"
            )
        for ref in result.get("evidenceRefs", []):
            if ref not in evidence_ids:
                reasons.append(
                    f"$.controlResults {result.get('controlId')} references missing evidence {ref}"
                )
        for ref in result.get("waiverRefs", []):
            if ref not in waiver_ids:
                reasons.append(
                    f"$.controlResults {result.get('controlId')} references missing waiver {ref}"
                )
        for ref in result.get("unknownRefs", []):
            if ref not in unknown_ids:
                reasons.append(
                    f"$.controlResults {result.get('controlId')} references missing unknown {ref}"
                )
        projection.append(dict(result))
    supplied = value.get("verdict")
    if projection and supplied in {"pass", "fail", "conditional", "indeterminate"}:
        reduced = reduce_verdict(projection)
        if reduced != supplied:
            reasons.append(f"$.verdict {supplied} does not match control reduction {reduced}")


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _unique_ids(values: Sequence[Any], key: str, label: str, reasons: list[str]) -> set[str]:
    output: set[str] = set()
    for item in values:
        if not isinstance(item, Mapping) or not isinstance(item.get(key), str):
            continue
        identity = item[key]
        if identity in output:
            reasons.append(f"duplicate {label} {identity}")
        output.add(identity)
    return output
