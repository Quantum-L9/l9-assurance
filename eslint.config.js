/**
 * The repository intentionally has no external lint dependency in Release zero.
 * `npm run lint` executes the deterministic boundary and source hygiene checks
 * in scripts/lint.mjs. This file reserves the standard ESLint entrypoint for a
 * later approved tooling decision without changing lint semantics.
 */
export default [];
