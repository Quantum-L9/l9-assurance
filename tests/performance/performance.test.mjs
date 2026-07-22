import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { AssuranceEngine } from '@l9/assurance-cli';
import { admitObservations, validateObservation } from '@l9/assurance-evidence';
import { renderDecisionSummary } from '@l9/assurance-evaluator';
import { subject, trustedConfiguration, rootJson, FIXED_TIME } from '../helpers/fixtures.mjs';

test('observation validation p95 is under 100ms', () => {
  const observation = rootJson('fixtures', 'valid', 'tests.observation.json');
  const durations = [];
  for (let index = 0; index < 100; index += 1) {
    const start = performance.now();
    assert.equal(validateObservation(observation).valid, true);
    durations.push(performance.now() - start);
  }
  durations.sort((left, right) => left - right);
  assert.ok(durations[Math.floor(durations.length * 0.95)] < 100);
});

test('1,000 observations admit under five seconds', async () => {
  const base = rootJson('fixtures', 'valid', 'tests.observation.json');
  const observations = Array.from({ length: 1000 }, (_, index) => ({
    ...base,
    observationId: `obs_perf_${index}`,
    execution: { ...base.execution, runId: `run_perf_${index}` },
  }));
  const config = trustedConfiguration();
  const start = performance.now();
  const report = await admitObservations(observations, {
    subject: subject(),
    producerRegistry: config.producerRegistry,
    checkRegistry: config.checkRegistry,
    receivedAt: FIXED_TIME,
    channel: 'local',
  });
  const elapsed = performance.now() - start;
  assert.equal(report.accepted.length, 1000);
  assert.ok(elapsed < 5000, `elapsed ${elapsed}ms`);
});

test('500 controls evaluate under two seconds and summarize under 500ms', async () => {
  const baseConfiguration = trustedConfiguration();
  const admissionEngine = new AssuranceEngine(baseConfiguration);
  const observation = rootJson('fixtures', 'valid', 'tests.observation.json');
  const admission = await admissionEngine.admit({
    subject: subject(),
    observations: [observation],
    receivedAt: FIXED_TIME,
  });
  assert.equal(admission.accepted.length, 1);

  const baseControl = rootJson('controls', 'ci', 'tests.yaml');
  const controls = Array.from({ length: 500 }, (_, index) => {
    const suffix = String(index).padStart(3, '0');
    return {
      ...baseControl,
      id: `L9.PERF.CONTROL_${suffix}`,
      claim: `l9.claim.performance-${suffix}`,
      title: `Performance control ${suffix}`,
      description: `Synthetic deterministic performance control ${suffix}.`,
    };
  });
  const profile = {
    ...baseConfiguration.profile,
    id: 'l9.performance-fixture',
    controls: controls.map((control) => ({ id: control.id, version: control.version })),
    outputClaims: [{ id: 'l9.claim.performance-profile-satisfied', version: '1.0.0' }],
  };
  const performanceEngine = new AssuranceEngine({ ...baseConfiguration, controls, profile });
  const evaluationStart = performance.now();
  const decision = await performanceEngine.evaluate({
    subject: subject(),
    acceptedEvidence: admission.accepted,
    evaluationTime: FIXED_TIME,
    decisionId: 'dec_performance_500_controls',
  });
  const evaluationElapsed = performance.now() - evaluationStart;
  assert.equal(decision.verdict, 'pass');
  assert.equal(decision.controlResults.length, 500);
  assert.ok(evaluationElapsed < 2000, `evaluation elapsed ${evaluationElapsed}ms`);

  const summaryStart = performance.now();
  const summary = renderDecisionSummary(decision);
  const summaryElapsed = performance.now() - summaryStart;
  assert.match(summary, /L9 Assurance Decision/);
  assert.ok(summaryElapsed < 500, `summary elapsed ${summaryElapsed}ms`);
});
