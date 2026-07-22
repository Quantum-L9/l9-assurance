import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as contracts from '@l9/assurance-contracts';
import { runCli } from '@l9/assurance-cli';
import { ROOT } from '../helpers/fixtures.mjs';

test('stable reason and exit-code contracts are exported', () => {
  assert.ok(contracts.ADMISSION_REASON_CODES.includes('EVIDENCE_REVISION_MISMATCH'));
  assert.deepEqual(contracts.EXIT_CODES, {
    pass: 0,
    conditional: 10,
    fail: 20,
    indeterminate: 30,
    input: 40,
    policy: 41,
    admission: 42,
    signature: 43,
    invariant: 50,
  });
});

test('unknown CLI command returns stable input error', async () => {
  let stderr = '';
  const code = await runCli(['unknown'], {
    stdout: () => {},
    stderr: (text) => {
      stderr += text;
    },
  });
  assert.equal(code, 40);
  assert.match(stderr, /Unknown command/);
});

test('CLI plan accepts the locked profile shorthand and honors an absolute output path', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'l9-assurance-plan-'));
  try {
    const output = join(directory, 'plan.json');
    const code = await runCli(
      [
        'plan',
        '--root',
        ROOT,
        '--profile',
        'l9.pull-request@1',
        '--subject',
        join(ROOT, 'fixtures', 'valid', 'subject.json'),
        '--output',
        output,
      ],
      { stdout: () => {}, stderr: () => {} },
    );
    assert.equal(code, 0);
    const plan = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(plan.controls.length, 7);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI rejects an unsupported profile with the policy-resolution exit code', async () => {
  let stderr = '';
  const code = await runCli(
    [
      'plan',
      '--root',
      ROOT,
      '--profile',
      'l9.release-candidate@2',
      '--subject',
      join(ROOT, 'fixtures', 'valid', 'subject.json'),
      '--output',
      join(ROOT, '.tmp', 'unsupported-plan.json'),
    ],
    { stdout: () => {}, stderr: (text) => { stderr += text; } },
  );
  assert.equal(code, 41);
  assert.match(stderr, /Unsupported profile/);
});

test('CLI consumer conformance verifies transported bytes, verdict, and summary', async () => {
  let stdout = '';
  const code = await runCli(
    [
      'conformance',
      'consumer',
      '--root',
      ROOT,
      '--consumer',
      'l9-ci-core',
      '--fixture',
      join(ROOT, 'fixtures', 'compatibility', 'consumer-pass'),
    ],
    { stdout: (text) => { stdout += text; }, stderr: () => {} },
  );
  assert.equal(code, 0);
  assert.equal(JSON.parse(stdout).passed, true);
});

test('CLI rejects duplicate flags deterministically', async () => {let stderr='';const code=await runCli(['verify','--decision','a.json','--decision','b.json'],{stdout:()=>{},stderr:(text)=>{stderr+=text;}});assert.equal(code,40);assert.match(stderr,/Duplicate flag/);});
test('CLI rejects command-specific unknown flags', async () => {let stderr='';const code=await runCli(['verify','--decision','missing.json','--root',ROOT],{stdout:()=>{},stderr:(text)=>{stderr+=text;}});assert.equal(code,40);assert.match(stderr,/Unknown flag/);});
test('CLI supports equals-form flags and verify does not load repository configuration', async () => {const directory=mkdtempSync(join(tmpdir(),'l9-assurance-verify-'));try{const {writeFileSync}=await import('node:fs');const path=join(directory,'invalid.json');writeFileSync(path,'{}');let stdout='';const code=await runCli(['verify',`--decision=${path}`],{stdout:(text)=>{stdout+=text;},stderr:()=>{}});assert.equal(code,40);assert.equal(JSON.parse(stdout).valid,false);}finally{rmSync(directory,{recursive:true,force:true});}});
test('runtime configuration rejects broken producer-check relationships', async () => {const {cpSync,mkdirSync,writeFileSync}=await import('node:fs');const {loadBuiltInConfiguration}=await import('@l9/assurance-cli');const directory=mkdtempSync(join(tmpdir(),'l9-assurance-config-'));try{mkdirSync(join(directory,'controls'),{recursive:true});mkdirSync(join(directory,'registry'),{recursive:true});mkdirSync(join(directory,'profiles','pull-request'),{recursive:true});cpSync(join(ROOT,'controls','ci'),join(directory,'controls','ci'),{recursive:true});cpSync(join(ROOT,'fixtures','compatibility','producer-registry.trusted.json'),join(directory,'registry','producers.yaml'));const checks=JSON.parse(readFileSync(join(ROOT,'fixtures','compatibility','check-registry.json'),'utf8'));checks.checks[0].owner='unknown-owner';writeFileSync(join(directory,'registry','checks.yaml'),JSON.stringify(checks));cpSync(join(ROOT,'fixtures','compatibility','profile.json'),join(directory,'profiles','pull-request','profile.yaml'));cpSync(join(ROOT,'fixtures','compatibility','policy.json'),join(directory,'profiles','pull-request','policy.yaml'));assert.throws(()=>loadBuiltInConfiguration(directory),/unknown owner/);}finally{rmSync(directory,{recursive:true,force:true});}});
