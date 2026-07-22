import { basename, join, resolve } from 'node:path';
import { ROOT, readJson, walkFiles, writeText } from './lib/files.mjs';

const mode = process.argv.includes('--check') ? 'check' : 'write';
const schemaRoot = join(ROOT, 'schemas', 'v1');
const schemaPaths = walkFiles(schemaRoot, (path) => path.endsWith('.schema.json'));
const schemas = schemaPaths.map((path) => ({ path, file: basename(path), schema: readJson(path) })).sort((a,b) => a.file.localeCompare(b.file));
const titleByFile = new Map(schemas.map(({ file, schema }) => [file, schema.title]));

function refName(ref) {
  const file = ref.split('#')[0].replace('./','');
  return titleByFile.get(file) ?? 'unknown';
}
function safeProp(name) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name); }
function tsType(rule, indent='') {
  if (!rule || rule === true) return 'unknown';
  if (rule.$ref) return refName(rule.$ref);
  if (rule.const !== undefined) return JSON.stringify(rule.const);
  if (rule.enum) return rule.enum.map((x) => JSON.stringify(x)).join(' | ');
  if (rule.oneOf) return rule.oneOf.map((x) => tsType(x, indent)).join(' | ');
  if (rule.anyOf) return rule.anyOf.map((x) => tsType(x, indent)).join(' | ');
  if (rule.allOf) return rule.allOf.map((x) => tsType(x, indent)).join(' & ');
  if (Array.isArray(rule.type)) return rule.type.map((x) => tsType({ ...rule, type: x }, indent)).join(' | ');
  if (rule.type === 'string') return 'string';
  if (rule.type === 'integer' || rule.type === 'number') return 'number';
  if (rule.type === 'boolean') return 'boolean';
  if (rule.type === 'null') return 'null';
  if (rule.type === 'array') return `readonly ${wrapArrayType(tsType(rule.items ?? {}, indent))}[]`;
  if (rule.type === 'object' || rule.properties || rule.additionalProperties) {
    if (!rule.properties && rule.additionalProperties) return `Readonly<Record<string, ${tsType(rule.additionalProperties, indent)}>>`;
    const required = new Set(rule.required ?? []);
    const next = indent + '  ';
    const lines = Object.entries(rule.properties ?? {}).map(([name, child]) => `${next}readonly ${safeProp(name)}${required.has(name) ? '' : '?'}: ${tsType(child, next)};`);
    if (rule.additionalProperties && rule.additionalProperties !== false) lines.push(`${next}readonly [key: string]: ${tsType(rule.additionalProperties, next)};`);
    return `{\n${lines.join('\n')}\n${indent}}`;
  }
  return 'unknown';
}
function wrapArrayType(type) { return /[|&]/.test(type) ? `(${type})` : type; }
function topTs(schema) {
  const title = schema.title;
  if (schema.type === 'object') {
    const required = new Set(schema.required ?? []);
    const lines = Object.entries(schema.properties ?? {}).map(([name, child]) => `  readonly ${safeProp(name)}${required.has(name) ? '' : '?'}: ${tsType(child, '  ')};`);
    return `export interface ${title} {\n${lines.join('\n')}\n}`;
  }
  return `export type ${title} = ${tsType(schema)};`;
}
const tsHeader = `// Generated from schemas/v1 by scripts/generate-bindings.mjs. Do not edit.\n`;
const tsBody = `${tsHeader}\n${schemas.map(({schema}) => topTs(schema)).join('\n\n')}\n`;

function pyName(ref) { return refName(ref); }
function pyType(rule) {
  if (!rule || rule === true) return 'Any';
  if (rule.$ref) return pyName(rule.$ref);
  if (rule.const !== undefined) return `Literal[${JSON.stringify(rule.const)}]`;
  if (rule.enum) return `Literal[${rule.enum.map((x) => JSON.stringify(x)).join(', ')}]`;
  if (rule.oneOf) return `Union[${rule.oneOf.map(pyType).join(', ')}]`;
  if (rule.anyOf) return `Union[${rule.anyOf.map(pyType).join(', ')}]`;
  if (Array.isArray(rule.type)) return `Union[${rule.type.map((x)=>pyType({...rule,type:x})).join(', ')}]`;
  if (rule.type === 'string') return 'str';
  if (rule.type === 'integer') return 'int';
  if (rule.type === 'number') return 'float';
  if (rule.type === 'boolean') return 'bool';
  if (rule.type === 'null') return 'None';
  if (rule.type === 'array') return `list[${pyType(rule.items ?? {})}]`;
  if (rule.type === 'object' || rule.properties) return 'dict[str, Any]';
  return 'Any';
}
function pyClass(schema) {
  const required = new Set(schema.required ?? []);
  const fields = Object.entries(schema.properties ?? {}).map(([name, child]) => `    ${name}: ${required.has(name) ? 'Required' : 'NotRequired'}[${pyType(child)}]`);
  return `class ${schema.title}(TypedDict, total=False):\n${fields.length ? fields.join('\n') : '    pass'}`;
}
const py = [
  '# Generated from schemas/v1 by scripts/generate-bindings.mjs. Do not edit.',
  'from __future__ import annotations',
  '',
  'import hashlib',
  'import json',
  'import math',
  'from decimal import Decimal',
  'from typing import Any, Literal, NotRequired, Required, TypedDict, Union',
  '',
  schemas.map(({schema})=>pyClass(schema)).join('\n\n'),
  '',
  'def _has_unpaired_surrogate(value: str) -> bool:',
  '    index = 0',
  '    while index < len(value):',
  '        code = ord(value[index])',
  '        if 0xD800 <= code <= 0xDBFF:',
  '            if index + 1 >= len(value) or not 0xDC00 <= ord(value[index + 1]) <= 0xDFFF:',
  '                return True',
  '            index += 2',
  '            continue',
  '        if 0xDC00 <= code <= 0xDFFF:',
  '            return True',
  '        index += 1',
  '    return False',
  '',
  'def _number_to_string(value: int | float) -> str:',
  '    if isinstance(value, int):',
  '        return str(value)',
  '    if not math.isfinite(value):',
  '        raise ValueError("non-finite numbers are forbidden")',
  '    if value == 0:',
  '        return "0"',
  '    sign = "-" if value < 0 else ""',
  '    absolute = abs(value)',
  '    text = repr(absolute).lower()',
  '    if 1e-6 <= absolute < 1e21:',
  '        fixed = format(Decimal(text), "f")',
  '        if "." in fixed:',
  '            fixed = fixed.rstrip("0").rstrip(".")',
  '        return sign + fixed',
  '    if "e" not in text:',
  '        text = format(Decimal(text).normalize(), "e")',
  '    mantissa, exponent = text.split("e", 1)',
  '    if "." in mantissa:',
  '        mantissa = mantissa.rstrip("0").rstrip(".")',
  '    exponent_value = int(exponent)',
  '    exponent_text = f"+{exponent_value}" if exponent_value >= 0 else str(exponent_value)',
  '    return f"{sign}{mantissa}e{exponent_text}"',
  '',
  'def _serialize(value: Any, seen: set[int], path: str) -> str:',
  '    if value is None:',
  '        return "null"',
  '    if isinstance(value, bool):',
  '        return "true" if value else "false"',
  '    if isinstance(value, str):',
  '        if _has_unpaired_surrogate(value):',
  '            raise ValueError(f"{path}: malformed Unicode surrogate")',
  '        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))',
  '    if isinstance(value, (int, float)):',
  '        try:',
  '            return _number_to_string(value)',
  '        except ValueError as error:',
  '            raise ValueError(f"{path}: {error}") from error',
  '    if isinstance(value, list):',
  '        identity = id(value)',
  '        if identity in seen:',
  '            raise ValueError(f"{path}: cyclic value")',
  '        seen.add(identity)',
  '        try:',
  '            return "[" + ",".join(_serialize(item, seen, f"{path}[{index}]") for index, item in enumerate(value)) + "]"',
  '        finally:',
  '            seen.remove(identity)',
  '    if isinstance(value, dict):',
  '        identity = id(value)',
  '        if identity in seen:',
  '            raise ValueError(f"{path}: cyclic value")',
  '        if any(not isinstance(key, str) for key in value):',
  '            raise ValueError(f"{path}: object keys must be strings")',
  '        seen.add(identity)',
  '        try:',
  '            entries = []',
  '            for key in sorted(value):',
  '                encoded_key = json.dumps(key, ensure_ascii=False, separators=(",", ":"))',
  '                entries.append(encoded_key + ":" + _serialize(value[key], seen, f"{path}.{key}"))',
  '            return "{" + ",".join(entries) + "}"',
  '        finally:',
  '            seen.remove(identity)',
  '    raise ValueError(f"{path}: unsupported value type {type(value).__name__}")',
  '',
  'def canonical_json(value: Any) -> str:',
  '    return _serialize(value, set(), "$")',
  '',
  'def sha256_digest(value: Any) -> Digest:',
  '    payload = canonical_json(value).encode("utf-8")',
  '    return {"algorithm": "sha256", "value": hashlib.sha256(payload).hexdigest()}',
  '',
].join('\n');
const registry = `${JSON.stringify({ schemaVersion: '1.0.0', generatedFrom: schemas.map(({file,schema})=>({file,id:schema.$id,title:schema.title,version:schema['x-l9-schema-version']})) }, null, 2)}\n`;

const outputs = new Map([
  [join(ROOT,'packages','contracts','src','generated.ts'), tsBody],
  [join(ROOT,'bindings','typescript','index.ts'), tsBody],
  [join(ROOT,'bindings','python','l9_assurance_types.py'), py],
  [join(ROOT,'bindings','manifest.json'), registry],
]);
let mismatches = 0;
for (const [path, content] of outputs) {
  if (mode === 'write') writeText(path, content);
  else {
    let existing = '';
    try { existing = await import('node:fs').then(({readFileSync})=>readFileSync(path,'utf8')); } catch {}
    if (existing !== content) { console.error(`Generated file drift: ${path}`); mismatches += 1; }
  }
}
if (mismatches) process.exitCode = 1;
else console.log(`${mode === 'write' ? 'Generated' : 'Verified'} ${outputs.size} binding artifacts from ${schemas.length} schemas.`);
