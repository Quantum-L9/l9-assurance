import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyPlan } from '@l9/assurance-cli';
import { buildSchemaStore, validateInstance } from '../../scripts/lib/schema-validator.mjs';
import { engine, ROOT, subject } from '../helpers/fixtures.mjs';

function schemaPaths() {
  return readdirSync(join(ROOT, 'schemas', 'v1'))
    .filter((name) => name.endsWith('.schema.json'))
    .sort()
    .map((name) => join(ROOT, 'schemas', 'v1', name));
}

test('generated assurance plan validates against the locked schema and digest contract', async () => {
  const plan = await engine().plan({ subject: subject() });
  const planSchemaPath = join(ROOT, 'schemas', 'v1', 'assurance-plan.schema.json');
  const schema = JSON.parse(readFileSync(planSchemaPath, 'utf8'));
  const store = buildSchemaStore(schemaPaths());
  const errors = validateInstance(plan, schema, { store, schemaPath: planSchemaPath });
  assert.deepEqual(errors, []);
  const verification = verifyPlan(plan);
  assert.equal(verification.valid, true);
  assert.deepEqual(verification.reasons, []);
  assert.equal(verification.planId, plan.planId);
  assert.equal(verification.digest, plan.planDigest.value);
  assert.equal(plan.schema, 'l9.assurance-plan');
  assert.equal(plan.schemaVersion, '1.0.0');
  assert.equal(plan.controls.length, 7);
  assert.equal(plan.requiredChecks.length, 6);
  assert.equal(plan.requiredProducers.length, 1);
  assert.equal(plan.protocol.canonicalization, 'l9.canonical-json/v1');
});
