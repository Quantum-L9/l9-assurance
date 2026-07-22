import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { ROOT, walkFiles } from './lib/files.mjs';

const errors = [];
const required = [
  'README.md', 'RUNBOOK.md', 'MANIFEST.md', 'VALIDATION.md', 'UNKNOWN_REGISTER.md',
  'FINAL_TREE.md', 'REGRESSION_GUARD.md', 'TRACEABILITY_MAP.yaml',
];
for (const path of required) {
  if (!existsSync(join(ROOT, path))) errors.push(`missing required artifact ${path}`);
}

const executableExtensions = new Set(['.ts', '.mjs', '.js', '.cjs', '.py', '.sh']);
const unfinished = /\b(?:TODO|FIXME|XXX|HACK|NotImplemented)\b|throw\s+new\s+Error\s*\(\s*['"](?:not implemented|placeholder|stub)/i;
for (const path of walkFiles(ROOT)) {
  const rel = relative(ROOT, path).split('\\').join('/');
  const size = statSync(path).size;
  if (size === 0) errors.push(`empty file ${rel}`);
  if (rel !== 'scripts/validate-completeness.mjs' && executableExtensions.has(extname(path))) {
    const text = readFileSync(path, 'utf8');
    if (unfinished.test(text)) errors.push(`unfinished implementation marker in ${rel}`);
  }
  if (/\.(?:zip|tgz|tar|gz)$/i.test(rel)) errors.push(`nested archive prohibited in source tree: ${rel}`);
  if (/(?:^|\/)(?:node_modules|dist|coverage|__pycache__|\.tmp)(?:\/|$)/.test(rel)) {
    errors.push(`generated or cache artifact tracked in source inventory: ${rel}`);
  }
}

const packageNames = new Set();
for (const path of walkFiles(join(ROOT, 'packages'), (candidate) => candidate.endsWith('/package.json'))) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  if (typeof manifest.name !== 'string' || !manifest.name.startsWith('@l9/assurance-')) {
    errors.push(`invalid workspace name in ${relative(ROOT, path)}`);
  } else if (packageNames.has(manifest.name)) errors.push(`duplicate workspace name ${manifest.name}`);
  else packageNames.add(manifest.name);
}
if (packageNames.size !== 8) errors.push(`expected 8 active workspaces, found ${packageNames.size}`);

if (errors.length > 0) {
  console.error(errors.sort().join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Completeness validated: ${walkFiles(ROOT).length} source files, ${packageNames.size} workspaces, no unfinished executable markers, no nested archives.`);
}
