import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { canonicalJson } from '@l9/assurance-evidence';
import { ROOT, rootJson } from '../helpers/fixtures.mjs';

test('generated Python binding canonicalizes the same subject as TypeScript', () => {
  const script = [
    'import json, sys',
    `sys.path.insert(0, ${JSON.stringify(`${ROOT}/bindings/python`)})`,
    'from l9_assurance_types import canonical_json',
    `with open(${JSON.stringify(`${ROOT}/fixtures/valid/subject.json`)}, encoding="utf-8") as handle:`,
    '    print(canonical_json(json.load(handle)))',
  ].join('\n');
  const result = spawnSync('python3', ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), canonicalJson(rootJson('fixtures', 'valid', 'subject.json')));
});
