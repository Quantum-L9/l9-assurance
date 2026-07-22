import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/files.mjs';

const mode = process.argv[2] ?? 'ci';
const common = [
  'check:generated',
  'format:check',
  'lint',
  'validate:schemas',
  'validate:registries',
  'validate:boundaries',
  'validate:fixtures',
  'validate:build-evidence',
  'validate:completeness',
  'typecheck',
  'build',
  'test',
];
const commands = mode === 'validate' ? common : [...common, 'verify:replay'];
const failures = [];

for (const script of commands) {
  console.log(`\n=== npm run ${script} ===`);
  const result = spawnSync('npm', ['run', script], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) failures.push({ script, status: result.status ?? 1 });
}

if (failures.length > 0) {
  console.error(
    `\nValidation failures: ${failures.map((failure) => `${failure.script}(${failure.status})`).join(', ')}`,
  );
  process.exitCode = 1;
} else {
  console.log(`\n${mode.toUpperCase()} validation passed: ${commands.length} commands.`);
}
