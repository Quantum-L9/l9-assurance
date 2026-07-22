export class CanonicalizationError extends Error {
  constructor(message: string) { super(message); this.name = 'CanonicalizationError'; }
}

export function canonicalJson(value: unknown): string {
  const seen = new Set<object>();
  return serialize(value, seen, '$');
}

function serialize(value: unknown, seen: Set<object>, path: string): string {
  if (value === null) return 'null';
  if (typeof value === 'string') { if (hasUnpairedSurrogate(value)) throw new CanonicalizationError(`${path}: malformed Unicode surrogate`); return JSON.stringify(value); }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new CanonicalizationError(`${path}: non-finite numbers are forbidden`);
    if (Object.is(value, -0)) return '0';
    return JSON.stringify(value);
  }
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function' || value === undefined) {
    throw new CanonicalizationError(`${path}: unsupported value type ${typeof value}`);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new CanonicalizationError(`${path}: cyclic value`);
    seen.add(value);
    const output = `[${value.map((item, index) => serialize(item, seen, `${path}[${index}]`)).join(',')}]`;
    seen.delete(value);
    return output;
  }
  if (typeof value === 'object') {
    if (seen.has(value)) throw new CanonicalizationError(`${path}: cyclic value`);
    seen.add(value);
    const record = value as Readonly<Record<string, unknown>>;
    const keys = Object.keys(record).sort(compareUnicodeCodePoints);
    const entries = keys.map((key) => `${JSON.stringify(key)}:${serialize(record[key], seen, `${path}.${key}`)}`);
    seen.delete(value);
    return `{${entries.join(',')}}`;
  }
  throw new CanonicalizationError(`${path}: unsupported value`);
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return true; index += 1; }
    else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

function compareUnicodeCodePoints(a: string, b: string): number {
  const aa = Array.from(a);
  const bb = Array.from(b);
  const length = Math.min(aa.length, bb.length);
  for (let index = 0; index < length; index += 1) {
    const ac = aa[index]?.codePointAt(0) ?? 0;
    const bc = bb[index]?.codePointAt(0) ?? 0;
    if (ac !== bc) return ac - bc;
  }
  return aa.length - bb.length;
}
