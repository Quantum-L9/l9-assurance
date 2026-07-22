import { dirname, resolve } from 'node:path';
import { readJson } from './files.mjs';

export class SchemaStore {
  #byPath = new Map();
  #byId = new Map();
  add(path, schema) {
    this.#byPath.set(resolve(path), schema);
    if (schema.$id) this.#byId.set(schema.$id, { path: resolve(path), schema });
  }
  get(path) { return this.#byPath.get(resolve(path)); }
  resolveRef(basePath, ref) {
    if (ref.startsWith('#/')) {
      let node = this.get(basePath);
      for (const part of ref.slice(2).split('/').map((x) => x.replaceAll('~1','/').replaceAll('~0','~'))) node = node?.[part];
      if (node === undefined) throw new Error(`Unresolved local schema ref ${ref} from ${basePath}`);
      return { path: resolve(basePath), schema: node };
    }
    if (/^https?:/.test(ref)) {
      const hit = this.#byId.get(ref);
      if (!hit) throw new Error(`Unresolved schema id ${ref}`);
      return hit;
    }
    const [file, fragment] = ref.split('#');
    const targetPath = resolve(dirname(basePath), file);
    let node = this.get(targetPath);
    if (!node) throw new Error(`Unresolved schema file ${ref} from ${basePath}`);
    if (fragment?.startsWith('/')) {
      for (const part of fragment.slice(1).split('/').map((x) => x.replaceAll('~1','/').replaceAll('~0','~'))) node = node?.[part];
    }
    if (node === undefined) throw new Error(`Unresolved schema fragment ${ref} from ${basePath}`);
    return { path: targetPath, schema: node };
  }
}

export function buildSchemaStore(paths) {
  const store = new SchemaStore();
  for (const path of paths) store.add(path, readJson(path));
  return store;
}

export function validateInstance(value, schema, { store, schemaPath, path = '$', maxErrors = 100 } = {}) {
  const errors = [];
  function add(message, at = path) { if (errors.length < maxErrors) errors.push({ path: at, message }); }
  function check(node, rule, at, basePath) {
    if (errors.length >= maxErrors) return;
    if (rule === true || rule === undefined || rule === null) return;
    if (rule === false) { add('schema forbids this value', at); return; }
    if (rule.$ref) {
      if (!store || !basePath) { add(`cannot resolve $ref ${rule.$ref}`, at); return; }
      const target = store.resolveRef(basePath, rule.$ref);
      check(node, target.schema, at, target.path);
      return;
    }
    if (rule.const !== undefined && !deepEqual(node, rule.const)) add(`must equal ${JSON.stringify(rule.const)}`, at);
    if (rule.enum && !rule.enum.some((item) => deepEqual(node, item))) add(`must be one of ${rule.enum.map(JSON.stringify).join(', ')}`, at);
    if (rule.oneOf) {
      const matches = rule.oneOf.filter((candidate) => validateInstance(node, candidate, { store, schemaPath: basePath, path: at, maxErrors: 1 }).length === 0);
      if (matches.length !== 1) add(`must match exactly one oneOf branch; matched ${matches.length}`, at);
      return;
    }
    if (rule.anyOf) {
      const matches = rule.anyOf.some((candidate) => validateInstance(node, candidate, { store, schemaPath: basePath, path: at, maxErrors: 1 }).length === 0);
      if (!matches) add('must match at least one anyOf branch', at);
      return;
    }
    if (rule.allOf) for (const candidate of rule.allOf) check(node, candidate, at, basePath);
    const allowedTypes = Array.isArray(rule.type) ? rule.type : rule.type ? [rule.type] : [];
    if (allowedTypes.length && !allowedTypes.some((t) => matchesType(node, t))) {
      add(`must be ${allowedTypes.join(' or ')}`, at); return;
    }
    if (typeof node === 'string') {
      if (rule.minLength !== undefined && [...node].length < rule.minLength) add(`must have length >= ${rule.minLength}`, at);
      if (rule.maxLength !== undefined && [...node].length > rule.maxLength) add(`must have length <= ${rule.maxLength}`, at);
      if (rule.pattern && !new RegExp(rule.pattern, 'u').test(node)) add(`must match ${rule.pattern}`, at);
      if (rule.format === 'date-time' && !isDateTime(node)) add('must be a valid RFC3339 date-time', at);
    }
    if (typeof node === 'number') {
      if (rule.minimum !== undefined && node < rule.minimum) add(`must be >= ${rule.minimum}`, at);
      if (rule.maximum !== undefined && node > rule.maximum) add(`must be <= ${rule.maximum}`, at);
    }
    if (Array.isArray(node)) {
      if (rule.minItems !== undefined && node.length < rule.minItems) add(`must have at least ${rule.minItems} items`, at);
      if (rule.maxItems !== undefined && node.length > rule.maxItems) add(`must have at most ${rule.maxItems} items`, at);
      if (rule.items) node.forEach((item, index) => check(item, rule.items, `${at}[${index}]`, basePath));
    }
    if (isObject(node)) {
      const properties = rule.properties ?? {};
      for (const required of rule.required ?? []) if (!(required in node)) add(`missing required property ${required}`, `${at}.${required}`);
      for (const [key, child] of Object.entries(node)) {
        if (properties[key]) check(child, properties[key], `${at}.${key}`, basePath);
        else if (rule.patternProperties) {
          const matching = Object.entries(rule.patternProperties).filter(([pattern]) => new RegExp(pattern, 'u').test(key));
          if (matching.length) for (const [, childRule] of matching) check(child, childRule, `${at}.${key}`, basePath);
          else if (rule.unevaluatedProperties === false || rule.additionalProperties === false) add(`unknown property ${key}`, `${at}.${key}`);
          else if (isObject(rule.additionalProperties)) check(child, rule.additionalProperties, `${at}.${key}`, basePath);
        } else if (rule.unevaluatedProperties === false || rule.additionalProperties === false) add(`unknown property ${key}`, `${at}.${key}`);
        else if (isObject(rule.additionalProperties)) check(child, rule.additionalProperties, `${at}.${key}`, basePath);
      }
      if (rule.propertyNames?.pattern) for (const key of Object.keys(node)) if (!new RegExp(rule.propertyNames.pattern, 'u').test(key)) add(`property name must match ${rule.propertyNames.pattern}`, `${at}.${key}`);
      if (rule.minProperties !== undefined && Object.keys(node).length < rule.minProperties) add(`must have at least ${rule.minProperties} properties`, at);
      if (rule.maxProperties !== undefined && Object.keys(node).length > rule.maxProperties) add(`must have at most ${rule.maxProperties} properties`, at);
    }
  }
  check(value, schema, path, schemaPath);
  return errors;
}

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isObject(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}
function isObject(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function isDateTime(value) { const ms = Date.parse(value); return Number.isFinite(ms) && /T/.test(value); }
