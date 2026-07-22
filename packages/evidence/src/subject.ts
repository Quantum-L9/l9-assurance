import type { SubjectReference } from '@l9/assurance-contracts';

const COMMIT_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export function normalizeSubject(input: SubjectReference): SubjectReference {
  if (input.kind !== 'git-revision') throw new Error('EVIDENCE_SUBJECT_INVALID: only git-revision is supported');
  const host = input.repository.host.trim().toLowerCase();
  const owner = input.repository.owner.trim();
  const name = input.repository.name.trim().replace(/\.git$/i, '');
  const commit = input.revision.commit.trim().toLowerCase();
  if (!host || !owner || !name || !COMMIT_PATTERN.test(commit)) throw new Error('EVIDENCE_SUBJECT_INVALID: malformed repository or commit');
  const revision = input.revision.treeDigest ? { commit, treeDigest: input.revision.treeDigest } : { commit };
  const normalized: SubjectReference = { kind: 'git-revision', repository: { host, owner, name }, revision };
  return input.metadata ? { ...normalized, metadata: sortStringRecord(input.metadata) } : normalized;
}

export function sameRepository(a: SubjectReference, b: SubjectReference): boolean {
  const left = normalizeSubject(a); const right = normalizeSubject(b);
  return left.repository.host === right.repository.host && left.repository.owner === right.repository.owner && left.repository.name === right.repository.name;
}
export function sameRevision(a: SubjectReference, b: SubjectReference): boolean {
  const left = normalizeSubject(a); const right = normalizeSubject(b);
  return sameRepository(left, right) && left.revision.commit === right.revision.commit && digestEqual(left.revision.treeDigest, right.revision.treeDigest);
}
function digestEqual(a: SubjectReference['revision']['treeDigest'], b: SubjectReference['revision']['treeDigest']): boolean {
  if (!a && !b) return true;
  return Boolean(a && b && a.algorithm === b.algorithm && a.value === b.value);
}
function sortStringRecord(record: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(record).sort(([a],[b])=>a.localeCompare(b)));
}
