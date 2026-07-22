import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ROOT } from './lib/files.mjs';

const mode = process.argv.includes('--check') ? 'check' : 'write';
const destination = join(ROOT, 'packages', 'cli', 'protocol', 'release-zero');
const explicitFiles = [
  'registry/producers.yaml',
  'registry/checks.yaml',
  'registry/claims.yaml',
  'registry/controls.yaml',
  'registry/profiles.yaml',
  'profiles/pull-request/profile.yaml',
  'profiles/pull-request/policy.yaml',
  'fixtures/conformance/canonicalization-v1.json',
  'fixtures/compatibility/producer-registry.trusted.json',
  'fixtures/compatibility/check-registry.json',
];
const recursiveRoots = ['controls/ci', 'schemas'];

function walk(root) {
  const output = [];
  for (const name of readdirSync(root).sort()) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) output.push(...walk(path));
    else if (stat.isFile()) output.push(path);
  }
  return output;
}

const sources = [...explicitFiles];
for (const root of recursiveRoots) {
  for (const path of walk(join(ROOT, root))) sources.push(relative(ROOT, path).split('\\').join('/'));
}
const uniqueSources = [...new Set(sources)].sort();
const files = uniqueSources.map((path) => {
  const bytes = readFileSync(join(ROOT, path));
  return { path, bytes, digest: sha256(bytes) };
});
const digestPreimage = {
  schema: 'l9.assurance-protocol-bundle',
  schemaVersion: '1.0.0',
  assuranceVersion: '2.0.1',
  canonicalization: 'l9.canonical-json/v1',
  files: files.map(({ path, digest }) => ({ path, digest })),
};
const manifest = {
  ...digestPreimage,
  sourceRepository: 'Quantum-L9/l9-assurance',
  sourceBaselineCommit: 'be8100797cae30eeca31763ea74c5f7eca7bde82',
  protocolDigest: { algorithm: 'sha256', value: sha256(Buffer.from(JSON.stringify(digestPreimage))) },
};
const expected = new Map(files.map(({ path, bytes }) => [path, bytes]));
expected.set('manifest.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));

if (mode === 'write') {
  rmSync(destination, { recursive: true, force: true });
  for (const [path, bytes] of expected) {
    const target = join(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  console.log(`Generated embedded protocol bundle with ${files.length} authority files and digest ${manifest.protocolDigest.value}.`);
} else {
  const errors = [];
  for (const [path, bytes] of expected) {
    const target = join(destination, path);
    if (!existsSync(target)) errors.push(`missing ${path}`);
    else if (!readFileSync(target).equals(bytes)) errors.push(`drift ${path}`);
  }
  if (existsSync(destination)) {
    for (const path of walk(destination).map((item) => relative(destination, item).split('\\').join('/'))) {
      if (!expected.has(path)) errors.push(`unexpected ${path}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Verified embedded protocol bundle: ${files.length} authority files, digest ${manifest.protocolDigest.value}.`);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
