import type {
  AcceptedEvidence,
  AssuranceDecision,
  AssurancePolicy,
  AssuranceProfile,
  EvidenceEnvelope,
  Observation,
  SubjectReference,
  Waiver,
} from '@l9/assurance-contracts';
import { EXIT_CODES } from '@l9/assurance-contracts';
import {
  canonicalJson,
  discoverJsonArtifacts,
  observationFingerprint,
  validateObservation,
  verifyEnvelopeIntegrity,
} from '@l9/assurance-evidence';
import { renderDecisionSummary, verifyDecision } from '@l9/assurance-evaluator';
import { parseWaiver } from '@l9/assurance-policy';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertAllowedFlags, optionalFlag, parseArgs, requireFlag, type ParsedArgs } from './args.js';
import { loadBuiltInConfiguration, type BuiltInConfiguration } from './config.js';
import { AssuranceEngine } from './engine.js';
import { readJsonFile, resolveRoot, rootPath, writeJsonFile, writeTextFile } from './io.js';

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

const defaultIo: CliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export async function runCli(argv: readonly string[], io: CliIo = defaultIo): Promise<number> {
  try {
    const parsed = parseArgs(argv);
    const [command, subcommand, ...extraPositionals] = parsed.positionals;
    if (extraPositionals.length > 0) throw new Error(`Unexpected positional argument(s): ${extraPositionals.join(', ')}`);

    if (command === 'verify') {
      assertAllowedFlags(parsed, ['decision']);
      const report = verifyDecision(readJsonFile(requireFlag(parsed, 'decision')));
      io.stdout(`${JSON.stringify(report, null, 2)}\n`);
      return report.valid ? EXIT_CODES.pass : EXIT_CODES.input;
    }

    if (command === 'conformance' && subcommand === 'producer') {
      assertAllowedFlags(parsed, ['root', 'producer', 'input']);
      const producer = requireFlag(parsed, 'producer');
      const artifacts = discoverJsonArtifacts(requireFlag(parsed, 'input'));
      const cases = artifacts.map((item) => {
        const validation = validateObservation(item.value);
        const observation = item.value as Partial<Observation>;
        const producerMatches = observation.producer?.id === producer;
        return {
          path: item.path,
          passed: validation.valid && producerMatches,
          reasons: [...validation.errors, ...(producerMatches ? [] : [`Expected producer ${producer}.`])],
        };
      });
      const report = { producer, passed: cases.length > 0 && cases.every((item) => item.passed), files: artifacts.length, cases };
      io.stdout(`${JSON.stringify(report, null, 2)}\n`);
      return report.passed ? EXIT_CODES.pass : EXIT_CODES.input;
    }

    if (command === 'conformance' && subcommand === 'consumer') {
      assertAllowedFlags(parsed, ['root', 'consumer', 'fixture']);
      const fixture = resolve(requireFlag(parsed, 'fixture'));
      const decision = readJsonFile<AssuranceDecision>(rootPath(fixture, 'decision.json'));
      const verification = verifyDecision(decision);
      const transported = readFileSync(rootPath(fixture, 'transported-decision.json'), 'utf8');
      const summary = readFileSync(rootPath(fixture, 'decision.summary.md'), 'utf8');
      const publishedVerdict = readFileSync(rootPath(fixture, 'published-verdict.txt'), 'utf8').trim();
      const expected = `${canonicalJson(decision)}\n`;
      const expectedSummary = renderDecisionSummary(decision);
      const checks = [
        { id: 'decision-valid', passed: verification.valid },
        { id: 'byte-transport', passed: transported === expected },
        { id: 'verdict', passed: publishedVerdict.toLowerCase() === decision.verdict },
        { id: 'summary', passed: summary === expectedSummary },
      ];
      const report = { consumerId: requireFlag(parsed, 'consumer'), passed: checks.every((item) => item.passed), checks };
      io.stdout(`${JSON.stringify(report, null, 2)}\n`);
      return report.passed ? EXIT_CODES.pass : EXIT_CODES.input;
    }

    const root = resolveRoot(optionalFlag(parsed, 'root'));
    const config = loadBuiltInConfiguration(root);
    const engine = new AssuranceEngine(config);

    if (command === 'plan' && subcommand === undefined) {
      assertAllowedFlags(parsed, ['root', 'profile', 'subject', 'output']);
      assertSelections(parsed, config, false);
      const subject = readJsonFile<SubjectReference>(requireFlag(parsed, 'subject'));
      const plan = await engine.plan({ subject });
      writeJsonFile(resolve(requireFlag(parsed, 'output')), plan);
      io.stdout(`Planned ${plan.controls.length} controls.\n`);
      return EXIT_CODES.pass;
    }

    if (command === 'evidence' && subcommand === 'admit') {
      assertAllowedFlags(parsed, ['root', 'subject', 'input', 'received-at', 'output']);
      const subject = readJsonFile<SubjectReference>(requireFlag(parsed, 'subject'));
      const artifacts = discoverJsonArtifacts(requireFlag(parsed, 'input'));
      const receivedAt = optionalFlag(parsed, 'received-at');
      const report = await engine.admit({
        subject,
        observations: artifacts.map((item) => item.value),
        ...(receivedAt ? { receivedAt } : {}),
      });
      const output = resolve(requireFlag(parsed, 'output'));
      writeJsonFile(rootPath(output, 'admission-report.json'), report);
      for (const accepted of report.accepted) {
        writeJsonFile(rootPath(output, 'accepted', `${accepted.envelope.evidenceId}.json`), accepted.envelope);
      }
      io.stdout(`Accepted ${report.accepted.length}; rejected ${report.rejectedCount}; quarantined ${report.quarantinedCount}; duplicate ${report.duplicateCount}.\n`);
      return EXIT_CODES.pass;
    }

    if ((command === 'evaluate' || command === 'simulate') && subcommand === undefined) {
      assertAllowedFlags(parsed, ['root', 'subject', 'profile', 'policy', 'evidence', 'evaluation-time', 'waivers', 'output']);
      assertSelections(parsed, config, true);
      const subject = readJsonFile<SubjectReference>(requireFlag(parsed, 'subject'));
      const accepted = loadAccepted(requireFlag(parsed, 'evidence'));
      const waiverPath = optionalFlag(parsed, 'waivers');
      const waivers = waiverPath
        ? discoverJsonArtifacts(waiverPath).map((item) => parseWaiver(JSON.stringify(item.value)))
        : [];
      const decision = await engine.evaluate({
        subject,
        acceptedEvidence: accepted,
        evaluationTime: requireFlag(parsed, 'evaluation-time'),
        waivers,
      });
      const finalDecision: AssuranceDecision = command === 'simulate'
        ? { ...decision, extensions: { ...(decision.extensions ?? {}), 'l9.assurance.simulation': { authoritative: false } } }
        : decision;
      const output = resolve(requireFlag(parsed, 'output'));
      writeTextFile(rootPath(output, 'decision.json'), `${canonicalJson(finalDecision)}\n`);
      writeTextFile(rootPath(output, 'decision.summary.md'), renderDecisionSummary(finalDecision));
      writeJsonFile(rootPath(output, 'evidence-manifest.json'), finalDecision.evidenceManifest);
      io.stdout(`${command === 'simulate' ? 'Simulation' : 'Decision'} ${finalDecision.verdict}.\n`);
      return command === 'simulate' ? EXIT_CODES.pass : EXIT_CODES[finalDecision.verdict];
    }

    throw new Error('Unknown command. Supported: plan, evidence admit, evaluate, verify, conformance producer, conformance consumer, simulate.');
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return classifyError(error);
  }
}

function assertSelections(
  parsed: ParsedArgs,
  config: Pick<BuiltInConfiguration, 'profile' | 'policy'>,
  requirePolicy: boolean,
): void {
  const profileSelection = optionalFlag(parsed, 'profile');
  if (profileSelection && !matchesVersionedReference(profileSelection, config.profile)) {
    throw new Error(`Unsupported profile ${profileSelection}. Release zero supports ${config.profile.id}@${config.profile.version}.`);
  }
  const policySelection = optionalFlag(parsed, 'policy');
  if (policySelection && !matchesVersionedReference(policySelection, config.policy)) {
    throw new Error(`Unsupported policy ${policySelection}. Release zero supports ${config.policy.id}@${config.policy.version}.`);
  }
  if (requirePolicy && !policySelection) throw new Error('Missing --policy');
}

function matchesVersionedReference(
  selection: string,
  value: Pick<AssuranceProfile | AssurancePolicy, 'id' | 'version'>,
): boolean {
  const major = value.version.split('.')[0];
  return selection === value.id || selection === `${value.id}@${value.version}` || selection === `${value.id}@${major}`;
}

function loadAccepted(path: string): readonly AcceptedEvidence[] {
  return discoverJsonArtifacts(path)
    .map((item) => {
      if (!isRecord(item.value)) throw new Error(`EVIDENCE_SCHEMA_INVALID: ${item.path}: envelope must be an object`);
      const envelope = item.value as unknown as EvidenceEnvelope;
      if (envelope.schema !== 'l9.evidence-envelope' || envelope.schemaVersion !== '1.0.0') {
        throw new Error(`EVIDENCE_SCHEMA_UNSUPPORTED: ${item.path}`);
      }
      if (!verifyEnvelopeIntegrity(envelope)) throw new Error(`EVIDENCE_PAYLOAD_DIGEST_MISMATCH: ${item.path}`);
      const structural = validateObservation(envelope.payload);
      if (!structural.valid || !structural.observation) {
        throw new Error(`EVIDENCE_SCHEMA_INVALID: ${item.path}: ${structural.errors.join('; ')}`);
      }
      if (envelope.sourceObservationId !== structural.observation.observationId) {
        throw new Error(`EVIDENCE_LINEAGE_INVALID: ${item.path}: sourceObservationId mismatch`);
      }
      if (canonicalJson(envelope.subject) !== canonicalJson(structural.observation.subject)) {
        throw new Error(`EVIDENCE_SUBJECT_MISMATCH: ${item.path}`);
      }
      if (envelope.producer.id !== structural.observation.producer.id || envelope.producer.version !== structural.observation.producer.version) {
        throw new Error(`EVIDENCE_PRODUCER_UNKNOWN: ${item.path}: envelope producer mismatch`);
      }
      const observation = structural.observation;
      return { envelope, observation, fingerprint: observationFingerprint(observation) };
    })
    .sort((a, b) => a.envelope.evidenceId.localeCompare(b.envelope.evidenceId));
}

function classifyError(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Policy') || message.includes('policy') || message.includes('profile')) return EXIT_CODES.policy;
  if (message.includes('EVIDENCE_')) return EXIT_CODES.admission;
  if (message.includes('signature')) return EXIT_CODES.signature;
  return EXIT_CODES.input;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
