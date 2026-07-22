import type { AcceptedEvidence, ControlDefinition, ControlReasonCode, SubjectReference } from '@l9/assurance-contracts';

export interface ControlAssessment {
  readonly status: 'pass' | 'fail' | 'indeterminate' | 'not-applicable';
  readonly evidenceRefs: readonly string[];
  readonly reasons: readonly { readonly code: ControlReasonCode; readonly message: string }[];
  readonly unknownCategory?: 'missing-evidence' | 'invalid-evidence' | 'stale-evidence' | 'unsupported-check' | 'unverified-producer' | 'policy-ambiguity' | 'environment-uncertainty' | 'external-dependency' | 'other';
}

export function assessControl(
  control: ControlDefinition,
  evidence: readonly AcceptedEvidence[],
  subject: SubjectReference,
): ControlAssessment {
  if (control.applicability && control.applicability.subjectKind !== subject.kind) {
    return result('not-applicable', [], [['CONTROL_NOT_APPLICABLE', 'subject kind does not match control applicability']]);
  }
  if (control.evaluation.type === 'exact-subject-consistency') {
    return assessSubjectConsistency(evidence, subject);
  }
  const matches = control.evidenceRequirements.flatMap((requirement) =>
    evidence.filter((item) => matchesRequirement(item, requirement)),
  );
  const refs = unique(matches.map((item) => item.envelope.evidenceId));
  if (control.evaluation.type === 'no-matching-findings') return assessFindings(control, matches, refs);
  return assessRequirements(control, evidence, refs);
}

function assessRequirements(
  control: ControlDefinition,
  evidence: readonly AcceptedEvidence[],
  allRefs: readonly string[],
): ControlAssessment {
  const reasons: Array<readonly [ControlReasonCode, string]> = [];
  let status: 'pass' | 'fail' | 'indeterminate' = 'pass';
  let missing = false;
  for (const requirement of control.evidenceRequirements) {
    const matches = evidence.filter((item) => matchesRequirement(item, requirement));
    if (matches.length < requirement.cardinality.minimum || matches.length > requirement.cardinality.maximum) {
      status = 'indeterminate';
      missing = matches.length < requirement.cardinality.minimum;
      reasons.push([
        'CONTROL_CARDINALITY_VIOLATION',
        `${requirement.check} cardinality ${matches.length} outside ${requirement.cardinality.minimum}..${requirement.cardinality.maximum}`,
      ]);
      continue;
    }
    const unauthorized = matches.filter((item) =>
      !requirement.acceptedExecutionStatus.includes(item.observation.execution.status),
    );
    if (unauthorized.length > 0) {
      if (status !== 'fail') status = 'indeterminate';
      reasons.push(['CONTROL_EVIDENCE_ERROR', `${requirement.check} reported a status not admitted by the control`]);
      continue;
    }
    const statuses = matches.map((item) => item.observation.execution.status);
    if (statuses.includes('failed')) {
      status = 'fail';
      reasons.push(['CONTROL_POSITIVE_FAILURE', `${requirement.check} positively reported failure`]);
      continue;
    }
    if (statuses.includes('error')) {
      if (status !== 'fail') status = 'indeterminate';
      reasons.push(['CONTROL_EVIDENCE_ERROR', `${requirement.check} reported execution error`]);
      continue;
    }
    if (statuses.includes('skipped')) {
      if (status !== 'fail') status = 'indeterminate';
      reasons.push(['CONTROL_EVIDENCE_SKIPPED', `${requirement.check} was skipped`]);
      continue;
    }
    reasons.push(['CONTROL_REQUIREMENT_SATISFIED', `${requirement.check} passed`]);
  }
  return {
    status,
    evidenceRefs: allRefs,
    reasons: sortReasons(reasons),
    ...(status === 'indeterminate' ? { unknownCategory: missing ? 'missing-evidence' : 'environment-uncertainty' } : {}),
  };
}

function assessFindings(
  control: ControlDefinition,
  matches: readonly AcceptedEvidence[],
  refs: readonly string[],
): ControlAssessment {
  if (matches.length === 0) {
    return {
      status: 'indeterminate',
      evidenceRefs: [],
      reasons: [{ code: 'CONTROL_EVIDENCE_MISSING', message: 'mandatory findings observation is missing' }],
      unknownCategory: 'missing-evidence',
    };
  }
  const unauthorized = matches.some((item) => {
    const requirement = control.evidenceRequirements.find((candidate) =>
      candidate.producer === item.observation.producer.id && candidate.check === item.observation.check.id,
    );
    return !requirement || !requirement.acceptedExecutionStatus.includes(item.observation.execution.status);
  });
  if (unauthorized) {
    return {
      status: 'indeterminate',
      evidenceRefs: refs,
      reasons: [{ code: 'CONTROL_EVIDENCE_ERROR', message: 'mandatory findings status is not admitted by the control' }],
      unknownCategory: 'environment-uncertainty',
    };
  }
  const severities = new Set(control.evaluation.mandatoryFindingSeverities ?? ['critical', 'high']);
  const blocking = matches
    .flatMap((item) => item.observation.findings)
    .filter((finding) => finding.disposition === 'open' && severities.has(finding.severity));
  if (blocking.length > 0) {
    return result('fail', refs, [['CONTROL_MANDATORY_FINDING_PRESENT', `${blocking.length} open mandatory finding(s) present`]]);
  }
  const statuses = matches.map((item) => item.observation.execution.status);
  if (statuses.some((status) => status !== 'passed')) {
    return {
      status: 'indeterminate',
      evidenceRefs: refs,
      reasons: [{ code: 'CONTROL_EVIDENCE_ERROR', message: 'mandatory findings check did not positively establish absence' }],
      unknownCategory: 'environment-uncertainty',
    };
  }
  return result('pass', refs, [['CONTROL_REQUIREMENT_SATISFIED', 'no open mandatory findings were reported']]);
}

function assessSubjectConsistency(
  evidence: readonly AcceptedEvidence[],
  subject: SubjectReference,
): ControlAssessment {
  if (evidence.length === 0) {
    return {
      status: 'indeterminate',
      evidenceRefs: [],
      reasons: [{ code: 'CONTROL_EVIDENCE_MISSING', message: 'no admitted evidence exists for consistency evaluation' }],
      unknownCategory: 'missing-evidence',
    };
  }
  const inconsistent = evidence.filter((item) =>
    item.observation.subject.repository.host.toLowerCase() !== subject.repository.host.toLowerCase() ||
    item.observation.subject.repository.owner !== subject.repository.owner ||
    item.observation.subject.repository.name.replace(/\.git$/i, '') !== subject.repository.name.replace(/\.git$/i, '') ||
    item.observation.subject.revision.commit.toLowerCase() !== subject.revision.commit.toLowerCase(),
  );
  const refs = unique(evidence.map((item) => item.envelope.evidenceId));
  return inconsistent.length > 0
    ? result('fail', refs, [['CONTROL_POSITIVE_FAILURE', `${inconsistent.length} admitted evidence item(s) reference a different subject`]])
    : result('pass', refs, [['CONTROL_SUBJECT_CONSISTENT', 'all admitted evidence references the exact subject revision']]);
}

function matchesRequirement(
  item: AcceptedEvidence,
  requirement: ControlDefinition['evidenceRequirements'][number],
): boolean {
  return item.observation.producer.id === requirement.producer &&
    item.observation.check.id === requirement.check &&
    compareSemVer(item.observation.check.version, requirement.minimumCheckVersion ?? '0.0.0') >= 0;
}

function result(
  status: ControlAssessment['status'],
  refs: readonly string[],
  reasons: readonly (readonly [ControlReasonCode, string])[],
): ControlAssessment {
  return { status, evidenceRefs: unique(refs), reasons: sortReasons(reasons) };
}

function sortReasons(
  reasons: readonly (readonly [ControlReasonCode, string])[],
): readonly { readonly code: ControlReasonCode; readonly message: string }[] {
  return reasons
    .map(([code, message]) => ({ code, message }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.message.localeCompare(b.message));
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function compareSemVer(leftValue: string, rightValue: string): number {
  const left = parseVersion(leftValue);
  const right = parseVersion(rightValue);
  if (!left || !right) throw new Error(`Invalid semantic version: ${!left ? leftValue : rightValue}`);
  const major=left[0]-right[0];if(major!==0)return major;const minor=left[1]-right[1];if(minor!==0)return minor;const patch=left[2]-right[2];if(patch!==0)return patch;
  return comparePrerelease(left[3], right[3]);
}
function parseVersion(value: string): [number, number, number, string | undefined] | null {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4]] : null;
}
function comparePrerelease(left: string | undefined, right: string | undefined): number {
  if (left === right) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  const a = left.split('.'); const b = right.split('.');
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const x = a[index]; const y = b[index]; if (x === undefined) return -1; if (y === undefined) return 1; if (x === y) continue;
    const xn = /^\d+$/.test(x); const yn = /^\d+$/.test(y); if (xn && yn) return Number(x) - Number(y); if (xn) return -1; if (yn) return 1; return x < y ? -1 : 1;
  }
  return 0;
}
