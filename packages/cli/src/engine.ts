import type {
  AcceptedEvidence,
  AdmissionReport,
  AssuranceDecision,
  AssurancePlan,
  AssurancePolicy,
  AssuranceProfile,
  CheckRegistry,
  ControlDefinition,
  EvaluationContext,
  ProducerIdentity,
  ProducerRegistry,
  ResolvedAssurancePolicy,
  ResolvedAssuranceProfile,
  SubjectReference,
  VerificationReport,
  Waiver,
} from '@l9/assurance-contracts';
import {
  CANONICALIZATION_ALGORITHM,
  PLAN_SCHEMA,
  SCHEMA_VERSION,
} from '@l9/assurance-contracts';
import {
  admitObservations,
  canonicalJson,
  InMemoryReplayStore,
  sha256Digest,
  type AdmissionContext,
  type ReplayStore,
} from '@l9/assurance-evidence';
import { resolveProfile } from '@l9/assurance-controls';
import { resolvePolicy, type PolicyOverlay } from '@l9/assurance-policy';
import { evaluate, verifyDecision } from '@l9/assurance-evaluator';

export interface EngineConfiguration {
  readonly producerRegistry: ProducerRegistry;
  readonly checkRegistry: CheckRegistry;
  readonly profile: AssuranceProfile;
  readonly policy: AssurancePolicy;
  readonly controls: readonly ControlDefinition[];
  readonly protocolBundleDigest?: { readonly algorithm: 'sha256'; readonly value: string };
  readonly clock?: () => string;
  readonly replayStore?: ReplayStore;
  readonly evaluator?: ProducerIdentity;
}
export interface PlanRequest {
  readonly subject: SubjectReference;
}
export interface AdmissionRequest {
  readonly subject: SubjectReference;
  readonly observations: readonly unknown[];
  readonly receivedAt?: string;
  readonly channel?: AdmissionContext['channel'];
}
export interface EvaluationRequest {
  readonly subject: SubjectReference;
  readonly acceptedEvidence: readonly AcceptedEvidence[];
  readonly evaluationTime?: string;
  readonly decisionId?: string;
  readonly waivers?: readonly Waiver[];
  readonly overlays?: readonly PolicyOverlay[];
  readonly admissionReport?: AdmissionReport;
  readonly previousDecisionId?: string;
}
export interface VerificationRequest {
  readonly decision: unknown;
}
export interface PlanVerificationReport {
  readonly valid: boolean;
  readonly planId?: string;
  readonly digest?: string;
  readonly reasons: readonly string[];
}

export class AssuranceEngine {
  readonly #configuration: EngineConfiguration;
  readonly #profile: ResolvedAssuranceProfile;
  readonly #clock: () => string;
  readonly #replayStore: ReplayStore;

  constructor(configuration: EngineConfiguration) {
    this.#configuration = configuration;
    this.#profile = resolveProfile(configuration.profile, configuration.controls);
    this.#clock = configuration.clock ?? (() => new Date().toISOString());
    this.#replayStore = configuration.replayStore ?? new InMemoryReplayStore();
  }

  async plan(request: PlanRequest): Promise<AssurancePlan> {
    const checkById = new Map(this.#configuration.checkRegistry.checks.map((check) => [check.id, check]));
    const producerById = new Map(
      this.#configuration.producerRegistry.producers.map((producer) => [producer.id, producer]),
    );
    const producerIds = new Set<string>();
    const checkIds = new Set<string>();
    const controls = this.#profile.controls.map((control) => ({
      id: control.id,
      version: control.version,
      severity: control.severity,
      evidenceRequirements: control.evidenceRequirements.map((requirement) => {
        const check = checkById.get(requirement.check);
        if (!check) throw new Error(`Plan references unregistered check ${requirement.check}`);
        const producer = producerById.get(requirement.producer);
        if (!producer) throw new Error(`Plan references unregistered producer ${requirement.producer}`);
        if (check.owner !== producer.id) {
          throw new Error(`Plan check ${check.id} is owned by ${check.owner}, not ${producer.id}`);
        }
        producerIds.add(producer.id);
        checkIds.add(check.id);
        const freshness = requirement.freshness ?? control.freshness ?? { mode: 'revision-bound' as const };
        return {
          producer: producer.id,
          check: check.id,
          checkVersion: check.version,
          outputSchema: check.output_schema,
          acceptedExecutionStatuses: Object.freeze([...requirement.acceptedExecutionStatus]),
          cardinality: { ...requirement.cardinality },
          subjectBinding: { ...requirement.subjectBinding },
          configurationDigestRequired: check.configuration_digest_required,
          freshness: {
            mode: freshness.mode,
            ...(freshness.maximumAgeSeconds === undefined
              ? {}
              : { maximumAgeSeconds: freshness.maximumAgeSeconds }),
          },
        };
      }),
      waiver: {
        allowed: control.waiver?.allowed ?? false,
        requiredRoles: Object.freeze([...(control.waiver?.requiredRoles ?? [])]),
        ...(control.waiver?.maximumDurationSeconds === undefined
          ? {}
          : { maximumDurationSeconds: control.waiver.maximumDurationSeconds }),
      },
    }));
    const requiredProducers = [...producerIds]
      .sort()
      .map((id) => {
        const producer = producerById.get(id);
        if (!producer) throw new Error(`Missing producer ${id}`);
        return {
          id: producer.id,
          repository: producer.repository,
          authorizationStatus: producer.authorization_status,
          candidateVersionRange: producer.candidate_version_range ?? null,
          allowedVersions: producer.allowed_versions,
          subjectKinds: Object.freeze([...producer.subject_kinds].sort()),
          checks: Object.freeze([...producer.checks].sort()),
        };
      });
    const requiredChecks = [...checkIds]
      .sort()
      .map((id) => {
        const check = checkById.get(id);
        if (!check) throw new Error(`Missing check ${id}`);
        return {
          id: check.id,
          version: check.version,
          owner: check.owner,
          outputSchema: check.output_schema,
          deterministic: check.deterministic,
          revisionBound: check.revision_bound,
          acceptedExecutionStatuses: Object.freeze([...check.accepted_execution_statuses]),
          configurationDigestRequired: check.configuration_digest_required,
        };
      });
    const waiverRules = this.#profile.controls
      .map((control) => ({
        controlId: control.id,
        allowed: control.waiver?.allowed ?? false,
        requiredRoles: Object.freeze([...(control.waiver?.requiredRoles ?? [])]),
        maximumDurationSeconds: control.waiver?.maximumDurationSeconds ?? null,
      }))
      .sort((a, b) => a.controlId.localeCompare(b.controlId));
    const profileDigest = sha256Digest(this.#profile.profile);
    const policyDigest = sha256Digest(this.#configuration.policy);
    const protocolBundleDigest =
      this.#configuration.protocolBundleDigest ??
      sha256Digest({
        producerRegistry: this.#configuration.producerRegistry,
        checkRegistry: this.#configuration.checkRegistry,
        profile: this.#profile.profile,
        policy: this.#configuration.policy,
        controls: [...this.#profile.controls].sort(compareControl),
      });
    const preimage = {
      schema: PLAN_SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      subject: request.subject,
      profile: {
        id: this.#profile.profile.id,
        version: this.#profile.profile.version,
        digest: profileDigest,
      },
      policy: {
        id: this.#configuration.policy.id,
        version: this.#configuration.policy.version,
        digest: policyDigest,
      },
      protocol: {
        assuranceVersion: '2.0.1',
        schemaVersion: SCHEMA_VERSION,
        canonicalization: CANONICALIZATION_ALGORITHM,
        digestAlgorithm: 'sha256' as const,
        bundleDigest: protocolBundleDigest,
      },
      controls: Object.freeze(controls),
      requiredProducers: Object.freeze(requiredProducers),
      requiredChecks: Object.freeze(requiredChecks),
      waiverRules: Object.freeze(waiverRules),
      sourceDigests: {
        producerRegistry: sha256Digest(this.#configuration.producerRegistry),
        checkRegistry: sha256Digest(this.#configuration.checkRegistry),
        controls: sha256Digest([...this.#profile.controls].sort(compareControl)),
      },
    } as const;
    const planDigest = sha256Digest(preimage);
    return Object.freeze({
      ...preimage,
      planId: `plan_${planDigest.value.slice(0, 40)}`,
      planDigest,
    });
  }

  async admit(request: AdmissionRequest): Promise<AdmissionReport> {
    return admitObservations(request.observations, {
      subject: request.subject,
      producerRegistry: this.#configuration.producerRegistry,
      checkRegistry: this.#configuration.checkRegistry,
      receivedAt: request.receivedAt ?? this.#clock(),
      channel: request.channel ?? 'local',
      replayStore: this.#replayStore,
    });
  }

  async evaluate(request: EvaluationRequest): Promise<AssuranceDecision> {
    const evaluationTime = request.evaluationTime ?? this.#clock();
    const resolvedPolicy: ResolvedAssurancePolicy = resolvePolicy(
      this.#configuration.policy,
      request.overlays ?? [],
      request.waivers ?? [],
    );
    const decisionId =
      request.decisionId ??
      deriveDecisionId(request.subject, this.#profile, resolvedPolicy, request.acceptedEvidence, evaluationTime);
    const context: EvaluationContext = {
      evaluationTime,
      decisionId,
      evaluator:
        this.#configuration.evaluator ??
        { id: 'l9-assurance', version: '2.0.1', repository: 'Quantum-L9/l9-assurance' },
      ...(request.previousDecisionId ? { previousDecisionId: request.previousDecisionId } : {}),
      ...(request.admissionReport?.unknowns.length
        ? { admissionUnknowns: request.admissionReport.unknowns }
        : {}),
    };
    return evaluate(request.subject, this.#profile, resolvedPolicy, request.acceptedEvidence, context);
  }

  async verify(request: VerificationRequest): Promise<VerificationReport> {
    return verifyDecision(request.decision);
  }
}

export function verifyPlan(plan: unknown): PlanVerificationReport {
  const reasons: string[] = [];
  if (!isRecord(plan)) return { valid: false, reasons: Object.freeze(['Plan must be an object.']) };
  if (plan.schema !== PLAN_SCHEMA) reasons.push(`Unsupported plan schema ${String(plan.schema)}.`);
  if (plan.schemaVersion !== SCHEMA_VERSION) reasons.push(`Unsupported plan schemaVersion ${String(plan.schemaVersion)}.`);
  const planId = typeof plan.planId === 'string' ? plan.planId : undefined;
  const suppliedDigest = isDigest(plan.planDigest) ? plan.planDigest : undefined;
  if (!planId) reasons.push('Missing planId.');
  if (!suppliedDigest) reasons.push('Missing or invalid planDigest.');
  if (suppliedDigest) {
    const { planId: _planId, planDigest: _planDigest, ...preimage } = plan;
    const calculated = sha256Digest(preimage);
    if (calculated.value !== suppliedDigest.value) reasons.push('Plan digest mismatch.');
    if (planId !== `plan_${calculated.value.slice(0, 40)}`) reasons.push('Plan identifier mismatch.');
    return {
      valid: reasons.length === 0,
      ...(planId ? { planId } : {}),
      digest: calculated.value,
      reasons: Object.freeze(reasons),
    };
  }
  return {
    valid: false,
    ...(planId ? { planId } : {}),
    reasons: Object.freeze(reasons),
  };
}

function deriveDecisionId(
  subject: SubjectReference,
  profile: ResolvedAssuranceProfile,
  policy: ResolvedAssurancePolicy,
  evidence: readonly AcceptedEvidence[],
  evaluationTime: string,
): string {
  return `dec_${sha256Digest({
    subject,
    profile: profile.profile,
    policy: policy.policy,
    evidence: evidence.map((item) => item.envelope.evidenceId).sort(),
    evaluationTime,
  }).value.slice(0, 40)}`;
}

function compareControl(a: ControlDefinition, b: ControlDefinition): number {
  return `${a.id}@${a.version}`.localeCompare(`${b.id}@${b.version}`);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDigest(value: unknown): value is { readonly algorithm: 'sha256'; readonly value: string } {
  return (
    isRecord(value) &&
    value.algorithm === 'sha256' &&
    typeof value.value === 'string' &&
    /^[a-f0-9]{64}$/.test(value.value)
  );
}
