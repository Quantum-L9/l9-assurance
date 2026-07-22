export interface ParsedArgs {
  readonly positionals: readonly string[];
  readonly flags: Readonly<Record<string, string | boolean>>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? '';
    if (token === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const raw = token.slice(2);
    if (!raw) throw new Error('Empty flag name is not allowed');
    const equals = raw.indexOf('=');
    const name = equals >= 0 ? raw.slice(0, equals) : raw;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid flag --${name}`);
    if (Object.prototype.hasOwnProperty.call(flags, name)) throw new Error(`Duplicate flag --${name}`);
    if (equals >= 0) {
      const value = raw.slice(equals + 1);
      if (!value) throw new Error(`Missing --${name} value`);
      flags[name] = value;
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[name] = next;
      index += 1;
    } else {
      flags[name] = true;
    }
  }
  return { positionals: Object.freeze(positionals), flags: Object.freeze(flags) };
}

export function requireFlag(args: ParsedArgs, name: string): string {
  const value = args.flags[name];
  if (typeof value !== 'string' || !value) throw new Error(`Missing --${name}`);
  return value;
}

export function optionalFlag(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags[name];
  if (value === true) throw new Error(`Missing --${name} value`);
  return typeof value === 'string' ? value : undefined;
}

export function assertAllowedFlags(args: ParsedArgs, allowed: readonly string[]): void {
  const permitted = new Set(allowed);
  const unknown = Object.keys(args.flags).filter((name) => !permitted.has(name)).sort();
  if (unknown.length > 0) throw new Error(`Unknown flag(s): ${unknown.map((name) => `--${name}`).join(', ')}`);
}
