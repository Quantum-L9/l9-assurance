import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { canonicalJson, sha256Digest } from '@l9/assurance-evidence';
import { ROOT, rootJson } from '../helpers/fixtures.mjs';

test('generated Python binding passes every canonicalization authority vector', () => {
  const vectors = rootJson('fixtures', 'conformance', 'canonicalization-v1.json');
  const script = [
    'import json, sys',
    `sys.path.insert(0, ${JSON.stringify(`${ROOT}/bindings/python`)})`,
    'from l9_assurance_types import canonical_json, sha256_digest',
    `with open(${JSON.stringify(`${ROOT}/fixtures/conformance/canonicalization-v1.json`)}, encoding="utf-8") as handle:`,
    '    vectors = json.load(handle)',
    'output = []',
    'for case in vectors["cases"]:',
    '    value = json.loads(case["inputJson"])',
    '    output.append({"id": case["id"], "canonicalJson": canonical_json(value), "digest": sha256_digest(value)["value"]})',
    'print(json.dumps(output, ensure_ascii=False, separators=(",", ":")))',
  ].join('\n');
  const result = spawnSync('python3', ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.equal(result.status, 0, result.stderr);
  const pythonResults = JSON.parse(result.stdout);
  assert.equal(pythonResults.length, vectors.cases.length);
  for (const [index, vector] of vectors.cases.entries()) {
    const value = JSON.parse(vector.inputJson);
    const expectedCanonical = canonicalJson(value);
    assert.equal(expectedCanonical, vector.canonicalJson, `${vector.id}: vector expectation drift`);
    assert.equal(pythonResults[index].canonicalJson, expectedCanonical, `${vector.id}: canonical bytes`);
    assert.equal(pythonResults[index].digest, sha256Digest(value).value, `${vector.id}: digest preimage`);
  }
});
