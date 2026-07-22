import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceVerdict } from '@l9/assurance-evaluator';
const base={controlId:'C',controlVersion:'1.0.0',severity:'mandatory',evidenceRefs:[],waiverRefs:[],unknownRefs:[],reasons:[],evaluatedAt:'2026-07-21T00:00:00.000Z'};
test('verdict reduction preserves fail, unknown, conditional, pass order',()=>{assert.equal(reduceVerdict([{...base,status:'fail'}]),'fail');assert.equal(reduceVerdict([{...base,status:'indeterminate'}]),'indeterminate');assert.equal(reduceVerdict([{...base,status:'conditional'}]),'conditional');assert.equal(reduceVerdict([{...base,status:'pass'}]),'pass');assert.equal(reduceVerdict([{...base,status:'fail'},{...base,controlId:'D',status:'indeterminate'}]),'fail');});
