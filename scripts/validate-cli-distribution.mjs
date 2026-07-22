import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { ROOT } from './lib/files.mjs';

const workspaceNames = [
  'contracts',
  'evidence',
  'controls',
  'policy',
  'evaluator',
  'conformance',
  'cli',
  'testing',
];
const temporaryRoot = mkdtempSync(join(tmpdir(), 'l9-assurance-distribution-'));
const packRoot = join(temporaryRoot, 'packs');
const consumerRoot = join(temporaryRoot, 'consumer');
mkdirSync(packRoot, { recursive: true });
mkdirSync(consumerRoot, { recursive: true });

try {
  const dependencies = {};
  for (const workspace of workspaceNames) {
    const workspaceRoot = join(ROOT, 'packages', workspace);
    const result = spawnSync(
      'npm',
      ['pack', '--json', '--pack-destination', packRoot, '--ignore-scripts'],
      { cwd: workspaceRoot, encoding: 'utf8' },
    );
    if (result.status !== 0) {
      throw new Error(`npm pack failed for ${workspace}: ${result.stderr || result.stdout}`);
    }
    const records = JSON.parse(result.stdout);
    const filename = records[0]?.filename;
    if (typeof filename !== 'string') throw new Error(`npm pack returned no filename for ${workspace}`);
    const manifest = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8'));
    dependencies[manifest.name] = `file:${join(packRoot, basename(filename))}`;
  }
  writeFileSync(
    join(consumerRoot, 'package.json'),
    `${JSON.stringify({ name: 'l9-assurance-distribution-proof', private: true, type: 'module', dependencies }, null, 2)}\n`,
    'utf8',
  );
  const install = spawnSync(
    'npm',
    ['install', '--ignore-scripts', '--offline', '--no-audit', '--no-fund', '--package-lock=false'],
    { cwd: consumerRoot, encoding: 'utf8' },
  );
  if (install.status !== 0) throw new Error(`offline consumer install failed: ${install.stderr || install.stdout}`);
  const subjectPath = join(consumerRoot, 'subject.json');
  const planPath = join(consumerRoot, 'assurance-plan.json');
  cpSync(join(ROOT, 'fixtures', 'valid', 'subject.json'), subjectPath);
  const cliPath = join(consumerRoot, 'node_modules', '@l9', 'assurance-cli', 'dist', 'bin.js');
  const protocolManifest = join(
    consumerRoot,
    'node_modules',
    '@l9',
    'assurance-cli',
    'protocol',
    'release-zero',
    'manifest.json',
  );
  if (!existsSync(protocolManifest)) throw new Error('CLI package omitted embedded protocol manifest');
  const execution = spawnSync(
    process.execPath,
    [cliPath, 'plan', '--profile', 'l9.pull-request@1', '--subject', subjectPath, '--output', planPath],
    { cwd: consumerRoot, encoding: 'utf8' },
  );
  if (execution.status !== 0) {
    throw new Error(`installed CLI plan command failed: ${execution.stderr || execution.stdout}`);
  }
  const verification = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      [
        "import { readFileSync } from 'node:fs';",
        "import { verifyPlan } from '@l9/assurance-cli';",
        `const plan=JSON.parse(readFileSync(${JSON.stringify(planPath)},'utf8'));`,
        'const report=verifyPlan(plan);',
        "if(!report.valid) throw new Error(report.reasons.join('; '));",
        "if(plan.controls.length!==7||plan.requiredChecks.length!==6) throw new Error('unexpected Release-zero plan cardinality');",
      ].join(''),
    ],
    { cwd: consumerRoot, encoding: 'utf8' },
  );
  if (verification.status !== 0) {
    throw new Error(`installed CLI plan verification failed: ${verification.stderr || verification.stdout}`);
  }
  console.log('Validated self-contained CLI distribution from eight local tarballs without a repository checkout.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
