import type {
  AssuranceDecision,
  AssurancePolicy,
  AssuranceProfile,
  CheckIdentity,
  ControlDefinition,
  EvidenceAdmissionResult,
  EvidenceEnvelope,
  Observation,
  ProducerIdentity,
  SubjectReference,
  Unknown,
  Waiver
} from './generated.js';

export type ExecutionDescriptor = Observation['execution'];
export type EvidenceRequirement = ControlDefinition['evidenceRequirements'][number];
export type DecisionVerdict = AssuranceDecision['verdict'];
export type ControlStatus = AssuranceDecision['controlResults'][number]['status'];
export type ObservationStatus = Observation['execution']['status'];
export type EvidenceAdmissionStatus = EvidenceAdmissionResult['status'];

export interface ProducerRegistryEntry {
  readonly id: string;
  readonly repository: string;
  readonly authorization_status: 'trusted' | 'pending' | 'revoked';
  readonly candidate_version_range?: string;
  readonly allowed_versions: string | null;
  readonly subject_kinds: readonly string[];
  readonly checks: readonly string[];
  readonly unknown_reference?: string;
}

export interface ProducerRegistry {
  readonly schema_version: string;
  readonly producers: readonly ProducerRegistryEntry[];
}

export interface CheckRegistryEntry {
  readonly id: string;
  readonly version: string;
  readonly owner: string;
  readonly output_schema: string;
  readonly meaning: string;
  readonly deterministic: boolean;
  readonly revision_bound: boolean;
  readonly accepted_execution_statuses: readonly ObservationStatus[];
  readonly configuration_digest_required: boolean;
  readonly superseded_versions: readonly string[];
  readonly revoked_versions: readonly string[];
}

export interface CheckRegistry {
  readonly schema_version: string;
  readonly checks: readonly CheckRegistryEntry[];
}

export interface ResolvedAssuranceProfile {
  readonly profile: AssuranceProfile;
  readonly controls: readonly ControlDefinition[];
}

export interface ResolvedAssurancePolicy {
  readonly policy: AssurancePolicy;
  readonly waivers: readonly Waiver[];
}

export interface AcceptedEvidence {
  readonly envelope: EvidenceEnvelope;
  readonly observation: Observation;
  readonly fingerprint: string;
}

export interface AdmissionReport {
  readonly subject: SubjectReference;
  readonly receivedAt: string;
  readonly results: readonly EvidenceAdmissionResult[];
  readonly accepted: readonly AcceptedEvidence[];
  readonly rejectedCount: number;
  readonly quarantinedCount: number;
  readonly duplicateCount: number;
  readonly unknowns: readonly Unknown[];
}

export interface EvaluationContext {
  readonly evaluationTime: string;
  readonly decisionId: string;
  readonly evaluator: ProducerIdentity;
  readonly previousDecisionId?: string;
  readonly admissionUnknowns?: readonly Unknown[];
}

export interface VerificationReport {
  readonly valid: boolean;
  readonly decisionId?: string;
  readonly digest?: string;
  readonly signatureStatus: 'not-present' | 'unsupported' | 'verified' | 'invalid';
  readonly reasons: readonly string[];
}

export interface AssurancePlan {
  readonly subject: SubjectReference;
  readonly profile: { readonly id: string; readonly version: string };
  readonly controls: readonly { readonly id: string; readonly version: string; readonly severity: string }[];
  readonly requiredProducers: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly waiverRules: readonly { readonly controlId: string; readonly allowed: boolean }[];
}

export interface EvidenceReferenceRecord {
  readonly evidenceId: string;
  readonly digest: EvidenceEnvelope['payloadDigest'];
  readonly evidenceType?: string;
}

export type {
  AssuranceDecision,
  AssurancePolicy,
  AssuranceProfile,
  CheckIdentity,
  ControlDefinition,
  EvidenceAdmissionResult,
  EvidenceEnvelope,
  Observation,
  ProducerIdentity,
  SubjectReference,
  Unknown,
  Waiver
};
