import type { AssurancePolicy, Waiver } from '@l9/assurance-contracts';

export function parseAssurancePolicy(text: string): AssurancePolicy {
  const value = parseObject(text, 'policy');
  validatePolicy(value);
  return value as unknown as AssurancePolicy;
}

export function parseWaiver(text: string): Waiver {
  const value = parseObject(text, 'waiver');
  validateWaiver(value);
  return value as unknown as Waiver;
}

function validatePolicy(value: Readonly<Record<string, unknown>>): void {
  exactKeys(value, 'policy', [
    'id', 'version', 'title', 'controlOverrides', 'mandatoryFindingSeverities',
    'unknownHandling', 'waiverAuthorization', 'hardProhibitions', 'minimumPolicyVersion', 'extensions',
  ]);
  for (const key of ['id', 'version', 'title']) requireString(value, key, 'policy');
  requireSemVer(value.version, 'policy.version');
  if (value.minimumPolicyVersion !== undefined) {
    requireString(value, 'minimumPolicyVersion', 'policy');
    requireSemVer(value.minimumPolicyVersion, 'policy.minimumPolicyVersion');
  }
  if (!Array.isArray(value.controlOverrides)) throw new Error('policy.controlOverrides must be an array');
  const overrides = new Set<string>();
  value.controlOverrides.forEach((override, index) => {
    const path = `policy.controlOverrides[${index}]`;
    const item = requireRecord(override, path);
    exactKeys(item, path, ['controlId', 'severity', 'enabled', 'waiverAllowed']);
    requireString(item, 'controlId', path);
    if (overrides.has(String(item.controlId))) throw new Error(`policy.controlOverrides contains duplicate ${String(item.controlId)}`);
    overrides.add(String(item.controlId));
    if (item.severity !== undefined) requireEnum(item.severity, ['mandatory', 'advisory'], `${path}.severity`);
    for (const key of ['enabled', 'waiverAllowed']) {
      if (item[key] !== undefined && typeof item[key] !== 'boolean') throw new Error(`${path}.${key} must be boolean`);
    }
  });
  requireEnumArray(value.mandatoryFindingSeverities, ['critical', 'high', 'medium', 'low', 'informational'], 'policy.mandatoryFindingSeverities');
  const unknownHandling = requireRecord(value.unknownHandling, 'policy.unknownHandling');
  exactKeys(unknownHandling, 'policy.unknownHandling', ['mandatory', 'advisory']);
  requireEnum(unknownHandling.mandatory, ['indeterminate', 'fail'], 'policy.unknownHandling.mandatory');
  requireEnum(unknownHandling.advisory, ['indeterminate', 'ignore'], 'policy.unknownHandling.advisory');
  const waiverAuthorization = requireRecord(value.waiverAuthorization, 'policy.waiverAuthorization');
  exactKeys(waiverAuthorization, 'policy.waiverAuthorization', ['acceptedRoles', 'requireSignature']);
  requireStringArray(waiverAuthorization.acceptedRoles, 'policy.waiverAuthorization.acceptedRoles');
  if (typeof waiverAuthorization.requireSignature !== 'boolean') throw new Error('policy.waiverAuthorization.requireSignature must be boolean');
  if (!Array.isArray(value.hardProhibitions)) throw new Error('policy.hardProhibitions must be an array');
  if (value.hardProhibitions.length > 0) {
    throw new Error('policy.hardProhibitions are unsupported in Release zero without a positive trigger contract');
  }
  if (value.extensions !== undefined && !isRecord(value.extensions)) throw new Error('policy.extensions must be an object');
}

function validateWaiver(value: Readonly<Record<string, unknown>>): void {
  exactKeys(value, 'waiver', [
    'waiverId', 'controlId', 'subjectScope', 'rationale', 'riskAcceptance',
    'authorizedBy', 'issuedAt', 'expiresAt', 'constraints', 'signature',
  ]);
  for (const key of ['waiverId', 'controlId', 'rationale', 'riskAcceptance', 'issuedAt', 'expiresAt']) requireString(value, key, 'waiver');
  requireDate(value.issuedAt, 'waiver.issuedAt');
  requireDate(value.expiresAt, 'waiver.expiresAt');
  if (Date.parse(String(value.expiresAt)) <= Date.parse(String(value.issuedAt))) throw new Error('waiver.expiresAt must be after issuedAt');
  const scope = requireRecord(value.subjectScope, 'waiver.subjectScope');
  exactKeys(scope, 'waiver.subjectScope', ['repository', 'commit']);
  const repository = requireRecord(scope.repository, 'waiver.subjectScope.repository');
  exactKeys(repository, 'waiver.subjectScope.repository', ['host', 'owner', 'name']);
  for (const key of ['host', 'owner', 'name']) requireString(repository, key, 'waiver.subjectScope.repository');
  requireString(scope, 'commit', 'waiver.subjectScope');
  if (scope.commit !== '*' && !/^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/.test(String(scope.commit))) {
    throw new Error('waiver.subjectScope.commit must be * or a full hex commit');
  }
  const authorizedBy = requireRecord(value.authorizedBy, 'waiver.authorizedBy');
  exactKeys(authorizedBy, 'waiver.authorizedBy', ['id', 'roles']);
  requireString(authorizedBy, 'id', 'waiver.authorizedBy');
  requireStringArray(authorizedBy.roles, 'waiver.authorizedBy.roles');
  if (value.constraints !== undefined && !isRecord(value.constraints)) throw new Error('waiver.constraints must be an object');
  if (value.signature !== undefined) validateSignature(value.signature, 'waiver.signature');
}

function validateSignature(value: unknown, path: string): void {
  const signature = requireRecord(value, path);
  exactKeys(signature, path, ['keyId', 'algorithm', 'value', 'signedAt', 'context']);
  for (const key of ['keyId', 'algorithm', 'value', 'signedAt']) requireString(signature, key, path);
  requireDate(signature.signedAt, `${path}.signedAt`);
  if (signature.context !== undefined) requireString(signature, 'context', path);
}

function parseObject(text: string, label: string): Readonly<Record<string, unknown>> {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch (error) { throw new Error(`Invalid deterministic JSON-compatible YAML ${label}: ${messageOf(error)}`); }
  return requireRecord(value, label);
}
function exactKeys(record: Readonly<Record<string, unknown>>, path: string, allowed: readonly string[]): void { const set = new Set(allowed); for (const key of Object.keys(record)) if (!set.has(key)) throw new Error(`${path}.${key} is an unknown property`); }
function requireRecord(value: unknown, path: string): Readonly<Record<string, unknown>> { if (!isRecord(value)) throw new Error(`${path} must be an object`); return value; }
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function requireString(record: Readonly<Record<string, unknown>>, key: string, path: string): void { if (typeof record[key] !== 'string' || !String(record[key]).trim()) throw new Error(`${path}.${key} must be a non-empty string`); }
function requireStringArray(value: unknown, path: string): void { if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`${path} must be a non-empty string array`); }
function requireEnum(value: unknown, allowed: readonly string[], path: string): void { if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(`${path} must be one of ${allowed.join(', ')}`); }
function requireEnumArray(value: unknown, allowed: readonly string[], path: string): void { if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !allowed.includes(item))) throw new Error(`${path} must contain only ${allowed.join(', ')}`); }
function requireSemVer(value: unknown, path: string): void { if (typeof value !== 'string' || !parseSemVer(value)) throw new Error(`${path} must be semantic version`); }
function requireDate(value: unknown, path: string): void { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error(`${path} must be RFC3339 date-time`); }
function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error); }

function parseSemVer(value: string): boolean { return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value); }
