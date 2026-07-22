declare const process: {
  argv: string[];
  cwd(): string;
  exitCode?: number;
  env: Record<string, string | undefined>;
  stdout: { write(chunk: string): void };
  stderr: { write(chunk: string): void };
};

declare module "node:crypto" {
  export interface Hash {
    update(data: string | Uint8Array): Hash;
    digest(encoding: "hex"): string;
  }
  export function createHash(algorithm: string): Hash;
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

declare module "node:fs" {
  export interface Stats { isFile(): boolean; isDirectory(): boolean; isSymbolicLink(): boolean; size: number; }
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function writeFileSync(path: string, data: string, encoding?: "utf8"): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string | undefined;
  export function readdirSync(path: string, options?: { withFileTypes?: false }): string[];
  export function statSync(path: string): Stats;
  export function lstatSync(path: string): Stats;
  export function realpathSync(path: string): string;
  export function existsSync(path: string): boolean;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  export function chmodSync(path: string, mode: number): void;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
  export function basename(path: string): string;
  export function isAbsolute(path: string): boolean;
  export function normalize(path: string): string;
  export const sep: string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
