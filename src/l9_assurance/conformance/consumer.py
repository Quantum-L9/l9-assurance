from __future__ import annotations

import json
from typing import Any, Mapping

from l9_assurance.evaluator import escape_markdown, render_decision_summary, verify_decision
from l9_assurance.evidence import canonical_json, sha256_digest


def run_consumer_conformance(
    *,
    consumer_id: str,
    canonical_decision: Any,
    transported_decision_text: str,
    published_verdict: str,
    published_summary: str,
) -> dict[str, Any]:
    verification = verify_decision(canonical_decision)
    try:
        canonical = canonical_json(canonical_decision) + "\n"
        canonical_digest = sha256_digest(canonical_decision)["value"]
    except (TypeError, ValueError):
        canonical = ""
        canonical_digest = ""
    try:
        transported = json.loads(transported_decision_text)
        transported_digest = sha256_digest(transported)["value"]
    except (json.JSONDecodeError, TypeError, ValueError):
        transported_digest = ""
    expected_verdict = canonical_decision.get("verdict", "") if isinstance(canonical_decision, Mapping) and verification["valid"] else ""
    try:
        expected_summary = render_decision_summary(canonical_decision) if verification["valid"] else ""
    except (KeyError, TypeError):
        expected_summary = ""
    checks = [
        _check("byte-transport", bool(canonical) and transported_decision_text == canonical, "decision transported byte-for-byte"),
        _check("digest", bool(canonical_digest) and transported_digest == canonical_digest, "decision digest preserved"),
        _check("verdict", bool(expected_verdict) and published_verdict.lower() == expected_verdict, "published verdict matches"),
        _check("summary", bool(expected_summary) and published_summary == expected_summary, "summary is canonical projection"),
        _check("schema", verification["valid"], "decision schema supported"),
        _check("escaping", "<script>" not in published_summary, "summary escapes raw HTML"),
    ]
    return {"consumerId": consumer_id, "passed": all(item["passed"] for item in checks), "checks": checks}


def escape_consumer_text(value: str) -> str:
    return escape_markdown(value)


def _check(identity: str, passed: bool, message: str) -> dict[str, Any]:
    return {"id": identity, "passed": passed, "message": message}
