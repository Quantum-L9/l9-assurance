import type { AssuranceDecision, VerificationReport } from '@l9/assurance-contracts';
import { canonicalJson, sha256Digest } from '@l9/assurance-evidence';

const DIGEST = /^[a-f0-9]{64}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const COMMIT = /^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/;

export function verifyDecision(value: unknown): VerificationReport {
  const reasons: string[] = [];
  if (!isRecord(value)) return { valid: false, signatureStatus: 'not-present', reasons: ['decision must be object'] };
  validateDecision(value, reasons);

  let digest: string | undefined;
  try {
    canonicalJson(value);
    digest = sha256Digest(value).value;
  } catch (error) {
    reasons.push(messageOf(error));
  }

  const signature = isRecord(value.signature) ? value.signature : undefined;
  let signatureStatus: VerificationReport['signatureStatus'] = 'not-present';
  if (signature) {
    if (signature.algorithm === 'TEST_HMAC_SHA256') {
      signatureStatus = 'invalid';
      reasons.push('test signing algorithm is rejected by production verification');
    } else {
      signatureStatus = 'unsupported';
      reasons.push(`unsupported signature algorithm ${String(signature.algorithm)}`);
    }
  }

  const report = {
    valid: reasons.length === 0,
    decisionId: typeof value.decisionId === 'string' ? value.decisionId : undefined,
    digest,
    signatureStatus,
    reasons: Object.freeze([...new Set(reasons)].sort()),
  };
  return withoutUndefined(report);
}

function validateDecision(value: Readonly<Record<string, unknown>>, reasons: string[]): void {
  exactKeys(value, '$', [
    'schema', 'schemaVersion', 'decisionId', 'subject', 'profile', 'policy', 'verdict',
    'controlResults', 'claims', 'evidenceManifest', 'waivers', 'unknowns', 'dimensions',
    'issuedAt', 'evaluator', 'supersedes', 'signature', 'extensions',
  ], reasons);
  if (value.schema !== 'l9.assurance-decision' || value.schemaVersion !== '1.0.0') reasons.push('unsupported decision schema');
  requireString(value, 'decisionId', '$', reasons);
  validateSubject(value.subject, '$.subject', reasons);
  validateVersionedDigest(value.profile, '$.profile', reasons);
  validateVersionedDigest(value.policy, '$.policy', reasons);
  if (!['pass', 'fail', 'conditional', 'indeterminate'].includes(String(value.verdict))) reasons.push('$.verdict is invalid');
  requireDate(value.issuedAt, '$.issuedAt', reasons);
  validateProducer(value.evaluator, '$.evaluator', reasons);
  if (value.supersedes !== undefined && (typeof value.supersedes !== 'string' || !value.supersedes)) reasons.push('$.supersedes must be non-empty string');
  if (value.extensions !== undefined && !isRecord(value.extensions)) reasons.push('$.extensions must be an object');
  if (value.signature !== undefined) validateSignature(value.signature, '$.signature', reasons);

  const controlResults = validateControlResults(value.controlResults, reasons);
  const evidenceIds = validateEvidenceManifest(value.evidenceManifest, reasons);
  const waiverIds = validateWaivers(value.waivers, reasons);
  const unknownIds = validateUnknowns(value.unknowns, reasons);
  validateClaims(value.claims, new Set(controlResults.map((item) => item.controlId)), reasons);
  validateDimensions(value.dimensions, reasons);

  for (const result of controlResults) {
    for (const reference of result.evidenceRefs) if (!evidenceIds.has(reference)) reasons.push(`$.controlResults ${result.controlId} references missing evidence ${reference}`);
    for (const reference of result.waiverRefs) if (!waiverIds.has(reference)) reasons.push(`$.controlResults ${result.controlId} references missing waiver ${reference}`);
    for (const reference of result.unknownRefs) if (!unknownIds.has(reference)) reasons.push(`$.controlResults ${result.controlId} references missing unknown ${reference}`);
  }
  const reduced = reduceVerdict(controlResults);
  if (typeof value.verdict === 'string' && reduced !== value.verdict) reasons.push(`$.verdict ${String(value.verdict)} does not match control reduction ${reduced}`);
}

function validateControlResults(value: unknown, reasons: string[]): ControlProjection[] {
  if (!Array.isArray(value)) {
    reasons.push('$.controlResults must be an array');
    return [];
  }
  const output: ControlProjection[] = [];
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.controlResults[${index}]`;
    if (!isRecord(item)) { reasons.push(`${path} must be an object`); return; }
    exactKeys(item, path, ['controlId', 'controlVersion', 'status', 'severity', 'evidenceRefs', 'waiverRefs', 'unknownRefs', 'reasons', 'evaluatedAt'], reasons);
    requireString(item, 'controlId', path, reasons);
    requireString(item, 'controlVersion', path, reasons);
    if (typeof item.controlVersion === 'string' && !SEMVER.test(item.controlVersion)) reasons.push(`${path}.controlVersion must be semantic`);
    if (typeof item.controlId === 'string') {
      if (ids.has(item.controlId)) reasons.push(`duplicate control result ${item.controlId}`);
      ids.add(item.controlId);
    }
    if (!['pass', 'fail', 'conditional', 'indeterminate', 'not-applicable'].includes(String(item.status))) reasons.push(`${path}.status is invalid`);
    if (!['mandatory', 'advisory'].includes(String(item.severity))) reasons.push(`${path}.severity is invalid`);
    const evidenceRefs = stringArray(item.evidenceRefs, `${path}.evidenceRefs`, reasons);
    const waiverRefs = stringArray(item.waiverRefs, `${path}.waiverRefs`, reasons);
    const unknownRefs = stringArray(item.unknownRefs, `${path}.unknownRefs`, reasons);
    if (!Array.isArray(item.reasons) || item.reasons.length === 0) reasons.push(`${path}.reasons must be a non-empty array`);
    else item.reasons.forEach((reason, reasonIndex) => {
      const reasonPath = `${path}.reasons[${reasonIndex}]`;
      if (!isRecord(reason)) { reasons.push(`${reasonPath} must be an object`); return; }
      exactKeys(reason, reasonPath, ['code', 'message'], reasons);
      requireString(reason, 'code', reasonPath, reasons);
      requireString(reason, 'message', reasonPath, reasons);
    });
    requireDate(item.evaluatedAt, `${path}.evaluatedAt`, reasons);
    if (typeof item.controlId === 'string' && typeof item.status === 'string' && typeof item.severity === 'string') {
      output.push({ controlId: item.controlId, status: item.status, severity: item.severity, evidenceRefs, waiverRefs, unknownRefs });
    }
  });
  return output;
}

function validateClaims(value: unknown, controls: Set<string>, reasons: string[]): void {
  if (!Array.isArray(value)) { reasons.push('$.claims must be an array'); return; }
  const keys = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.claims[${index}]`;
    if (!isRecord(item)) { reasons.push(`${path} must be an object`); return; }
    exactKeys(item, path, ['claimId', 'claimVersion', 'status', 'controlRefs'], reasons);
    requireString(item, 'claimId', path, reasons);
    requireString(item, 'claimVersion', path, reasons);
    if (typeof item.claimVersion === 'string' && !SEMVER.test(item.claimVersion)) reasons.push(`${path}.claimVersion must be semantic`);
    if (!['supported', 'unsupported', 'conditional', 'indeterminate'].includes(String(item.status))) reasons.push(`${path}.status is invalid`);
    const refs = stringArray(item.controlRefs, `${path}.controlRefs`, reasons);
    for (const ref of refs) if (!controls.has(ref)) reasons.push(`${path} references missing control ${ref}`);
    if (typeof item.claimId === 'string' && typeof item.claimVersion === 'string') {
      const key = `${item.claimId}@${item.claimVersion}`;
      if (keys.has(key)) reasons.push(`duplicate claim result ${key}`);
      keys.add(key);
    }
  });
}

function validateEvidenceManifest(value: unknown, reasons: string[]): Set<string> {
  if (!Array.isArray(value)) { reasons.push('$.evidenceManifest must be an array'); return new Set(); }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.evidenceManifest[${index}]`;
    if (!isRecord(item)) { reasons.push(`${path} must be an object`); return; }
    exactKeys(item, path, ['evidenceId', 'digest', 'evidenceType'], reasons);
    requireString(item, 'evidenceId', path, reasons);
    validateDigest(item.digest, `${path}.digest`, reasons);
    if (item.evidenceType !== undefined && (typeof item.evidenceType !== 'string' || !item.evidenceType)) reasons.push(`${path}.evidenceType must be non-empty string`);
    if (typeof item.evidenceId === 'string') {
      if (ids.has(item.evidenceId)) reasons.push(`duplicate evidence manifest ID ${item.evidenceId}`);
      ids.add(item.evidenceId);
    }
  });
  return ids;
}

function validateWaivers(value: unknown, reasons: string[]): Set<string> {
  if (!Array.isArray(value)) { reasons.push('$.waivers must be an array'); return new Set(); }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.waivers[${index}]`;
    if (!isRecord(item)) { reasons.push(`${path} must be an object`); return; }
    exactKeys(item, path, ['waiverId', 'controlId'], reasons);
    requireString(item, 'waiverId', path, reasons);
    requireString(item, 'controlId', path, reasons);
    if (typeof item.waiverId === 'string') {
      if (ids.has(item.waiverId)) reasons.push(`duplicate waiver ${item.waiverId}`);
      ids.add(item.waiverId);
    }
  });
  return ids;
}

function validateUnknowns(value: unknown, reasons: string[]): Set<string> {
  if (!Array.isArray(value)) { reasons.push('$.unknowns must be an array'); return new Set(); }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.unknowns[${index}]`;
    if (!isRecord(item)) { reasons.push(`${path} must be an object`); return; }
    exactKeys(item, path, ['unknownId', 'category', 'description', 'impact', 'relatedControls', 'resolvableBy'], reasons);
    requireString(item, 'unknownId', path, reasons);
    requireString(item, 'description', path, reasons);
    if (!['missing-evidence', 'invalid-evidence', 'stale-evidence', 'unsupported-check', 'unverified-producer', 'policy-ambiguity', 'environment-uncertainty', 'external-dependency', 'other'].includes(String(item.category))) reasons.push(`${path}.category is invalid`);
    if (!['none', 'advisory', 'control', 'decision'].includes(String(item.impact))) reasons.push(`${path}.impact is invalid`);
    stringArray(item.relatedControls, `${path}.relatedControls`, reasons);
    if (item.resolvableBy !== undefined) stringArray(item.resolvableBy, `${path}.resolvableBy`, reasons);
    if (typeof item.unknownId === 'string') {
      if (ids.has(item.unknownId)) reasons.push(`duplicate unknown ${item.unknownId}`);
      ids.add(item.unknownId);
    }
  });
  return ids;
}

function validateDimensions(value: unknown, reasons: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) { reasons.push('$.dimensions must be an object'); return; }
  exactKeys(value, '$.dimensions', ['controlSatisfaction', 'evidenceCompleteness', 'evidenceFreshness', 'producerTrust'], reasons);
  for (const [key, item] of Object.entries(value)) if (typeof item !== 'number' || !Number.isFinite(item) || item < 0 || item > 1) reasons.push(`$.dimensions.${key} must be a number from 0 to 1`);
}

function validateSubject(value: unknown, path: string, reasons: string[]): void {
  if (!isRecord(value)) { reasons.push(`${path} must be an object`); return; }
  exactKeys(value, path, ['kind', 'repository', 'revision', 'metadata'], reasons);
  if (value.kind !== 'git-revision') reasons.push(`${path}.kind must be git-revision`);
  if (!isRecord(value.repository)) reasons.push(`${path}.repository must be an object`);
  else {
    exactKeys(value.repository, `${path}.repository`, ['host', 'owner', 'name'], reasons);
    for (const key of ['host', 'owner', 'name']) requireString(value.repository, key, `${path}.repository`, reasons);
  }
  if (!isRecord(value.revision)) reasons.push(`${path}.revision must be an object`);
  else {
    exactKeys(value.revision, `${path}.revision`, ['commit', 'treeDigest'], reasons);
    requireString(value.revision, 'commit', `${path}.revision`, reasons);
    if (typeof value.revision.commit === 'string' && !COMMIT.test(value.revision.commit)) reasons.push(`${path}.revision.commit must be a full hex commit`);
    if (value.revision.treeDigest !== undefined) validateDigest(value.revision.treeDigest, `${path}.revision.treeDigest`, reasons);
  }
  if (value.metadata !== undefined) {
    if (!isRecord(value.metadata)) reasons.push(`${path}.metadata must be an object`);
    else for (const [key, item] of Object.entries(value.metadata)) if (typeof item !== 'string') reasons.push(`${path}.metadata.${key} must be string`);
  }
}

function validateVersionedDigest(value: unknown, path: string, reasons: string[]): void {
  if (!isRecord(value)) { reasons.push(`${path} must be an object`); return; }
  exactKeys(value, path, ['id', 'version', 'digest'], reasons);
  requireString(value, 'id', path, reasons);
  requireString(value, 'version', path, reasons);
  if (typeof value.version === 'string' && !SEMVER.test(value.version)) reasons.push(`${path}.version must be semantic`);
  validateDigest(value.digest, `${path}.digest`, reasons);
}

function validateProducer(value: unknown, path: string, reasons: string[]): void {
  if (!isRecord(value)) { reasons.push(`${path} must be an object`); return; }
  exactKeys(value, path, ['id', 'version', 'buildDigest', 'executionIdentity', 'repository'], reasons);
  requireString(value, 'id', path, reasons);
  requireString(value, 'version', path, reasons);
  if (typeof value.version === 'string' && !SEMVER.test(value.version)) reasons.push(`${path}.version must be semantic`);
  if (value.buildDigest !== undefined) validateDigest(value.buildDigest, `${path}.buildDigest`, reasons);
  for (const key of ['executionIdentity', 'repository']) if (value[key] !== undefined && (typeof value[key] !== 'string' || !value[key])) reasons.push(`${path}.${key} must be non-empty string`);
}

function validateSignature(value: unknown, path: string, reasons: string[]): void {
  if (!isRecord(value)) { reasons.push(`${path} must be an object`); return; }
  exactKeys(value, path, ['keyId', 'algorithm', 'value', 'signedAt', 'context'], reasons);
  for (const key of ['keyId', 'algorithm', 'value', 'signedAt']) requireString(value, key, path, reasons);
  requireDate(value.signedAt, `${path}.signedAt`, reasons);
  if (value.context !== undefined && (typeof value.context !== 'string' || !value.context)) reasons.push(`${path}.context must be non-empty string`);
}

function validateDigest(value: unknown, path: string, reasons: string[]): void {
  if (!isRecord(value)) { reasons.push(`${path} must be an object`); return; }
  exactKeys(value, path, ['algorithm', 'value'], reasons);
  if (value.algorithm !== 'sha256' || typeof value.value !== 'string' || !DIGEST.test(value.value)) reasons.push(`${path} must be sha256 digest`);
}

function reduceVerdict(results: readonly ControlProjection[]): string {
  const mandatory = results.filter((result) => result.severity === 'mandatory' && result.status !== 'not-applicable');
  if (mandatory.some((result) => result.status === 'fail')) return 'fail';
  if (mandatory.some((result) => result.status === 'indeterminate')) return 'indeterminate';
  if (mandatory.some((result) => result.status === 'conditional')) return 'conditional';
  return 'pass';
}

interface ControlProjection {
  readonly controlId: string;
  readonly status: string;
  readonly severity: string;
  readonly evidenceRefs: readonly string[];
  readonly waiverRefs: readonly string[];
  readonly unknownRefs: readonly string[];
}

function stringArray(value: unknown, path: string, reasons: string[]): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item)) {
    reasons.push(`${path} must be a string array`);
    return [];
  }
  const strings = value as string[];
  if (new Set(strings).size !== strings.length) reasons.push(`${path} contains duplicate values`);
  return strings;
}
function exactKeys(record: Readonly<Record<string, unknown>>, path: string, allowed: readonly string[], reasons: string[]): void { const set = new Set(allowed); for (const key of Object.keys(record)) if (!set.has(key)) reasons.push(`${path}.${key} is an unknown property`); }
function requireString(record: Readonly<Record<string, unknown>>, key: string, path: string, reasons: string[]): void { if (typeof record[key] !== 'string' || !String(record[key]).trim()) reasons.push(`${path}.${key} must be a non-empty string`); }
function requireDate(value: unknown, path: string, reasons: string[]): void { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) reasons.push(`${path} must be RFC3339 date-time`); }
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function withoutUndefined(value: { valid: boolean; decisionId: string | undefined; digest: string | undefined; signatureStatus: VerificationReport['signatureStatus']; reasons: readonly string[] }): VerificationReport { return { valid: value.valid, ...(value.decisionId ? { decisionId: value.decisionId } : {}), ...(value.digest ? { digest: value.digest } : {}), signatureStatus: value.signatureStatus, reasons: value.reasons }; }
