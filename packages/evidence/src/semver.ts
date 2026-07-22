export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
}

export function parseSemVer(value: string): SemVer | null {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
  if (!match) return null;
  const base = { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
  return match[4] ? { ...base, prerelease: match[4] } : base;
}

export function compareSemVer(a: string, b: string): number {
  const left = parseSemVer(a);
  const right = parseSemVer(b);
  if (!left || !right) throw new Error(`Invalid semantic version: ${!left ? a : b}`);
  for (const key of ['major', 'minor', 'patch'] as const) {
    const delta = left[key] - right[key];
    if (delta !== 0) return delta;
  }
  if (left.prerelease === right.prerelease) return 0;
  if (!left.prerelease) return 1;
  if (!right.prerelease) return -1;
  return comparePrerelease(left.prerelease, right.prerelease);
}

export function satisfiesRange(version: string, range: string): boolean {
  const clauses = range.trim().split(/\s+/).filter(Boolean);
  if (!parseSemVer(version) || clauses.length === 0) return false;
  return clauses.every((clause) => {
    const match = /^(>=|<=|>|<|=)?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)$/.exec(clause);
    if (!match) return false;
    const operator = match[1] ?? '=';
    const target = match[2] ?? '';
    const comparison = compareSemVer(version, target);
    return operator === '>=' ? comparison >= 0
      : operator === '<=' ? comparison <= 0
        : operator === '>' ? comparison > 0
          : operator === '<' ? comparison < 0
            : comparison === 0;
  });
}

function comparePrerelease(left: string, right: string): number {
  const a = left.split('.');
  const b = right.split('.');
  const count = Math.max(a.length, b.length);
  for (let index = 0; index < count; index += 1) {
    const leftPart = a[index];
    const rightPart = b[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) return Number(leftPart) - Number(rightPart);
    if (leftNumeric) return -1;
    if (rightNumeric) return 1;
    return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}
