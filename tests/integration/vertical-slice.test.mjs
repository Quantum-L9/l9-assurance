import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson } from '@l9/assurance-evidence';
import { renderDecisionSummary } from '@l9/assurance-evaluator';
import { engine, subject, validObservations, rootJson, FIXED_TIME } from '../helpers/fixtures.mjs';
async function decide(observations,extra={}){const e=engine();const report=await e.admit({subject:subject(),observations,receivedAt:FIXED_TIME});const decision=await e.evaluate({subject:subject(),acceptedEvidence:report.accepted,evaluationTime:FIXED_TIME,decisionId:extra.decisionId??'dec_integration',admissionReport:report,...extra});return{report,decision};}
test('all six SDK observations produce pass',async()=>{const {report,decision}=await decide(validObservations());assert.equal(report.accepted.length,6);assert.equal(decision.verdict,'pass');assert.ok(Object.isFrozen(decision));});
test('positive lint failure produces fail',async()=>{const observations=validObservations().map((item)=>item.check.id==='l9.lint'?rootJson('fixtures','adversarial','lint-failed.observation.json'):item);const {decision}=await decide(observations);assert.equal(decision.verdict,'fail');assert.equal(decision.controlResults.find((x)=>x.controlId==='L9.CI.LINT').status,'fail');});
test('missing tests evidence produces indeterminate, not fail',async()=>{const {decision}=await decide(validObservations().filter((item)=>item.check.id!=='l9.tests'));assert.equal(decision.verdict,'indeterminate');assert.equal(decision.controlResults.find((x)=>x.controlId==='L9.CI.TESTS').status,'indeterminate');});
test('revision substitution is rejected and decision remains indeterminate',async()=>{const observations=validObservations().filter((item)=>item.check.id!=='l9.tests').concat(rootJson('fixtures','adversarial','revision-substitution.observation.json'));const {report,decision}=await decide(observations);assert.equal(report.rejectedCount,1);assert.equal(decision.verdict,'indeterminate');});
test('active lint waiver produces conditional',async()=>{const observations=validObservations().map((item)=>item.check.id==='l9.lint'?rootJson('fixtures','adversarial','lint-failed.observation.json'):item);const waiver=rootJson('fixtures','valid','lint-waiver.json');const {decision}=await decide(observations,{waivers:[waiver]});assert.equal(decision.verdict,'conditional');assert.equal(decision.controlResults.find((x)=>x.controlId==='L9.CI.LINT').status,'conditional');});
test('decision summary is a deterministic projection',async()=>{const {decision}=await decide(validObservations());assert.equal(renderDecisionSummary(JSON.parse(canonicalJson(decision))),renderDecisionSummary(decision));});

test('CLI and programmatic API issue byte-equivalent decisions', async () => {
  const { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { runCli } = await import('@l9/assurance-cli');
  const { ROOT } = await import('../helpers/fixtures.mjs');
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'l9-assurance-cli-integration-'));
  try {
    mkdirSync(join(temporaryRoot, 'controls'), { recursive: true });
    mkdirSync(join(temporaryRoot, 'registry'), { recursive: true });
    mkdirSync(join(temporaryRoot, 'profiles', 'pull-request'), { recursive: true });
    const observationDirectory = join(temporaryRoot, 'observations');
    mkdirSync(observationDirectory, { recursive: true });
    cpSync(join(ROOT, 'controls', 'ci'), join(temporaryRoot, 'controls', 'ci'), { recursive: true });
    cpSync(
      join(ROOT, 'fixtures', 'compatibility', 'producer-registry.trusted.json'),
      join(temporaryRoot, 'registry', 'producers.yaml'),
    );
    cpSync(
      join(ROOT, 'fixtures', 'compatibility', 'check-registry.json'),
      join(temporaryRoot, 'registry', 'checks.yaml'),
    );
    cpSync(
      join(ROOT, 'fixtures', 'compatibility', 'profile.json'),
      join(temporaryRoot, 'profiles', 'pull-request', 'profile.yaml'),
    );
    cpSync(
      join(ROOT, 'fixtures', 'compatibility', 'policy.json'),
      join(temporaryRoot, 'profiles', 'pull-request', 'policy.yaml'),
    );
    for (const name of [
      'repository-metadata.observation.json',
      'transport-packet.observation.json',
      'sdk-validation.observation.json',
      'lint.observation.json',
      'tests.observation.json',
      'mandatory-findings.observation.json',
    ]) {
      cpSync(join(ROOT, 'fixtures', 'valid', name), join(observationDirectory, name));
    }

    const admissionOutput = join(temporaryRoot, 'admission');
    const decisionOutput = join(temporaryRoot, 'decision');
    const cliIo = { stdout: () => {}, stderr: (text) => { throw new Error(text); } };
    const admissionCode = await runCli(
      [
        'evidence',
        'admit',
        '--root',
        temporaryRoot,
        '--subject',
        join(ROOT, 'fixtures', 'valid', 'subject.json'),
        '--input',
        observationDirectory,
        '--received-at',
        FIXED_TIME,
        '--output',
        admissionOutput,
      ],
      cliIo,
    );
    assert.equal(admissionCode, 0);
    const evaluationCode = await runCli(
      [
        'evaluate',
        '--root',
        temporaryRoot,
        '--subject',
        join(ROOT, 'fixtures', 'valid', 'subject.json'),
        '--profile',
        'l9.pull-request@1',
        '--policy',
        'l9.organization-default@1',
        '--evidence',
        join(admissionOutput, 'accepted'),
        '--evaluation-time',
        FIXED_TIME,
        '--output',
        decisionOutput,
      ],
      cliIo,
    );
    assert.equal(evaluationCode, 0);
    const cliDecision = JSON.parse(readFileSync(join(decisionOutput, 'decision.json'), 'utf8'));

    const directEngine = engine();
    const directAdmission = await directEngine.admit({
      subject: subject(),
      observations: validObservations(),
      receivedAt: FIXED_TIME,
    });
    const directDecision = await directEngine.evaluate({
      subject: subject(),
      acceptedEvidence: directAdmission.accepted,
      evaluationTime: FIXED_TIME,
    });
    assert.equal(canonicalJson(cliDecision), canonicalJson(directDecision));
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('mandatory unknown policy can convert missing evidence to fail',async()=>{const base=engine();const report=await base.admit({subject:subject(),observations:validObservations().filter((item)=>item.check.id!=='l9.tests'),receivedAt:FIXED_TIME});const config=(await import('../helpers/fixtures.mjs')).trustedConfiguration();const {AssuranceEngine}=await import('@l9/assurance-cli');const strict=new AssuranceEngine({...config,policy:{...config.policy,unknownHandling:{...config.policy.unknownHandling,mandatory:'fail'}}});const decision=await strict.evaluate({subject:subject(),acceptedEvidence:report.accepted,evaluationTime:FIXED_TIME,decisionId:'dec_unknown_fail'});assert.equal(decision.verdict,'fail');assert.match(decision.controlResults.find((item)=>item.controlId==='L9.CI.TESTS').reasons.map((item)=>item.code).join(' '),/CONTROL_POLICY_UNKNOWN_FAIL/);});
test('policy mandatory finding severities override control defaults',async()=>{const observations=validObservations().map((item)=>item.check.id==='l9.mandatory-findings'?{...item,summary:{findingCount:1,errorCount:0,warningCount:1,informationalCount:0},findings:[{findingId:'medium',ruleId:'x',severity:'medium',disposition:'open',message:'medium'}]}:item);const config=(await import('../helpers/fixtures.mjs')).trustedConfiguration();const {AssuranceEngine}=await import('@l9/assurance-cli');const strict=new AssuranceEngine({...config,policy:{...config.policy,mandatoryFindingSeverities:['critical','high','medium']}});const report=await strict.admit({subject:subject(),observations,receivedAt:FIXED_TIME});const decision=await strict.evaluate({subject:subject(),acceptedEvidence:report.accepted,evaluationTime:FIXED_TIME,decisionId:'dec_medium_fail'});assert.equal(decision.verdict,'fail');});
