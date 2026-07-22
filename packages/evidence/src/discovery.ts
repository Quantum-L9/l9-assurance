import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

export interface DiscoveredJson {
  readonly path: string;
  readonly value: unknown;
  readonly bytes: number;
}

export interface DiscoveryLimits {
  readonly maximumCount: number;
  readonly maximumFileBytes: number;
}

const DEFAULT_DISCOVERY_LIMITS: DiscoveryLimits = Object.freeze({
  maximumCount: 1_000,
  maximumFileBytes: 1_048_576,
});

export function discoverJsonArtifacts(
  root: string,
  maximumCountOrLimits: number | Partial<DiscoveryLimits> = DEFAULT_DISCOVERY_LIMITS.maximumCount,
): readonly DiscoveredJson[] {
  const limits: DiscoveryLimits = typeof maximumCountOrLimits === 'number'
    ? { ...DEFAULT_DISCOVERY_LIMITS, maximumCount: maximumCountOrLimits }
    : { ...DEFAULT_DISCOVERY_LIMITS, ...maximumCountOrLimits };
  assertPositiveInteger(limits.maximumCount, 'maximumCount');
  assertPositiveInteger(limits.maximumFileBytes, 'maximumFileBytes');

  const absoluteRoot = resolve(root);
  const rootStat = lstatSync(absoluteRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error(`EVIDENCE_POLICY_INADMISSIBLE: symbolic link is prohibited: ${absoluteRoot}`);
  }
  const realRoot = realpathSync(absoluteRoot);
  const output: DiscoveredJson[] = [];

  const addFile = (candidate: string): void => {
    if (extname(candidate).toLowerCase() !== '.json') {
      throw new Error(`EVIDENCE_MEDIA_TYPE_UNSUPPORTED: expected .json: ${candidate}`);
    }
    if (output.length >= limits.maximumCount) {
      throw new Error(`EVIDENCE_LIMIT_EXCEEDED: artifact count exceeds ${limits.maximumCount}`);
    }
    const stat = lstatSync(candidate);
    if (!stat.isFile()) throw new Error(`EVIDENCE_POLICY_INADMISSIBLE: expected regular file: ${candidate}`);
    if (stat.size > limits.maximumFileBytes) {
      throw new Error(`EVIDENCE_TOO_LARGE: ${candidate} is ${stat.size} bytes`);
    }
    const text = readFileSync(candidate, 'utf8');
    const bytes = new TextEncoder().encode(text).byteLength;
    if (bytes > limits.maximumFileBytes) {
      throw new Error(`EVIDENCE_TOO_LARGE: ${candidate} is ${bytes} bytes`);
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (error) {
      throw new Error(`EVIDENCE_SCHEMA_INVALID: ${candidate}: ${messageOf(error)}`);
    }
    output.push({ path: candidate, value, bytes });
  };

  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const candidate = join(directory, name);
      const stat = lstatSync(candidate);
      if (stat.isSymbolicLink()) {
        throw new Error(`EVIDENCE_POLICY_INADMISSIBLE: symbolic link is prohibited: ${candidate}`);
      }
      const real = realpathSync(candidate);
      assertContained(realRoot, real, candidate);
      if (stat.isDirectory()) visit(candidate);
      else if (stat.isFile() && extname(name).toLowerCase() === '.json') addFile(candidate);
    }
  };

  if (rootStat.isDirectory()) visit(realRoot);
  else {
    assertContained(realRoot, realRoot, absoluteRoot);
    addFile(realRoot);
  }
  return Object.freeze(output);
}

function assertContained(root: string, candidate: string, displayPath: string): void {
  const rel = relative(root, candidate);
  if (rel === '..' || rel.startsWith(`..${sep}`)) {
    throw new Error(`EVIDENCE_POLICY_INADMISSIBLE: path escapes evidence root: ${displayPath}`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
