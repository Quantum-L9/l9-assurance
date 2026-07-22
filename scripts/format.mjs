import { basename, extname } from 'node:path';
import { ROOT, readText, walkFiles, writeText } from './lib/files.mjs';

const write = process.argv.includes('--write');
const candidates = walkFiles(
  ROOT,
  (path) =>
    !path.includes('/node_modules/') &&
    !path.includes('/dist/') &&
    ['.json', '.yaml', '.md', '.ts', '.js', '.mjs', '.py', '.d.ts', ''].includes(extname(path)),
);
const changed = [];

for (const path of candidates) {
  const original = readText(path);
  let text = original
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n*$/, '\n');

  const canonicalJson = path.endsWith('.canonical.json') || basename(path) === 'transported-decision.json';
  if (!canonicalJson && (path.endsWith('.json') || path.endsWith('.yaml'))) {
    try {
      text = `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
    } catch {
      // YAML and intentionally non-JSON text retain normalized whitespace only.
    }
  }

  if (text !== original) {
    changed.push(path);
    if (write) writeText(path, text);
  }
}

if (changed.length && !write) {
  console.error(`Formatting drift:\n${changed.map((path) => path.replace(`${ROOT}/`, '')).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`${write ? 'Formatted' : 'Verified formatting for'} ${candidates.length} files${write ? ` (${changed.length} changed)` : ''}.`);
}
