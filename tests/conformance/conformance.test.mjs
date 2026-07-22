import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runConsumerConformance,
  runProducerAdmissionConformanceCases,
  runProducerConformance,
} from '@l9/assurance-conformance';
import { canonicalJson } from '@l9/assurance-evidence';
import { renderDecisionSummary } from '@l9/assurance-evaluator';
import {
  FIXED_TIME,
  passDecision,
  rootJson,
  subject,
  trustedConfiguration,
  validObservations,
} from '../helpers/fixtures.mjs';

test('SDK fixture passes producer conformance under explicit fixture trust', async () => {
  const config = trustedConfiguration();
  const report = await runProducerConformance(validObservations(), {
    producerId: 'l9-ci-sdk',
    subject: subject(),
    producerRegistry: config.producerRegistry,
    checkRegistry: config.checkRegistry,
    receivedAt: FIXED_TIME,
  });
  assert.equal(report.passed, true);
});

test('producer admission conformance covers malformed, stale, unauthorized, duplicate, replay, and revision cases', async () => {
  const config = trustedConfiguration();
  const valid = rootJson('fixtures', 'valid', 'lint.observation.json');
  const duplicateA = rootJson('fixtures', 'adversarial', 'duplicate-a.observation.json');
  const duplicateB = rootJson('fixtures', 'adversarial', 'duplicate-b.observation.json');
  const replayBase = {
    ...valid,
    observationId: 'obs_replay_conformance',
    execution: { ...valid.execution, runId: 'run_replay_conformance' },
  };
  const replayChanged = {
    ...replayBase,
    execution: { ...replayBase.execution, status: 'failed' },
  };
  const unknownProducer = {
    ...valid,
    observationId: 'obs_unknown_producer',
    producer: { ...valid.producer, id: 'unregistered-producer' },
  };
  const revokedVersion = {
    ...valid,
    observationId: 'obs_revoked_version',
    producer: { ...valid.producer, version: '3.0.0' },
  };
  const oversized = {
    ...valid,
    observationId: 'obs_oversized',
    extensions: { 'l9.fixture': { payload: 'x'.repeat(1_050_000) } },
  };
  const cases = [
    { id: 'valid', value: valid, expectedStatus: 'accepted' },
    {
      id: 'unsupported-schema',
      value: rootJson('fixtures', 'invalid', 'unsupported-schema.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_SCHEMA_UNSUPPORTED',
    },
    {
      id: 'missing-subject',
      value: rootJson('fixtures', 'invalid', 'missing-subject.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_SCHEMA_INVALID',
    },
    {
      id: 'revision-substitution',
      value: rootJson('fixtures', 'adversarial', 'revision-substitution.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_REVISION_MISMATCH',
    },
    {
      id: 'stale',
      value: rootJson('fixtures', 'adversarial', 'stale.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_STALE',
    },
    {
      id: 'unauthorized-check',
      value: rootJson('fixtures', 'adversarial', 'unauthorized-check.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_CHECK_UNAUTHORIZED',
    },
    {
      id: 'unknown-producer',
      value: unknownProducer,
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_PRODUCER_UNKNOWN',
    },
    {
      id: 'revoked-version',
      value: revokedVersion,
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_PRODUCER_VERSION_REVOKED',
    },
    { id: 'duplicate-original', value: duplicateA, expectedStatus: 'accepted' },
    {
      id: 'duplicate-copy',
      value: duplicateB,
      expectedStatus: 'duplicate',
      expectedReason: 'EVIDENCE_REPLAY_DETECTED',
    },
    { id: 'replay-original', value: replayBase, expectedStatus: 'accepted' },
    {
      id: 'replay-mutated',
      value: replayChanged,
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_REPLAY_DETECTED',
    },
    {
      id: 'invalid-extension',
      value: rootJson('fixtures', 'invalid', 'invalid-extension.observation.json'),
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_EXTENSION_NAMESPACE_INVALID',
    },
    {
      id: 'oversized',
      value: oversized,
      expectedStatus: 'rejected',
      expectedReason: 'EVIDENCE_TOO_LARGE',
    },
  ];
  const report = await runProducerAdmissionConformanceCases(cases, {
    producerId: 'l9-ci-sdk',
    subject: subject(),
    producerRegistry: config.producerRegistry,
    checkRegistry: config.checkRegistry,
    receivedAt: FIXED_TIME,
    maximumAgeSecondsByCheck: { 'l9.tests': 60 },
  });
  assert.equal(report.passed, true, JSON.stringify(report.cases.filter((item) => !item.passed)));
});

test('CI Core fixture preserves decision bytes and canonical projection', async () => {
  const decision = await passDecision();
  const report = runConsumerConformance({
    consumerId: 'l9-ci-core',
    canonicalDecision: decision,
    transportedDecisionText: `${canonicalJson(decision)}\n`,
    publishedVerdict: decision.verdict,
    publishedSummary: renderDecisionSummary(decision),
  });
  assert.equal(report.passed, true);
});

test('unsupported decision schema fails consumer verification safely', () => {
  const unsupported = rootJson('fixtures', 'compatibility', 'unsupported-decision.json');
  const report = runConsumerConformance({
    consumerId: 'l9-ci-core',
    canonicalDecision: unsupported,
    transportedDecisionText: `${canonicalJson(unsupported)}\n`,
    publishedVerdict: 'unknown',
    publishedSummary: '',
  });
  assert.equal(report.passed, false);
  assert.equal(report.checks.find((item) => item.id === 'schema').passed, false);
});
