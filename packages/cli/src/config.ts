import type { AssurancePolicy, AssuranceProfile, CheckRegistry, ControlDefinition, ProducerRegistry } from '@l9/assurance-contracts';
import { parseAssuranceProfile, parseControlDefinition, resolveProfile } from '@l9/assurance-controls';
import { parseSemVer } from '@l9/assurance-evidence';
import { parseAssurancePolicy } from '@l9/assurance-policy';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile } from './io.js';

export interface BuiltInConfiguration {
  readonly producerRegistry: ProducerRegistry;
  readonly checkRegistry: CheckRegistry;
  readonly profile: AssuranceProfile;
  readonly policy: AssurancePolicy;
  readonly controls: readonly ControlDefinition[];
}

export function loadBuiltInConfiguration(root: string): BuiltInConfiguration {
  const controlsDirectory = join(root, 'controls', 'ci');
  const controls = readdirSync(controlsDirectory)
    .filter((name) => name.endsWith('.yaml'))
    .sort()
    .map((name) => parseControlDefinition(readFileSync(join(controlsDirectory, name), 'utf8')));
  const producerRegistry = readJsonFile<unknown>(join(root, 'registry', 'producers.yaml'));
  const checkRegistry = readJsonFile<unknown>(join(root, 'registry', 'checks.yaml'));
  const profile = parseAssuranceProfile(readFileSync(join(root, 'profiles', 'pull-request', 'profile.yaml'), 'utf8'));
  const policy = parseAssurancePolicy(readFileSync(join(root, 'profiles', 'pull-request', 'policy.yaml'), 'utf8'));
  validateProducerRegistry(producerRegistry);
  validateCheckRegistry(checkRegistry);
  validateRegistryRelationships(producerRegistry, checkRegistry);
  if (profile.defaultPolicy.id !== policy.id || profile.defaultPolicy.version !== policy.version) {
    throw new Error(`Profile default policy ${profile.defaultPolicy.id}@${profile.defaultPolicy.version} does not match loaded ${policy.id}@${policy.version}`);
  }
  resolveProfile(profile, controls);
  return {
    producerRegistry,
    checkRegistry,
    profile,
    policy,
    controls: Object.freeze(controls),
  };
}

function validateProducerRegistry(value: unknown): asserts value is ProducerRegistry {
  const registry = requireRecord(value, 'producer registry');
  exactKeys(registry, 'producer registry', ['schema_version', 'producers']);
  if (registry.schema_version !== '1.0.0') throw new Error('Producer registry schema_version must be 1.0.0');
  if (!Array.isArray(registry.producers) || registry.producers.length === 0) throw new Error('Producer registry must contain producers');
  const ids = new Set<string>();
  registry.producers.forEach((producer, index) => {
    const path = `producer registry.producers[${index}]`;
    const item = requireRecord(producer, path);
    exactKeys(item, path, ['id', 'repository', 'authorization_status', 'candidate_version_range', 'allowed_versions', 'subject_kinds', 'checks', 'unknown_reference']);
    requireString(item, 'id', path);
    requireString(item, 'repository', path);
    if (ids.has(String(item.id))) throw new Error(`Duplicate producer ${String(item.id)}`);
    ids.add(String(item.id));
    requireEnum(item.authorization_status, ['trusted', 'pending', 'revoked'], `${path}.authorization_status`);
    if (item.candidate_version_range !== undefined) requireString(item, 'candidate_version_range', path);
    if (item.allowed_versions !== null && item.allowed_versions !== undefined) requireString(item, 'allowed_versions', path);
    if (item.authorization_status === 'trusted' && typeof item.allowed_versions !== 'string') throw new Error(`${path}.allowed_versions is required for trusted producer`);
    requireStringArray(item.subject_kinds, `${path}.subject_kinds`);
    requireStringArray(item.checks, `${path}.checks`);
    if (item.unknown_reference !== undefined) requireString(item, 'unknown_reference', path);
  });
}

function validateCheckRegistry(value: unknown): asserts value is CheckRegistry {
  const registry = requireRecord(value, 'check registry');
  exactKeys(registry, 'check registry', ['schema_version', 'checks']);
  if (registry.schema_version !== '1.0.0') throw new Error('Check registry schema_version must be 1.0.0');
  if (!Array.isArray(registry.checks) || registry.checks.length === 0) throw new Error('Check registry must contain checks');
  const identities = new Set<string>();
  registry.checks.forEach((check, index) => {
    const path = `check registry.checks[${index}]`;
    const item = requireRecord(check, path);
    exactKeys(item, path, ['id', 'version', 'owner', 'output_schema', 'meaning', 'deterministic', 'revision_bound', 'accepted_execution_statuses', 'configuration_digest_required', 'superseded_versions', 'revoked_versions']);
    for (const key of ['id', 'version', 'owner', 'output_schema', 'meaning']) requireString(item, key, path);
    if (!parseSemVer(String(item.version))) throw new Error(`${path}.version must be semantic`);
    const identity = `${String(item.id)}@${String(item.version)}`;
    if (identities.has(identity)) throw new Error(`Duplicate check ${identity}`);
    identities.add(identity);
    if (typeof item.deterministic !== 'boolean') throw new Error(`${path}.deterministic must be boolean`);
    if (typeof item.revision_bound !== 'boolean') throw new Error(`${path}.revision_bound must be boolean`);
    if (typeof item.configuration_digest_required !== 'boolean') throw new Error(`${path}.configuration_digest_required must be boolean`);
    requireEnumArray(item.accepted_execution_statuses, ['passed', 'failed', 'error', 'skipped'], `${path}.accepted_execution_statuses`);
    requireStringArrayAllowEmpty(item.superseded_versions, `${path}.superseded_versions`);
    requireStringArrayAllowEmpty(item.revoked_versions, `${path}.revoked_versions`);
  });
}

function validateRegistryRelationships(producers: ProducerRegistry, checks: CheckRegistry): void {
  const producerById = new Map(producers.producers.map((producer) => [producer.id, producer]));
  const checkIds = new Set(checks.checks.map((check) => check.id));
  for (const producer of producers.producers) {
    for (const checkId of producer.checks) if (!checkIds.has(checkId)) throw new Error(`Producer ${producer.id} references unknown check ${checkId}`);
  }
  for (const check of checks.checks) {
    const owner = producerById.get(check.owner);
    if (!owner) throw new Error(`Check ${check.id} references unknown owner ${check.owner}`);
    if (!owner.checks.includes(check.id)) throw new Error(`Check ${check.id} is not authorized by owner ${check.owner}`);
  }
}

function exactKeys(record: Readonly<Record<string, unknown>>, path: string, allowed: readonly string[]): void { const set = new Set(allowed); for (const key of Object.keys(record)) if (!set.has(key)) throw new Error(`${path}.${key} is an unknown property`); }
function requireRecord(value: unknown, path: string): Readonly<Record<string, unknown>> { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object`); return value as Readonly<Record<string, unknown>>; }
function requireString(record: Readonly<Record<string, unknown>>, key: string, path: string): void { if (typeof record[key] !== 'string' || !String(record[key]).trim()) throw new Error(`${path}.${key} must be a non-empty string`); }
function requireStringArray(value: unknown, path: string): void { if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`${path} must be a non-empty string array`); }
function requireStringArrayAllowEmpty(value: unknown, path: string): void { if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`${path} must be a string array`); }
function requireEnum(value: unknown, allowed: readonly string[], path: string): void { if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(`${path} must be one of ${allowed.join(', ')}`); }
function requireEnumArray(value: unknown, allowed: readonly string[], path: string): void { if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !allowed.includes(item))) throw new Error(`${path} must contain only ${allowed.join(', ')}`); }
