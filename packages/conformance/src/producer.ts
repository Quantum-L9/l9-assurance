import type {
  AdmissionReasonCode,
  AdmissionReport,
  CheckRegistry,
  EvidenceAdmissionResult,
  ProducerRegistry,
  SubjectReference,
} from '@l9/assurance-contracts';
import {
  admitObservations,
  type AdmissionContext,
  type AdmissionLimits,
  validateObservation,
} from '@l9/assurance-evidence';

export interface ConformanceCaseResult {
  readonly index: number;
  readonly status: 'pass' | 'fail';
  readonly reasons: readonly string[];
}

export interface ProducerConformanceReport {
  readonly producerId: string;
  readonly passed: boolean;
  readonly cases: readonly ConformanceCaseResult[];
  readonly admission?: AdmissionReport;
}

export interface ProducerAdmissionConformanceCase {
  readonly id: string;
  readonly value: unknown;
  readonly expectedStatus: EvidenceAdmissionResult['status'];
  readonly expectedReason?: AdmissionReasonCode;
}

export interface ProducerAdmissionConformanceCaseResult {
  readonly id: string;
  readonly passed: boolean;
  readonly actualStatus: EvidenceAdmissionResult['status'];
  readonly reasonCodes: readonly AdmissionReasonCode[];
}

export interface ProducerAdmissionConformanceReport {
  readonly producerId: string;
  readonly passed: boolean;
  readonly cases: readonly ProducerAdmissionConformanceCaseResult[];
  readonly admission: AdmissionReport;
}

interface ProducerConformanceOptions {
  readonly producerId: string;
  readonly subject: SubjectReference;
  readonly producerRegistry: ProducerRegistry;
  readonly checkRegistry: CheckRegistry;
  readonly receivedAt: string;
  readonly maximumAgeSecondsByCheck?: Readonly<Record<string, number>>;
  readonly limits?: Partial<AdmissionLimits>;
}

export async function runProducerConformance(
  values: readonly unknown[],
  options: ProducerConformanceOptions,
): Promise<ProducerConformanceReport> {
  const cases = values.map((value, index) => {
    const validation = validateObservation(value);
    return {
      index,
      status: validation.valid ? 'pass' : 'fail',
      reasons: validation.errors,
    } as const;
  });
  const admission = await admitObservations(values, admissionContext(options));
  const passed =
    values.length > 0 &&
    cases.every((item) => item.status === 'pass') &&
    admission.rejectedCount === 0 &&
    admission.quarantinedCount === 0;
  return { producerId: options.producerId, passed, cases: Object.freeze(cases), admission };
}

export async function runProducerAdmissionConformanceCases(
  cases: readonly ProducerAdmissionConformanceCase[],
  options: ProducerConformanceOptions,
): Promise<ProducerAdmissionConformanceReport> {
  const admission = await admitObservations(
    cases.map((item) => item.value),
    admissionContext(options),
  );
  const results = cases.map((item, index) => {
    const actual = admission.results[index];
    if (!actual) throw new Error(`Missing admission result for conformance case ${item.id}.`);
    const reasonCodes: readonly AdmissionReasonCode[] = Object.freeze(
      actual.reasons.map((reason) => reason.code as AdmissionReasonCode),
    );
    return {
      id: item.id,
      passed:
        actual.status === item.expectedStatus &&
        (item.expectedReason === undefined || reasonCodes.includes(item.expectedReason)),
      actualStatus: actual.status,
      reasonCodes,
    };
  });
  return {
    producerId: options.producerId,
    passed: results.every((item) => item.passed),
    cases: Object.freeze(results),
    admission,
  };
}

function admissionContext(options: ProducerConformanceOptions): AdmissionContext {
  return {
    subject: options.subject,
    producerRegistry: options.producerRegistry,
    checkRegistry: options.checkRegistry,
    receivedAt: options.receivedAt,
    channel: 'local',
    ...(options.maximumAgeSecondsByCheck
      ? { maximumAgeSecondsByCheck: options.maximumAgeSecondsByCheck }
      : {}),
    ...(options.limits ? { limits: options.limits } : {}),
  };
}
