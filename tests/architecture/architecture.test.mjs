import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../helpers/fixtures.mjs';
test('workspace graph and evaluator purity pass the architecture validator',()=>{const result=spawnSync(process.execPath,['scripts/validate-boundaries.mjs'],{cwd:ROOT,encoding:'utf8'});assert.equal(result.status,0,result.stderr||result.stdout);});
test('exactly eight active workspaces exist',()=>{assert.deepEqual(readdirSync(join(ROOT,'packages')).sort(),['cli','conformance','contracts','controls','evaluator','evidence','policy','testing']);});
test('production entrypoints do not export testing signers',()=>{for(const name of ['contracts','evidence','controls','policy','evaluator','conformance','cli']){const text=readFileSync(join(ROOT,'packages',name,'src','index.ts'),'utf8');assert.doesNotMatch(text,/InMemoryTestSigner|assurance-testing/);}});
