import { createHash, timingSafeEqual } from 'node:crypto';
import type { Digest } from '@l9/assurance-contracts';
import { canonicalJson } from './canonical.js';

export function sha256Bytes(bytes: string | Uint8Array): Digest {
  return { algorithm: 'sha256', value: createHash('sha256').update(bytes).digest('hex') };
}
export function sha256Digest(value: unknown): Digest { return sha256Bytes(canonicalJson(value)); }
export function verifyDigest(value: unknown, digest: Digest): boolean {
  if (digest.algorithm !== 'sha256' || !/^[a-f0-9]{64}$/.test(digest.value)) return false;
  const actual = sha256Digest(value).value;
  return timingSafeEqual(new TextEncoder().encode(actual), new TextEncoder().encode(digest.value));
}
