import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJson, walkFiles } from './lib/files.mjs';

const report = readJson(join(ROOT, 'validation-report.json'));
const benchmark = readJson(join(ROOT, 'validation-benchmark.json'));
const errors = [];
const countFiles = (directory, suffix) =>
  walkFiles(join(ROOT, directory), (path) => path.endsWith(suffix)).length;

if (report.schema !== 'l9.assurance-build-validation' || report.schemaVersion !== '1.0.0') {
  errors.push('validation report schema identity is invalid');
}
if (report.status !== 'pass-with-unknowns') errors.push('validation report status must preserve Unknowns');
if (report.architectureDecision !== 'GO') errors.push('architecture decision is not GO');
if (report.authorityPromotionDecision !== 'NO_GO') errors.push('authority promotion must remain NO_GO');
if (!Array.isArray(report.unknowns) || report.unknowns.length === 0) errors.push('Unknown register is empty');
if (!Array.isArray(report.commands) || report.commands.some((item) => item.status !== 'pass')) {
  errors.push('validation command record contains a non-pass result');
}

const inventory = {
  sourceFiles: walkFiles(ROOT).length,
  workspaces: readdirSync(join(ROOT, 'packages')).length,
  schemas: countFiles('schemas/v1', '.schema.json'),
  controls: countFiles('controls/ci', '.yaml'),
  validObservationFixtures: countFiles('fixtures/valid', '.observation.json'),
  invalidObservationFixtures: countFiles('fixtures/invalid', '.observation.json'),
};
for (const [name, actual] of Object.entries(inventory)) {
  if (report.inventory?.[name] !== actual) {
    errors.push(`validation inventory ${name}=${report.inventory?.[name]} does not match ${actual}`);
  }
}

if (benchmark.schema !== 'l9.assurance-benchmark' || benchmark.schemaVersion !== '1.0.0') {
  errors.push('benchmark schema identity is invalid');
}
if (benchmark.passed !== true) errors.push('benchmark did not pass');
for (const [name, target] of Object.entries(benchmark.targets ?? {})) {
  const measurement = benchmark.measurements?.[name];
  if (typeof measurement !== 'number' || typeof target !== 'number' || measurement >= target) {
    errors.push(`benchmark ${name} did not remain below target`);
  }
  if (benchmark.checks?.[name] !== true) errors.push(`benchmark check ${name} is not true`);
}
if (JSON.stringify(report.benchmark?.measurements) !== JSON.stringify(benchmark.measurements)) {
  errors.push('validation report benchmark snapshot drifted from validation-benchmark.json');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Validated build evidence, inventory, Unknown register, and performance thresholds.');
}
