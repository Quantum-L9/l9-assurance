import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

export const ROOT = resolve(new URL('../..', import.meta.url).pathname);

export function readText(path) { return readFileSync(path, 'utf8'); }
export function readJson(path) { return JSON.parse(readText(path)); }
export function readData(path) {
  const text = readText(path);
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`${path} must use deterministic JSON-compatible YAML: ${error.message}`); }
}
export function writeText(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}
export function writeJson(path, value) { writeText(path, `${JSON.stringify(value, null, 2)}\n`); }
export function walkFiles(root, predicate = () => true) {
  const output = [];
  function visit(current) {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory() && ['node_modules', 'dist', '.git', '.tmp', '__pycache__'].includes(name)) continue;
      if (stat.isDirectory()) visit(full);
      else if (stat.isFile() && !name.endsWith('.pyc') && predicate(full)) output.push(full);
    }
  }
  if (existsSync(root)) visit(root);
  return output;
}
export function relativePosix(from, to) { return relative(from, to).split(sep).join('/'); }
export function ensureContained(root, candidate) {
  const realRoot = realpathSync(root);
  const realCandidate = realpathSync(candidate);
  const rel = relative(realRoot, realCandidate);
  if (rel === '..' || rel.startsWith(`..${sep}`) || resolve(realCandidate) === resolve(realRoot) && !statSync(realCandidate).isDirectory()) {
    throw new Error(`Path escapes root: ${candidate}`);
  }
  return realCandidate;
}
export function remove(path) { rmSync(path, { recursive: true, force: true }); }
export function extension(path) { return extname(path); }
