// Generated from schemas/v1 by scripts/generate-bindings.mjs. Do not edit.

export interface ArtifactReference {
  readonly name: string;
  readonly digest: Digest;
  readonly mediaType?: string;
  readonly path?: string;
  readonly uri?: string;
}

export interface AuditBundleManifest {
  readonly schema: "l9.audit-bundle-manifest";
  readonly schemaVersion: "1.0.0";
  readonly bundleId: string;
  readonly decisionId: string;
  readonly completeness: "complete" | "partial" | "review-limited";
  readonly entries: readonly {
    readonly path: string;
    readonly digest: Digest;
    readonly mediaType?: string;
    readonly role: string;
  }[];
  readonly createdAt: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface CheckIdentity {
  readonly id: string;
  readonly version: string;
  readonly configurationDigest: Digest;
  readonly mode?: string;
}

export interface ClaimDefinition {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly subjectKinds: readonly string[];
  readonly limitations?: readonly string[];
}

export interface ControlResult {
  readonly controlId: string;
  readonly controlVersion: string;
  readonly status: "pass" | "fail" | "conditional" | "indeterminate" | "not-applicable";
  readonly severity: "mandatory" | "advisory";
  readonly evidenceRefs: readonly string[];
  readonly waiverRefs: readonly string[];
  readonly unknownRefs: readonly string[];
  readonly reasons: readonly {
    readonly code: string;
    readonly message: string;
  }[];
  readonly evaluatedAt: string;
}

export interface ControlDefinition {
  readonly id: string;
  readonly version: string;
  readonly claim: string;
  readonly title: string;
  readonly description: string;
  readonly severity: "mandatory" | "advisory";
  readonly applicability?: {
    readonly subjectKind: string;
  };
  readonly evidenceRequirements: readonly ({
    readonly producer: string;
    readonly check: string;
    readonly minimumCheckVersion?: string;
    readonly acceptedExecutionStatus: readonly ("passed" | "failed" | "error" | "skipped")[];
    readonly cardinality: {
      readonly minimum: number;
      readonly maximum: number;
    };
    readonly subjectBinding: {
      readonly exactRevision: boolean;
    };
    readonly freshness?: {
      readonly mode: "revision-bound" | "duration";
      readonly maximumAgeSeconds?: number;
    };
  })[];
  readonly dependencies?: readonly {
    readonly id: string;
    readonly version: string;
  }[];
  readonly evaluation: {
    readonly type: "all-requirements-satisfied" | "no-matching-findings" | "exact-subject-consistency";
    readonly mandatoryFindingSeverities?: readonly ("critical" | "high" | "medium" | "low" | "informational")[];
  };
  readonly freshness?: {
    readonly mode: "revision-bound" | "duration";
    readonly maximumAgeSeconds?: number;
  };
  readonly waiver?: {
    readonly allowed: boolean;
    readonly requiredRoles?: readonly string[];
    readonly maximumDurationSeconds?: number;
  };
}

export interface AssuranceDecision {
  readonly schema: "l9.assurance-decision";
  readonly schemaVersion: "1.0.0";
  readonly decisionId: string;
  readonly subject: SubjectReference;
  readonly profile: {
    readonly id: string;
    readonly version: string;
    readonly digest: Digest;
  };
  readonly policy: {
    readonly id: string;
    readonly version: string;
    readonly digest: Digest;
  };
  readonly verdict: "pass" | "fail" | "conditional" | "indeterminate";
  readonly controlResults: readonly ControlResult[];
  readonly claims: readonly ({
    readonly claimId: string;
    readonly claimVersion: string;
    readonly status: "supported" | "unsupported" | "conditional" | "indeterminate";
    readonly controlRefs: readonly string[];
  })[];
  readonly evidenceManifest: readonly {
    readonly evidenceId: string;
    readonly digest: Digest;
    readonly evidenceType?: string;
  }[];
  readonly waivers: readonly {
    readonly waiverId: string;
    readonly controlId: string;
  }[];
  readonly unknowns: readonly Unknown[];
  readonly dimensions?: {
    readonly controlSatisfaction?: number;
    readonly evidenceCompleteness?: number;
    readonly evidenceFreshness?: number;
    readonly producerTrust?: number;
  };
  readonly issuedAt: string;
  readonly evaluator: {
    readonly id: string;
    readonly version: string;
    readonly buildDigest?: Digest;
    readonly executionIdentity?: string;
    readonly repository?: string;
  };
  readonly supersedes?: string;
  readonly signature?: {
    readonly keyId: string;
    readonly algorithm: string;
    readonly value: string;
    readonly signedAt: string;
    readonly context?: string;
  };
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface Digest {
  readonly algorithm: "sha256";
  readonly value: string;
}

export interface EvidenceAdmissionResult {
  readonly evidenceId?: string;
  readonly status: "accepted" | "rejected" | "quarantined" | "duplicate";
  readonly reasons: readonly {
    readonly code: string;
    readonly message: string;
    readonly path?: string;
    readonly details?: Readonly<Record<string, unknown>>;
  }[];
  readonly validations: {
    readonly schema: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly producer: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly subject: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly integrity: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly freshness: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly authorization: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly replay: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
    readonly lineage: {
      readonly status: "pass" | "fail" | "skipped";
      readonly code?: string;
      readonly message?: string;
    };
  };
}

export interface EvidenceEnvelope {
  readonly schema: "l9.evidence-envelope";
  readonly schemaVersion: "1.0.0";
  readonly evidenceId: string;
  readonly subject: SubjectReference;
  readonly producer: ProducerIdentity;
  readonly evidenceType: string;
  readonly observedAt: string;
  readonly issuedAt: string;
  readonly payload: unknown;
  readonly payloadDigest: Digest;
  readonly sourceObservationId?: string;
  readonly lineage: readonly {
    readonly evidenceId: string;
    readonly digest: Digest;
    readonly evidenceType?: string;
  }[];
  readonly admissionContext?: {
    readonly receivedAt: string;
    readonly channel: "local" | "ci-artifact" | "api" | "bundle";
    readonly transportDigest?: Digest;
  };
  readonly signature?: {
    readonly keyId: string;
    readonly algorithm: string;
    readonly value: string;
    readonly signedAt: string;
    readonly context?: string;
  };
  readonly redaction?: {
    readonly sourceEvidenceId: string;
    readonly transformationId: string;
    readonly transformationVersion: string;
    readonly removedFields: readonly string[];
    readonly replacedFields: readonly string[];
    readonly sourceDigest: Digest;
    readonly derivativeDigest: Digest;
    readonly performedAt: string;
    readonly performedBy: {
      readonly id: string;
    };
  };
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface Finding {
  readonly findingId: string;
  readonly ruleId: string;
  readonly ruleVersion?: string;
  readonly severity: "critical" | "high" | "medium" | "low" | "informational";
  readonly disposition: "open" | "accepted" | "suppressed" | "resolved" | "not-applicable";
  readonly message: string;
  readonly location?: {
    readonly path?: string;
    readonly lineStart?: number;
    readonly columnStart?: number;
    readonly lineEnd?: number;
    readonly columnEnd?: number;
  };
  readonly fingerprint?: string;
  readonly evidence?: readonly ArtifactReference[];
  readonly remediation?: {
    readonly capability?: string;
    readonly defectClass?: string;
    readonly priority?: "critical" | "high" | "medium" | "low";
  };
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface Observation {
  readonly schema: "l9.observation";
  readonly schemaVersion: "1.0.0";
  readonly observationId: string;
  readonly producer: ProducerIdentity;
  readonly subject: SubjectReference;
  readonly check: CheckIdentity;
  readonly execution: {
    readonly runId: string;
    readonly attempt: number;
    readonly status: "passed" | "failed" | "error" | "skipped";
    readonly startedAt: string;
    readonly completedAt: string;
    readonly environmentDigest?: Digest;
    readonly invocationDigest?: Digest;
  };
  readonly summary: {
    readonly findingCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly informationalCount: number;
  };
  readonly findings: readonly Finding[];
  readonly artifacts: readonly ArtifactReference[];
  readonly provenance?: {
    readonly builder?: string;
    readonly buildType?: string;
    readonly invocationId?: string;
    readonly materials?: readonly ArtifactReference[];
  };
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface AssurancePolicy {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly controlOverrides: readonly ({
    readonly controlId: string;
    readonly severity?: "mandatory" | "advisory";
    readonly enabled?: boolean;
    readonly waiverAllowed?: boolean;
  })[];
  readonly mandatoryFindingSeverities: readonly ("critical" | "high" | "medium" | "low" | "informational")[];
  readonly unknownHandling: {
    readonly mandatory: "indeterminate" | "fail";
    readonly advisory: "indeterminate" | "ignore";
  };
  readonly waiverAuthorization: {
    readonly acceptedRoles: readonly string[];
    readonly requireSignature: boolean;
  };
  readonly hardProhibitions: readonly {
    readonly id: string;
    readonly description: string;
  }[];
  readonly minimumPolicyVersion?: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface ProducerIdentity {
  readonly id: string;
  readonly version: string;
  readonly buildDigest?: Digest;
  readonly executionIdentity?: string;
  readonly repository?: string;
}

export interface AssuranceProfile {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly subjectKinds: readonly string[];
  readonly controls: readonly {
    readonly id: string;
    readonly version: string;
  }[];
  readonly defaultPolicy: {
    readonly id: string;
    readonly version: string;
  };
  readonly outputClaims: readonly {
    readonly id: string;
    readonly version: string;
  }[];
  readonly compatibility?: {
    readonly minimumAssuranceVersion?: string;
    readonly minimumSchemaVersion?: string;
  };
}

export interface SubjectReference {
  readonly kind: "git-revision";
  readonly repository: {
    readonly host: string;
    readonly owner: string;
    readonly name: string;
  };
  readonly revision: {
    readonly commit: string;
    readonly treeDigest?: Digest;
  };
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface Unknown {
  readonly unknownId: string;
  readonly category: "missing-evidence" | "invalid-evidence" | "stale-evidence" | "unsupported-check" | "unverified-producer" | "policy-ambiguity" | "environment-uncertainty" | "external-dependency" | "other";
  readonly description: string;
  readonly impact: "none" | "advisory" | "control" | "decision";
  readonly relatedControls: readonly string[];
  readonly resolvableBy?: readonly string[];
}

export interface Waiver {
  readonly waiverId: string;
  readonly controlId: string;
  readonly subjectScope: {
    readonly repository: {
      readonly host: string;
      readonly owner: string;
      readonly name: string;
    };
    readonly commit: string;
  };
  readonly rationale: string;
  readonly riskAcceptance: string;
  readonly authorizedBy: {
    readonly id: string;
    readonly roles: readonly string[];
  };
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly constraints?: Readonly<Record<string, unknown>>;
  readonly signature?: {
    readonly keyId: string;
    readonly algorithm: string;
    readonly value: string;
    readonly signedAt: string;
    readonly context?: string;
  };
}
