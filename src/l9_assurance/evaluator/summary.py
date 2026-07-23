from __future__ import annotations

from collections.abc import Mapping
from typing import Any


def render_decision_summary(decision: Mapping[str, Any]) -> str:
    mandatory = [item for item in decision["controlResults"] if item["severity"] == "mandatory"]
    subject = decision["subject"]
    lines = [
        "# L9 Assurance Decision",
        "",
        f"**Verdict:** {decision['verdict'].upper()}",
        "**Subject:** "
        + escape_markdown(
            f"{subject['repository']['owner']}/{subject['repository']['name']}@{subject['revision']['commit']}"
        ),
        "**Profile:** "
        + escape_markdown(f"{decision['profile']['id']}@{decision['profile']['version']}"),
        "**Policy:** "
        + escape_markdown(f"{decision['policy']['id']}@{decision['policy']['version']}"),
        f"**Decision:** {escape_markdown(decision['decisionId'])}",
        "",
        "## Mandatory controls",
    ]
    for result in mandatory:
        detail = result["reasons"][0]["message"] if result.get("reasons") else ""
        suffix = f"; {escape_markdown(detail)}" if detail else ""
        lines.append(
            f"- {result['status'].upper()} - {escape_markdown(result['controlId'])}{suffix}"
        )
    lines.extend(
        ["", "## Evidence", f"Accepted: {len(decision['evidenceManifest'])}", "", "## Unknowns"]
    )
    if not decision["unknowns"]:
        lines.append("- None")
    else:
        lines.extend(f"- {escape_markdown(item['description'])}" for item in decision["unknowns"])
    lines.extend(["", "## Waivers"])
    if not decision["waivers"]:
        lines.append("- None")
    else:
        lines.extend(
            f"- {escape_markdown(item['waiverId'])} for {escape_markdown(item['controlId'])}"
            for item in decision["waivers"]
        )
    return "\n".join(lines) + "\n"


def escape_markdown(value: str) -> str:
    replacements = (
        ("\\", "\\\\"),
        ("`", "\\`"),
        ("*", "\\*"),
        ("_", "\\_"),
        ("[", "\\["),
        ("]", "\\]"),
        ("<", "&lt;"),
        (">", "&gt;"),
    )
    for old, new in replacements:
        value = value.replace(old, new)
    return value
