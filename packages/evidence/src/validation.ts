import type { Observation } from '@l9/assurance-contracts';
import { canonicalJson } from './canonical.js';
import { DEFAULT_ADMISSION_LIMITS, measureJson, type AdmissionLimits } from './limits.js';

const EXTENSION_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9-]+)+$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = /^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/;

export interface StructuralValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly observation?: Observation;
}

export function validateObservation(
  value: unknown,
  partialLimits: Partial<AdmissionLimits> = {},
): StructuralValidation {
  const limits = { ...DEFAULT_ADMISSION_LIMITS, ...partialLimits };
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ['$ must be an object'] };

  const serialized = safeCanonical(value, errors);
  const bytes = new TextEncoder().encode(serialized).byteLength;
  if (bytes > limits.maximumSingleObservationBytes) {
    errors.push(`EVIDENCE_TOO_LARGE: ${bytes} bytes`);
  }
  try {
    const measured = measureJson(value);
    if (measured.depth > limits.maximumJsonDepth) {
      errors.push(`EVIDENCE_LIMIT_EXCEEDED: depth ${measured.depth}`);
    }
    if (measured.maximumStringBytes > limits.maximumStringBytes) {
      errors.push(`EVIDENCE_LIMIT_EXCEEDED: string bytes ${measured.maximumStringBytes}`);
    }
  } catch (error) {
    errors.push(`EVIDENCE_CANONICALIZATION_FAILED: ${messageOf(error)}`);
  }

  exactKeys(value, '$', [
    'schema',
    'schemaVersion',
    'observationId',
    'producer',
    'subject',
    'check',
    'execution',
    'summary',
    'findings',
    'artifacts',
    'provenance',
    'extensions',
  ], errors);
  requiredString(value, 'schema', '$', errors);
  requiredString(value, 'schemaVersion', '$', errors);
  requiredString(value, 'observationId', '$', errors);
  if (value.schema !== 'l9.observation') {
    errors.push('EVIDENCE_SCHEMA_INVALID: schema must be l9.observation');
  }
  if (value.schemaVersion !== '1.0.0') {
    errors.push('EVIDENCE_SCHEMA_UNSUPPORTED: schemaVersion must be 1.0.0');
  }

  validateProducer(value.producer, errors);
  validateSubject(value.subject, errors);
  validateCheck(value.check, errors);
  validateExecution(value.execution, errors);
  validateSummary(value.summary, errors);

  if (!Array.isArray(value.findings)) {
    errors.push('$.findings must be an array');
  } else {
    if (value.findings.length > limits.maximumFindingsPerObservation) {
      errors.push(`EVIDENCE_LIMIT_EXCEEDED: findings ${value.findings.length}`);
    }
    value.findings.forEach((finding, index) => validateFinding(finding, index, errors));
  }

  if (!Array.isArray(value.artifacts)) {
    errors.push('$.artifacts must be an array');
  } else {
    value.artifacts.forEach((artifact, index) => validateArtifact(artifact, `$.artifacts[${index}]`, errors));
  }

  if (value.provenance !== undefined) validateProvenance(value.provenance, errors);
  validateExtensions(value.extensions, limits, errors);

  if (Array.isArray(value.findings) && isRecord(value.summary)) {
    const declared = Number(value.summary.findingCount);
    const classified =
      Number(value.summary.errorCount) +
      Number(value.summary.warningCount) +
      Number(value.summary.informationalCount);
    if (declared !== value.findings.length) {
      errors.push('$.summary.findingCount does not match findings length');
    }
    if (declared !== classified) {
      errors.push('$.summary category counts do not sum to findingCount');
    }
  }

  return errors.length > 0
    ? { valid: false, errors: Object.freeze(errors) }
    : { valid: true, errors: Object.freeze([]), observation: value as unknown as Observation };
}

function validateProducer(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('$.producer must be an object');
    return;
  }
  exactKeys(value, '$.producer', ['id', 'version', 'buildDigest', 'executionIdentity', 'repository'], errors);
  requiredString(value, 'id', '$.producer', errors);
  requiredString(value, 'version', '$.producer', errors);
  if (typeof value.version === 'string' && !SEMVER.test(value.version)) {
    errors.push('$.producer.version must be semantic');
  }
  if (value.buildDigest !== undefined) validateDigest(value.buildDigest, '$.producer.buildDigest', errors);
  optionalString(value, 'executionIdentity', '$.producer', errors);
  optionalString(value, 'repository', '$.producer', errors);
}

function validateSubject(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('$.subject must be an object');
    return;
  }
  exactKeys(value, '$.subject', ['kind', 'repository', 'revision', 'metadata'], errors);
  if (value.kind !== 'git-revision') errors.push('$.subject.kind must be git-revision');

  if (!isRecord(value.repository)) {
    errors.push('$.subject.repository must be an object');
  } else {
    exactKeys(value.repository, '$.subject.repository', ['host', 'owner', 'name'], errors);
    for (const key of ['host', 'owner', 'name']) requiredString(value.repository, key, '$.subject.repository', errors);
  }

  if (!isRecord(value.revision)) {
    errors.push('$.subject.revision must be an object');
  } else {
    exactKeys(value.revision, '$.subject.revision', ['commit', 'treeDigest'], errors);
    requiredString(value.revision, 'commit', '$.subject.revision', errors);
    if (typeof value.revision.commit === 'string' && !COMMIT.test(value.revision.commit)) {
      errors.push('$.subject.revision.commit must be a full hex commit');
    }
    if (value.revision.treeDigest !== undefined) {
      validateDigest(value.revision.treeDigest, '$.subject.revision.treeDigest', errors);
    }
  }

  if (value.metadata !== undefined) validateStringMap(value.metadata, '$.subject.metadata', errors);
}

function validateCheck(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('$.check must be an object');
    return;
  }
  exactKeys(value, '$.check', ['id', 'version', 'configurationDigest', 'mode'], errors);
  requiredString(value, 'id', '$.check', errors);
  requiredString(value, 'version', '$.check', errors);
  if (typeof value.version === 'string' && !SEMVER.test(value.version)) {
    errors.push('$.check.version must be semantic');
  }
  validateDigest(value.configurationDigest, '$.check.configurationDigest', errors);
  optionalString(value, 'mode', '$.check', errors);
}

function validateExecution(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('$.execution must be an object');
    return;
  }
  exactKeys(value, '$.execution', [
    'runId',
    'attempt',
    'status',
    'startedAt',
    'completedAt',
    'environmentDigest',
    'invocationDigest',
  ], errors);
  requiredString(value, 'runId', '$.execution', errors);
  requiredInteger(value, 'attempt', 1, '$.execution', errors);
  requiredString(value, 'status', '$.execution', errors);
  if (!['passed', 'failed', 'error', 'skipped'].includes(String(value.status))) {
    errors.push('$.execution.status is invalid');
  }
  requiredDate(value, 'startedAt', '$.execution', errors);
  requiredDate(value, 'completedAt', '$.execution', errors);
  if (value.environmentDigest !== undefined) {
    validateDigest(value.environmentDigest, '$.execution.environmentDigest', errors);
  }
  if (value.invocationDigest !== undefined) {
    validateDigest(value.invocationDigest, '$.execution.invocationDigest', errors);
  }
}

function validateSummary(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('$.summary must be an object');
    return;
  }
  exactKeys(value, '$.summary', ['findingCount', 'errorCount', 'warningCount', 'informationalCount'], errors);
  for (const key of ['findingCount', 'errorCount', 'warningCount', 'informationalCount']) {
    requiredInteger(value, key, 0, '$.summary', errors);
  }
}

function validateFinding(value: unknown, index: number, errors: string[]): void {
  const path = `$.findings[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(value, path, [
    'findingId',
    'ruleId',
    'ruleVersion',
    'severity',
    'disposition',
    'message',
    'location',
    'fingerprint',
    'evidence',
    'remediation',
    'metadata',
  ], errors);
  for (const key of ['findingId', 'ruleId', 'severity', 'disposition', 'message']) {
    requiredString(value, key, path, errors);
  }
  optionalString(value, 'ruleVersion', path, errors);
  optionalString(value, 'fingerprint', path, errors);
  if (!['critical', 'high', 'medium', 'low', 'informational'].includes(String(value.severity))) {
    errors.push(`${path}.severity is invalid`);
  }
  if (!['open', 'accepted', 'suppressed', 'resolved', 'not-applicable'].includes(String(value.disposition))) {
    errors.push(`${path}.disposition is invalid`);
  }
  if (value.location !== undefined) validateLocation(value.location, path, errors);
  if (value.evidence !== undefined) {
    if (!Array.isArray(value.evidence)) errors.push(`${path}.evidence must be an array`);
    else value.evidence.forEach((artifact, artifactIndex) => validateArtifact(artifact, `${path}.evidence[${artifactIndex}]`, errors));
  }
  if (value.remediation !== undefined) validateRemediation(value.remediation, path, errors);
  if (value.metadata !== undefined && !isRecord(value.metadata)) errors.push(`${path}.metadata must be an object`);
}

function validateLocation(value: unknown, parent: string, errors: string[]): void {
  const path = `${parent}.location`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(value, path, ['path', 'lineStart', 'columnStart', 'lineEnd', 'columnEnd'], errors);
  optionalString(value, 'path', path, errors);
  for (const key of ['lineStart', 'columnStart', 'lineEnd', 'columnEnd']) {
    if (value[key] !== undefined && (!Number.isInteger(value[key]) || Number(value[key]) < 1)) {
      errors.push(`${path}.${key} must be an integer >= 1`);
    }
  }
  if (
    typeof value.lineStart === 'number' &&
    typeof value.lineEnd === 'number' &&
    value.lineEnd < value.lineStart
  ) {
    errors.push(`${path} line range is invalid`);
  }
}

function validateArtifact(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(value, path, ['name', 'digest', 'mediaType', 'path', 'uri'], errors);
  requiredString(value, 'name', path, errors);
  validateDigest(value.digest, `${path}.digest`, errors);
  optionalString(value, 'mediaType', path, errors);
  optionalString(value, 'path', path, errors);
  optionalString(value, 'uri', path, errors);
}

function validateProvenance(value: unknown, errors: string[]): void {
  const path = '$.provenance';
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(value, path, ['builder', 'buildType', 'invocationId', 'materials'], errors);
  optionalString(value, 'builder', path, errors);
  optionalString(value, 'buildType', path, errors);
  optionalString(value, 'invocationId', path, errors);
  if (value.materials !== undefined) {
    if (!Array.isArray(value.materials)) errors.push(`${path}.materials must be an array`);
    else value.materials.forEach((artifact, index) => validateArtifact(artifact, `${path}.materials[${index}]`, errors));
  }
}

function validateRemediation(value: unknown, parent: string, errors: string[]): void {
  const path = `${parent}.remediation`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(value, path, ['capability', 'defectClass', 'priority'], errors);
  optionalString(value, 'capability', path, errors);
  optionalString(value, 'defectClass', path, errors);
  if (value.priority !== undefined && !['critical', 'high', 'medium', 'low'].includes(String(value.priority))) {
    errors.push(`${path}.priority is invalid`);
  }
}

function validateExtensions(
  value: unknown,
  limits: AdmissionLimits,
  errors: string[],
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push('$.extensions must be an object');
    return;
  }
  const keys = Object.keys(value);
  if (keys.length > limits.maximumExtensionNamespaces) {
    errors.push('EVIDENCE_LIMIT_EXCEEDED: extension namespaces');
  }
  for (const key of keys) {
    if (!EXTENSION_PATTERN.test(key)) {
      errors.push(`EVIDENCE_EXTENSION_NAMESPACE_INVALID: ${key}`);
    }
  }
}

function validateDigest(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be a sha256 digest`);
    return;
  }
  exactKeys(value, path, ['algorithm', 'value'], errors);
  if (value.algorithm !== 'sha256' || typeof value.value !== 'string' || !DIGEST.test(value.value)) {
    errors.push(`${path} must be a sha256 digest`);
  }
}

function validateStringMap(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object of strings`);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'string') errors.push(`${path}.${key} must be a string`);
  }
}

function exactKeys(
  record: Readonly<Record<string, unknown>>,
  path: string,
  allowed: readonly string[],
  errors: string[],
): void {
  const permitted = new Set(allowed);
  for (const key of Object.keys(record)) {
    if (!permitted.has(key)) errors.push(`${path}.${key} is an unknown property`);
  }
}

function requiredString(
  record: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (typeof record[key] !== 'string' || String(record[key]).length === 0) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function optionalString(
  record: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (record[key] !== undefined && (typeof record[key] !== 'string' || String(record[key]).length === 0)) {
    errors.push(`${path}.${key} must be a non-empty string when present`);
  }
}

function requiredInteger(
  record: Readonly<Record<string, unknown>>,
  key: string,
  minimum: number,
  path: string,
  errors: string[],
): void {
  if (!Number.isInteger(record[key]) || Number(record[key]) < minimum) {
    errors.push(`${path}.${key} must be an integer >= ${minimum}`);
  }
}

function requiredDate(
  record: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  errors: string[],
): void {
  requiredString(record, key, path, errors);
  if (typeof record[key] === 'string' && !Number.isFinite(Date.parse(record[key]))) {
    errors.push(`${path}.${key} must be an RFC3339 date-time`);
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeCanonical(value: unknown, errors: string[]): string {
  try {
    return canonicalJson(value);
  } catch (error) {
    errors.push(`EVIDENCE_CANONICALIZATION_FAILED: ${messageOf(error)}`);
    return '';
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
