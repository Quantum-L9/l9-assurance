import { join } from 'node:path';
import { ROOT, readJson, walkFiles } from './lib/files.mjs';
import { buildSchemaStore, validateInstance } from './lib/schema-validator.mjs';
const schemaRoot = join(ROOT,'schemas','v1');
const paths = walkFiles(schemaRoot, (path)=>path.endsWith('.schema.json'));
const store = buildSchemaStore(paths);
const ids = new Set();
const titles = new Set();
const errors=[];
for (const path of paths) {
  const schema=readJson(path);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${path}: wrong draft`);
  if (!schema.$id || ids.has(schema.$id)) errors.push(`${path}: missing or duplicate $id`); else ids.add(schema.$id);
  if (!schema.title || titles.has(schema.title)) errors.push(`${path}: missing or duplicate title`); else titles.add(schema.title);
  if (!/^\d+\.\d+\.\d+$/.test(schema['x-l9-schema-version'] ?? '')) errors.push(`${path}: invalid schema version`);
  if (schema.type === 'object' && schema.unevaluatedProperties !== false) errors.push(`${path}: top-level object must reject unknown properties`);
  const refs=[];
  (function collect(node){ if (!node || typeof node!=='object') return; if (node.$ref) refs.push(node.$ref); for (const value of Object.values(node)) collect(value); })(schema);
  for (const ref of refs) { try { store.resolveRef(path, ref); } catch (error) { errors.push(`${path}: ${error.message}`); } }
}
const registry=readJson(join(ROOT,'schemas','registry.json'));
if (registry.schemas.length !== paths.length) errors.push(`schema registry count ${registry.schemas.length} != ${paths.length}`);
for (const entry of registry.schemas) {
  const path=join(ROOT,'schemas',entry.path); const schema=readJson(path);
  if (schema.$id !== entry.id || schema.title !== entry.title || schema['x-l9-schema-version'] !== entry.version) errors.push(`${entry.path}: registry mismatch`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log(`Validated ${paths.length} strict Draft 2020-12 schemas and all references.`);
