import type { AssuranceDecision } from '@l9/assurance-contracts';
import { canonicalJson, sha256Digest } from '@l9/assurance-evidence';
import { escapeMarkdown, renderDecisionSummary, verifyDecision } from '@l9/assurance-evaluator';

export interface ConsumerConformanceReport {
  readonly consumerId: string;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly message: string }[];
}

export function runConsumerConformance(input: {
  readonly consumerId: string;
  readonly canonicalDecision: unknown;
  readonly transportedDecisionText: string;
  readonly publishedVerdict: string;
  readonly publishedSummary: string;
}): ConsumerConformanceReport {
  const verification = verifyDecision(input.canonicalDecision);
  let canonical = '';
  let transported: unknown;
  let canonicalDigest = '';
  let transportedDigest = '';
  let expectedSummary = '';
  let expectedVerdict = '';

  try {
    canonical = `${canonicalJson(input.canonicalDecision)}\n`;
    canonicalDigest = sha256Digest(input.canonicalDecision).value;
  } catch {
    canonical = '';
  }
  try {
    transported = JSON.parse(input.transportedDecisionText) as unknown;
    transportedDigest = sha256Digest(transported).value;
  } catch {
    transported = undefined;
  }
  if (verification.valid && isRecord(input.canonicalDecision)) {
    expectedVerdict = typeof input.canonicalDecision.verdict === 'string' ? input.canonicalDecision.verdict : '';
    try {
      expectedSummary = renderDecisionSummary(input.canonicalDecision as unknown as AssuranceDecision);
    } catch {
      expectedSummary = '';
    }
  }

  const checks = [
    check('byte-transport', canonical.length > 0 && input.transportedDecisionText === canonical, 'decision transported byte-for-byte'),
    check('digest', canonicalDigest.length > 0 && transportedDigest === canonicalDigest, 'decision digest preserved'),
    check('verdict', expectedVerdict.length > 0 && input.publishedVerdict.toLowerCase() === expectedVerdict, 'published verdict matches'),
    check('summary', expectedSummary.length > 0 && input.publishedSummary === expectedSummary, 'summary is canonical projection'),
    check('schema', verification.valid, 'decision schema supported'),
    check('escaping', !input.publishedSummary.includes('<script>'), 'summary escapes raw HTML'),
  ];
  return {
    consumerId: input.consumerId,
    passed: checks.every((item) => item.passed),
    checks: Object.freeze(checks),
  };
}

export function escapeConsumerText(value: string): string {
  return escapeMarkdown(value);
}

function check(
  id: string,
  passed: boolean,
  message: string,
): { readonly id: string; readonly passed: boolean; readonly message: string } {
  return { id, passed, message };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
