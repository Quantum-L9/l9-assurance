from __future__ import annotations

import re
from copy import deepcopy
from typing import Any, Mapping

_COMMIT = re.compile(r"^(?:[a-f0-9]{40}|[a-f0-9]{64})$")


def normalize_subject(input_value: Mapping[str, Any]) -> dict[str, Any]:
    if input_value.get("kind") != "git-revision":
        raise ValueError("EVIDENCE_SUBJECT_INVALID: only git-revision is supported")
    repository = input_value.get("repository")
    revision = input_value.get("revision")
    if not isinstance(repository, Mapping) or not isinstance(revision, Mapping):
        raise ValueError("EVIDENCE_SUBJECT_INVALID: malformed repository or commit")
    host = str(repository.get("host", "")).strip().lower()
    owner = str(repository.get("owner", "")).strip()
    name = re.sub(r"\.git$", "", str(repository.get("name", "")).strip(), flags=re.IGNORECASE)
    commit = str(revision.get("commit", "")).strip().lower()
    if not host or not owner or not name or _COMMIT.fullmatch(commit) is None:
        raise ValueError("EVIDENCE_SUBJECT_INVALID: malformed repository or commit")
    normalized_revision: dict[str, Any] = {"commit": commit}
    if "treeDigest" in revision:
        normalized_revision["treeDigest"] = deepcopy(revision["treeDigest"])
    normalized: dict[str, Any] = {
        "kind": "git-revision",
        "repository": {"host": host, "owner": owner, "name": name},
        "revision": normalized_revision,
    }
    metadata = input_value.get("metadata")
    if isinstance(metadata, Mapping):
        normalized["metadata"] = {str(key): str(metadata[key]) for key in sorted(metadata)}
    return normalized


def same_repository(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    a = normalize_subject(left)
    b = normalize_subject(right)
    return a["repository"] == b["repository"]


def same_revision(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    a = normalize_subject(left)
    b = normalize_subject(right)
    return a["repository"] == b["repository"] and a["revision"] == b["revision"]
