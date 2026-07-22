import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalJson } from '@l9/assurance-evidence';
import { renderDecisionSummary } from '@l9/assurance-evaluator';
import { engine, subject, validObservations, FIXED_TIME, ROOT } from '../helpers/fixtures.mjs';
async function decisionFor(observations){const e=engine();const report=await e.admit({subject:subject(),observations,receivedAt:FIXED_TIME});return e.evaluate({subject:subject(),acceptedEvidence:report.accepted,evaluationTime:FIXED_TIME,decisionId:'dec_replay_fixture',admissionReport:report});}
test('evidence ordering does not affect canonical decision',async()=>{const forward=await decisionFor(validObservations());const reverse=await decisionFor([...validObservations()].reverse());assert.equal(canonicalJson(forward),canonicalJson(reverse));});
test('locked replay fixture matches byte-for-byte',async()=>{const decision=await decisionFor(validObservations());const expected=readFileSync(join(ROOT,'fixtures','replay','pull-request-pass','expected-decision.canonical.json'),'utf8').trimEnd();const summary=readFileSync(join(ROOT,'fixtures','replay','pull-request-pass','expected-summary.md'),'utf8');assert.equal(canonicalJson(decision),expected);assert.equal(renderDecisionSummary(decision),summary);});
