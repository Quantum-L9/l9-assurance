import { extname, join, relative } from 'node:path';
import { ROOT, readText, walkFiles } from './lib/files.mjs';

const errors = [];
const unresolvedMarker = new RegExp(`\\b(?:${['TO', 'DO'].join('')}|${['FIX', 'ME'].join('')}|${['ST', 'UB'].join('')})\\b`);
const unsupportedClaimLanguage = new RegExp(`${['fa', 'ke'].join('')} validation|${['pretend', ' pass'].join('')}`, 'i');
const textExtensions = new Set(['.ts', '.mjs', '.js', '.json', '.yaml', '.md', '.py', '.txt', '']);
const files = walkFiles(
  ROOT,
  (path) =>
    !path.includes('/node_modules/') &&
    !path.includes('/dist/') &&
    !path.includes('/__pycache__/') &&
    !path.endsWith('.pyc') &&
    !path.endsWith('REWRITE_EXECUTION_SPEC.md') &&
    textExtensions.has(extname(path)),
);

for (const path of files) {
  const text = readText(path);
  const rel = relative(ROOT, path);
  if (/\t/.test(text)) errors.push(`${rel}: tab character`);
  if (/[ \t]+$/m.test(text)) errors.push(`${rel}: trailing whitespace`);
  if (!text.endsWith('\n')) errors.push(`${rel}: missing final newline`);
  if (rel !== 'scripts/lint.mjs' && rel !== 'scripts/validate-completeness.mjs' && ['.ts', '.mjs', '.js', '.py', '.sh'].includes(extname(path))) {
    if (unresolvedMarker.test(text)) errors.push(`${rel}: unresolved implementation marker`);
    if (unsupportedClaimLanguage.test(text)) errors.push(`${rel}: unsupported validation claim language`);
  }
}

const sourceFiles = walkFiles(join(ROOT, 'packages'), (path) => path.endsWith('.ts'));
for (const path of sourceFiles) {
  const text = readText(path);
  const rel = relative(ROOT, path);
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (/\bany\b/.test(code)) errors.push(`${rel}: explicit any is prohibited`);
  if (/console\.log/.test(text) && !rel.includes('cli/')) errors.push(`${rel}: library console.log is prohibited`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Linted ${files.length} files with deterministic source hygiene rules.`);
}
