import type { AssuranceProfile, ControlDefinition } from '@l9/assurance-contracts';

export function parseControlDefinition(text: string): ControlDefinition {
  const value = parseObject(text, 'control');
  validateControl(value);
  return value as unknown as ControlDefinition;
}

export function parseAssuranceProfile(text: string): AssuranceProfile {
  const value = parseObject(text, 'profile');
  validateProfile(value);
  return value as unknown as AssuranceProfile;
}

function validateControl(value: Readonly<Record<string, unknown>>): void {
  exactKeys(value, 'control', [
    'id', 'version', 'claim', 'title', 'description', 'severity', 'applicability',
    'evidenceRequirements', 'dependencies', 'evaluation', 'freshness', 'waiver',
  ]);
  for (const key of ['id', 'version', 'claim', 'title', 'description']) requireString(value, key, 'control');
  requireSemVer(value.version, 'control.version');
  requireEnum(value.severity, ['mandatory', 'advisory'], 'control.severity');
  if (value.applicability !== undefined) {
    const applicability = requireRecord(value.applicability, 'control.applicability');
    exactKeys(applicability, 'control.applicability', ['subjectKind']);
    requireString(applicability, 'subjectKind', 'control.applicability');
  }
  if (!Array.isArray(value.evidenceRequirements)) throw new Error('control.evidenceRequirements must be an array');
  value.evidenceRequirements.forEach((requirement, index) => validateRequirement(requirement, index));
  if (value.dependencies !== undefined) {
    if (!Array.isArray(value.dependencies)) throw new Error('control.dependencies must be an array');
    value.dependencies.forEach((dependency, index) => {
      const item = requireRecord(dependency, `control.dependencies[${index}]`);
      exactKeys(item, `control.dependencies[${index}]`, ['id', 'version']);
      requireString(item, 'id', `control.dependencies[${index}]`);
      requireString(item, 'version', `control.dependencies[${index}]`);
      requireSemVer(item.version, `control.dependencies[${index}].version`);
    });
  }
  const evaluation = requireRecord(value.evaluation, 'control.evaluation');
  exactKeys(evaluation, 'control.evaluation', ['type', 'mandatoryFindingSeverities']);
  requireEnum(evaluation.type, ['all-requirements-satisfied', 'no-matching-findings', 'exact-subject-consistency'], 'control.evaluation.type');
  if (evaluation.mandatoryFindingSeverities !== undefined) {
    requireEnumArray(evaluation.mandatoryFindingSeverities, ['critical', 'high', 'medium', 'low', 'informational'], 'control.evaluation.mandatoryFindingSeverities');
  }
  if (value.freshness !== undefined) validateFreshness(value.freshness, 'control.freshness');
  if (value.waiver !== undefined) {
    const waiver = requireRecord(value.waiver, 'control.waiver');
    exactKeys(waiver, 'control.waiver', ['allowed', 'requiredRoles', 'maximumDurationSeconds']);
    if (typeof waiver.allowed !== 'boolean') throw new Error('control.waiver.allowed must be boolean');
    if (waiver.requiredRoles !== undefined) requireStringArray(waiver.requiredRoles, 'control.waiver.requiredRoles');
    if (waiver.maximumDurationSeconds !== undefined) requirePositiveInteger(waiver.maximumDurationSeconds, 'control.waiver.maximumDurationSeconds');
  }
}

function validateRequirement(value: unknown, index: number): void {
  const path = `control.evidenceRequirements[${index}]`;
  const requirement = requireRecord(value, path);
  exactKeys(requirement, path, [
    'producer', 'check', 'minimumCheckVersion', 'acceptedExecutionStatus',
    'cardinality', 'subjectBinding', 'freshness',
  ]);
  requireString(requirement, 'producer', path);
  requireString(requirement, 'check', path);
  if (requirement.minimumCheckVersion !== undefined) {
    requireString(requirement, 'minimumCheckVersion', path);
    requireSemVer(requirement.minimumCheckVersion, `${path}.minimumCheckVersion`);
  }
  requireEnumArray(requirement.acceptedExecutionStatus, ['passed', 'failed', 'error', 'skipped'], `${path}.acceptedExecutionStatus`);
  const cardinality = requireRecord(requirement.cardinality, `${path}.cardinality`);
  exactKeys(cardinality, `${path}.cardinality`, ['minimum', 'maximum']);
  requireNonNegativeInteger(cardinality.minimum, `${path}.cardinality.minimum`);
  requireNonNegativeInteger(cardinality.maximum, `${path}.cardinality.maximum`);
  if (Number(cardinality.maximum) < Number(cardinality.minimum)) {
    throw new Error(`${path}.cardinality.maximum must be >= minimum`);
  }
  const binding = requireRecord(requirement.subjectBinding, `${path}.subjectBinding`);
  exactKeys(binding, `${path}.subjectBinding`, ['exactRevision']);
  if (typeof binding.exactRevision !== 'boolean') throw new Error(`${path}.subjectBinding.exactRevision must be boolean`);
  if (requirement.freshness !== undefined) validateFreshness(requirement.freshness, `${path}.freshness`);
}

function validateFreshness(value: unknown, path: string): void {
  const freshness = requireRecord(value, path);
  exactKeys(freshness, path, ['mode', 'maximumAgeSeconds']);
  requireEnum(freshness.mode, ['revision-bound', 'duration'], `${path}.mode`);
  if (freshness.mode === 'duration') requirePositiveInteger(freshness.maximumAgeSeconds, `${path}.maximumAgeSeconds`);
  else if (freshness.maximumAgeSeconds !== undefined) requirePositiveInteger(freshness.maximumAgeSeconds, `${path}.maximumAgeSeconds`);
}

function validateProfile(value: Readonly<Record<string, unknown>>): void {
  exactKeys(value, 'profile', ['id', 'version', 'title', 'subjectKinds', 'controls', 'defaultPolicy', 'outputClaims', 'compatibility']);
  for (const key of ['id', 'version', 'title']) requireString(value, key, 'profile');
  requireSemVer(value.version, 'profile.version');
  requireStringArray(value.subjectKinds, 'profile.subjectKinds');
  validateReferences(value.controls, 'profile.controls');
  const policy = requireRecord(value.defaultPolicy, 'profile.defaultPolicy');
  exactKeys(policy, 'profile.defaultPolicy', ['id', 'version']);
  requireString(policy, 'id', 'profile.defaultPolicy');
  requireString(policy, 'version', 'profile.defaultPolicy');
  requireSemVer(policy.version, 'profile.defaultPolicy.version');
  validateReferences(value.outputClaims, 'profile.outputClaims');
  if (value.compatibility !== undefined) {
    const compatibility = requireRecord(value.compatibility, 'profile.compatibility');
    exactKeys(compatibility, 'profile.compatibility', ['minimumAssuranceVersion', 'minimumSchemaVersion']);
    for (const key of ['minimumAssuranceVersion', 'minimumSchemaVersion']) {
      if (compatibility[key] !== undefined) {
        requireString(compatibility, key, 'profile.compatibility');
        requireSemVer(compatibility[key], `profile.compatibility.${key}`);
      }
    }
  }
}

function validateReferences(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${path} must be a non-empty array`);
  const seen = new Set<string>();
  value.forEach((reference, index) => {
    const item = requireRecord(reference, `${path}[${index}]`);
    exactKeys(item, `${path}[${index}]`, ['id', 'version']);
    requireString(item, 'id', `${path}[${index}]`);
    requireString(item, 'version', `${path}[${index}]`);
    requireSemVer(item.version, `${path}[${index}].version`);
    const key = `${String(item.id)}@${String(item.version)}`;
    if (seen.has(key)) throw new Error(`${path} contains duplicate ${key}`);
    seen.add(key);
  });
}

function parseObject(text: string, label: string): Readonly<Record<string, unknown>> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid deterministic JSON-compatible YAML ${label}: ${messageOf(error)}`);
  }
  return requireRecord(value, label);
}

function exactKeys(record: Readonly<Record<string, unknown>>, path: string, allowed: readonly string[]): void {
  const set = new Set(allowed);
  for (const key of Object.keys(record)) if (!set.has(key)) throw new Error(`${path}.${key} is an unknown property`);
}
function requireRecord(value: unknown, path: string): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as Readonly<Record<string, unknown>>;
}
function requireString(record: Readonly<Record<string, unknown>>, key: string, path: string): void {
  if (typeof record[key] !== 'string' || !String(record[key]).trim()) throw new Error(`${path}.${key} must be a non-empty string`);
}
function requireStringArray(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`${path} must be an array of non-empty strings`);
}
function requireEnum(value: unknown, allowed: readonly string[], path: string): void {
  if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(`${path} must be one of ${allowed.join(', ')}`);
}
function requireEnumArray(value: unknown, allowed: readonly string[], path: string): void {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !allowed.includes(item))) {
    throw new Error(`${path} must contain only ${allowed.join(', ')}`);
  }
}
function requireSemVer(value: unknown, path: string): void { if (typeof value !== 'string' || !parseSemVer(value)) throw new Error(`${path} must be semantic version`); }
function requireNonNegativeInteger(value: unknown, path: string): void { if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${path} must be integer >= 0`); }
function requirePositiveInteger(value: unknown, path: string): void { if (!Number.isInteger(value) || Number(value) < 1) throw new Error(`${path} must be integer >= 1`); }
function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error); }

function parseSemVer(value: string): boolean { return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value); }
