import { performance } from 'node:perf_hooks';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { AssuranceEngine } from '@l9/assurance-cli';
import { admitObservations, validateObservation } from '@l9/assurance-evidence';
import { renderDecisionSummary, verifyDecision } from '@l9/assurance-evaluator';
import { ROOT } from './lib/files.mjs';

const FIXED_TIME = '2026-07-21T00:00:02.000Z';
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? resolve(process.argv[outputIndex + 1] ?? '') : undefined;

function readJson(...parts) {
  return JSON.parse(readFileSync(join(ROOT, ...parts), 'utf8'));
}

function configuration() {
  const controls = readdirSync(join(ROOT, 'controls', 'ci'))
    .filter((name) => name.endsWith('.yaml'))
    .sort()
    .map((name) => readJson('controls', 'ci', name));
  return {
    producerRegistry: readJson('fixtures', 'compatibility', 'producer-registry.trusted.json'),
    checkRegistry: readJson('fixtures', 'compatibility', 'check-registry.json'),
    profile: readJson('fixtures', 'compatibility', 'profile.json'),
    policy: readJson('fixtures', 'compatibility', 'policy.json'),
    controls,
    clock: () => FIXED_TIME,
    evaluator: {
      id: 'l9-assurance',
      version: '2.0.1',
      repository: 'Quantum-L9/l9-assurance',
    },
  };
}

function percentile(values, quantile) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * quantile))] ?? 0;
}

const subject = readJson('fixtures', 'valid', 'subject.json');
const baseObservation = readJson('fixtures', 'valid', 'tests.observation.json');
const validationDurations = [];
for (let index = 0; index < 200; index += 1) {
  const started = performance.now();
  const validation = validateObservation(baseObservation);
  validationDurations.push(performance.now() - started);
  if (!validation.valid) throw new Error('Benchmark fixture failed structural validation.');
}
const validationP95Ms = percentile(validationDurations, 0.95);

const observations = Array.from({ length: 1000 }, (_, index) => ({
  ...baseObservation,
  observationId: `obs_benchmark_${index}`,
  execution: { ...baseObservation.execution, runId: `run_benchmark_${index}` },
}));
const config = configuration();
const admissionStarted = performance.now();
const admission = await admitObservations(observations, {
  subject,
  producerRegistry: config.producerRegistry,
  checkRegistry: config.checkRegistry,
  receivedAt: FIXED_TIME,
  channel: 'local',
});
const admissionMs = performance.now() - admissionStarted;
if (admission.accepted.length !== 1000) throw new Error('Benchmark did not admit all observations.');
const rssBytesAfterAdmission = process.memoryUsage().rss;

const singleEngine = new AssuranceEngine(config);
const singleAdmission = await singleEngine.admit({
  subject,
  observations: [baseObservation],
  receivedAt: FIXED_TIME,
});
const baseControl = readJson('controls', 'ci', 'tests.yaml');
const controls = Array.from({ length: 500 }, (_, index) => {
  const suffix = String(index).padStart(3, '0');
  return {
    ...baseControl,
    id: `L9.BENCHMARK.CONTROL_${suffix}`,
    claim: `l9.claim.benchmark-${suffix}`,
    title: `Benchmark control ${suffix}`,
    description: `Synthetic benchmark control ${suffix}.`,
  };
});
const benchmarkEngine = new AssuranceEngine({
  ...config,
  controls,
  profile: {
    ...config.profile,
    id: 'l9.benchmark',
    controls: controls.map((control) => ({ id: control.id, version: control.version })),
    outputClaims: [{ id: 'l9.claim.benchmark-satisfied', version: '1.0.0' }],
  },
});
const evaluationStarted = performance.now();
const decision = await benchmarkEngine.evaluate({
  subject,
  acceptedEvidence: singleAdmission.accepted,
  evaluationTime: FIXED_TIME,
  decisionId: 'dec_benchmark_500_controls',
});
const evaluationMs = performance.now() - evaluationStarted;

const verificationStarted = performance.now();
const verification = verifyDecision(decision);
const verificationMs = performance.now() - verificationStarted;
if (!verification.valid) throw new Error(`Benchmark decision verification failed: ${verification.reasons.join('; ')}`);

const summaryStarted = performance.now();
renderDecisionSummary(decision);
const summaryMs = performance.now() - summaryStarted;

const targets = {
  validationP95Ms: 100,
  admission1000Ms: 5000,
  evaluation500ControlsMs: 2000,
  verificationMs: 250,
  summaryMs: 500,
  rssBytesAfterAdmission: 512 * 1024 * 1024,
};
const measurements = {
  validationP95Ms,
  admission1000Ms: admissionMs,
  evaluation500ControlsMs: evaluationMs,
  verificationMs,
  summaryMs,
  rssBytesAfterAdmission,
};
const checks = Object.fromEntries(
  Object.entries(targets).map(([name, target]) => [name, measurements[name] < target]),
);
const report = {
  schema: 'l9.assurance-benchmark',
  schemaVersion: '1.0.0',
  executedAt: new Date().toISOString(),
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  measurements,
  targets,
  checks,
  passed: Object.values(checks).every(Boolean),
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, 'utf8');
}
process.stdout.write(serialized);
if (!report.passed) process.exitCode = 1;
