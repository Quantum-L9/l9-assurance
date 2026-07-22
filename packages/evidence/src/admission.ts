import type {
  AcceptedEvidence,
  AdmissionReasonCode,
  AdmissionReport,
  CheckRegistry,
  EvidenceAdmissionResult,
  EvidenceEnvelope,
  Observation,
  ProducerRegistry,
  SubjectReference,
  Unknown
} from '@l9/assurance-contracts';
import { canonicalJson } from './canonical.js';
import { sha256Digest, verifyDigest } from './digest.js';
import { DEFAULT_ADMISSION_LIMITS, type AdmissionLimits } from './limits.js';
import { InMemoryReplayStore, type ReplayStore } from './replay.js';
import { satisfiesRange } from './semver.js';
import { normalizeSubject, sameRepository, sameRevision } from './subject.js';
import { validateObservation } from './validation.js';

export interface AdmissionContext {
  readonly subject: SubjectReference;
  readonly producerRegistry: ProducerRegistry;
  readonly checkRegistry: CheckRegistry;
  readonly receivedAt: string;
  readonly channel: 'local' | 'ci-artifact' | 'api' | 'bundle';
  readonly replayStore?: ReplayStore;
  readonly limits?: Partial<AdmissionLimits>;
  readonly maximumAgeSecondsByCheck?: Readonly<Record<string, number>>;
  readonly futureToleranceSeconds?: number;
  readonly policyAdmissibility?: (observation: Observation) => string | undefined;
}

export async function admitObservations(values: readonly unknown[], context: AdmissionContext): Promise<AdmissionReport> {
  const limits = { ...DEFAULT_ADMISSION_LIMITS, ...context.limits };
  if (values.length > limits.maximumObservationCount) throw new Error(`EVIDENCE_LIMIT_EXCEEDED: observation count ${values.length}`);
  const replayStore = context.replayStore ?? new InMemoryReplayStore();
  const accepted: AcceptedEvidence[] = [];
  const results: EvidenceAdmissionResult[] = [];
  const unknowns: Unknown[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const outcome = admitOne(values[index], context, replayStore, limits, index);
    results.push(outcome.result);
    if (outcome.accepted) accepted.push(outcome.accepted);
    if (outcome.unknown) unknowns.push(outcome.unknown);
  }
  return Object.freeze({
    subject: normalizeSubject(context.subject),
    receivedAt: requireDate(context.receivedAt, 'receivedAt'),
    results: Object.freeze(results),
    accepted: Object.freeze(accepted.sort((a,b)=>a.envelope.evidenceId.localeCompare(b.envelope.evidenceId))),
    rejectedCount: results.filter((x)=>x.status==='rejected').length,
    quarantinedCount: results.filter((x)=>x.status==='quarantined').length,
    duplicateCount: results.filter((x)=>x.status==='duplicate').length,
    unknowns: Object.freeze(unknowns.sort((a,b)=>a.unknownId.localeCompare(b.unknownId)))
  });
}

function admitOne(value: unknown, context: AdmissionContext, replayStore: ReplayStore, limits: AdmissionLimits, index: number): { result: EvidenceAdmissionResult; accepted?: AcceptedEvidence; unknown?: Unknown } {
  const validations = emptyValidations();
  const structural = validateObservation(value, limits);
  if (!structural.valid || !structural.observation) {
    validations.schema = validation('fail','EVIDENCE_SCHEMA_INVALID',structural.errors.join('; '));
    return terminal('rejected', reasons(structural.errors.map((message)=>reason(classifyStructuralCode(message),message))), validations, undefined, unknown(index,'invalid-evidence',structural.errors.join('; ')));
  }
  const observation = structural.observation;
  validations.schema = validation('pass');
  let normalizedSubject: SubjectReference;
  try { normalizedSubject = normalizeSubject(observation.subject); }
  catch (error) {
    validations.subject = validation('fail','EVIDENCE_SUBJECT_INVALID',messageOf(error));
    return terminal('rejected',[reason('EVIDENCE_SUBJECT_INVALID',messageOf(error))],validations,undefined,unknown(index,'invalid-evidence',messageOf(error)));
  }
  const expected = normalizeSubject(context.subject);
  if (!sameRepository(normalizedSubject, expected)) {
    validations.subject = validation('fail','EVIDENCE_SUBJECT_MISMATCH','repository identity differs from evaluated subject');
    return terminal('rejected',[reason('EVIDENCE_SUBJECT_MISMATCH','repository identity differs from evaluated subject')],validations,undefined,unknown(index,'invalid-evidence','Repository identity mismatch.'));
  }
  if (!sameRevision(normalizedSubject, expected)) {
    validations.subject = validation('fail','EVIDENCE_REVISION_MISMATCH','revision differs from evaluated subject');
    return terminal('rejected',[reason('EVIDENCE_REVISION_MISMATCH','revision differs from evaluated subject')],validations,undefined,unknown(index,'invalid-evidence','Revision mismatch.'));
  }
  validations.subject = validation('pass');

  const producer = context.producerRegistry.producers.find((entry)=>entry.id===observation.producer.id);
  if (!producer) {
    validations.producer = validation('fail','EVIDENCE_PRODUCER_UNKNOWN','producer is not registered');
    return terminal('rejected',[reason('EVIDENCE_PRODUCER_UNKNOWN','producer is not registered')],validations,undefined,unknown(index,'unverified-producer','Producer is not registered.'));
  }
  if (producer.authorization_status === 'pending' || !producer.allowed_versions) {
    validations.producer = validation('fail','EVIDENCE_POLICY_INADMISSIBLE','producer is registered but trust activation is pending');
    return terminal('quarantined',[reason('EVIDENCE_POLICY_INADMISSIBLE','producer trust activation is pending')],validations,undefined,unknown(index,'unverified-producer','Producer trust activation is pending.'));
  }
  if (producer.authorization_status === 'revoked' || !satisfiesRange(observation.producer.version, producer.allowed_versions)) {
    validations.producer = validation('fail','EVIDENCE_PRODUCER_VERSION_REVOKED','producer version is not authorized');
    return terminal('rejected',[reason('EVIDENCE_PRODUCER_VERSION_REVOKED','producer version is not authorized')],validations,undefined,unknown(index,'unverified-producer','Producer version is not authorized.'));
  }
  if (!producer.subject_kinds.includes(observation.subject.kind)) {
    validations.producer = validation('fail','EVIDENCE_POLICY_INADMISSIBLE','producer is not authorized for subject kind');
    return terminal('rejected',[reason('EVIDENCE_POLICY_INADMISSIBLE','producer is not authorized for subject kind')],validations,undefined,unknown(index,'unverified-producer','Producer is not authorized for subject kind.'));
  }
  if (observation.producer.repository && normalizeRepository(observation.producer.repository) !== normalizeRepository(producer.repository)) {
    validations.producer = validation('fail','EVIDENCE_PRODUCER_UNKNOWN','producer repository does not match registry');
    return terminal('rejected',[reason('EVIDENCE_PRODUCER_UNKNOWN','producer repository does not match registry')],validations,undefined,unknown(index,'unverified-producer','Producer repository does not match registry.'));
  }
  validations.producer = validation('pass');

  const check = context.checkRegistry.checks.find((entry)=>entry.id===observation.check.id && entry.version===observation.check.version);
  if (!check || !producer.checks.includes(observation.check.id) || check.owner!==producer.id || check.revoked_versions.includes(observation.check.version)) {
    validations.authorization = validation('fail','EVIDENCE_CHECK_UNAUTHORIZED','check identity is not authorized for producer');
    return terminal('rejected',[reason('EVIDENCE_CHECK_UNAUTHORIZED','check identity is not authorized for producer')],validations,undefined,unknown(index,'unsupported-check','Check is not authorized.'));
  }
  if (check.output_schema !== 'l9.observation/v1') {
    validations.authorization = validation('fail','EVIDENCE_SCHEMA_UNSUPPORTED','check output schema is not supported');
    return terminal('rejected',[reason('EVIDENCE_SCHEMA_UNSUPPORTED','check output schema is not supported')],validations,undefined,unknown(index,'unsupported-check','Check output schema is not supported.'));
  }
  if (!check.accepted_execution_statuses.includes(observation.execution.status)) {
    validations.authorization = validation('fail','EVIDENCE_CHECK_UNAUTHORIZED','execution status is not authorized for check');
    return terminal('rejected',[reason('EVIDENCE_CHECK_UNAUTHORIZED','execution status is not authorized for check')],validations,undefined,unknown(index,'unsupported-check','Execution status is not authorized for check.'));
  }
  if (check.configuration_digest_required && !observation.check.configurationDigest) {
    validations.authorization = validation('fail','EVIDENCE_SCHEMA_INVALID','configuration digest is required');
    return terminal('rejected',[reason('EVIDENCE_SCHEMA_INVALID','configuration digest is required')],validations,undefined,unknown(index,'invalid-evidence','Configuration digest is missing.'));
  }
  validations.authorization = validation('pass');

  const started = Date.parse(observation.execution.startedAt); const completed=Date.parse(observation.execution.completedAt); const received=Date.parse(context.receivedAt);
  if (!Number.isFinite(started)||!Number.isFinite(completed)||started>completed) {
    validations.freshness = validation('fail','EVIDENCE_EXECUTION_INTERVAL_INVALID','execution interval is invalid');
    return terminal('rejected',[reason('EVIDENCE_EXECUTION_INTERVAL_INVALID','execution interval is invalid')],validations,undefined,unknown(index,'invalid-evidence','Execution interval is invalid.'));
  }
  const futureTolerance=(context.futureToleranceSeconds??300)*1000;
  if (completed>received+futureTolerance) {
    validations.freshness = validation('fail','EVIDENCE_EXECUTION_INTERVAL_INVALID','observation completion is unreasonably in the future');
    return terminal('rejected',[reason('EVIDENCE_EXECUTION_INTERVAL_INVALID','observation completion is unreasonably in the future')],validations,undefined,unknown(index,'environment-uncertainty','Observation completion is in the future.'));
  }
  const maxAge=context.maximumAgeSecondsByCheck?.[observation.check.id];
  if (maxAge!==undefined && received-completed>maxAge*1000) {
    validations.freshness = validation('fail','EVIDENCE_STALE','observation exceeds configured freshness');
    return terminal('rejected',[reason('EVIDENCE_STALE','observation exceeds configured freshness')],validations,undefined,unknown(index,'stale-evidence','Observation is stale.'));
  }
  validations.freshness = validation('pass');

  const policyReason=context.policyAdmissibility?.(observation);
  if(policyReason){validations.authorization=validation('fail','EVIDENCE_POLICY_INADMISSIBLE',policyReason);return terminal('rejected',[reason('EVIDENCE_POLICY_INADMISSIBLE',policyReason)],validations,undefined,unknown(index,'invalid-evidence',policyReason));}

  const fingerprint=observationFingerprint(observation);
  const existingId=replayStore.findByObservationId(observation.observationId);
  if(existingId && existingId.fingerprint!==fingerprint){validations.replay=validation('fail','EVIDENCE_REPLAY_DETECTED','observation ID was reused with different content');return terminal('rejected',[reason('EVIDENCE_REPLAY_DETECTED','observation ID was reused with different content')],validations,existingId.evidenceId,unknown(index,'invalid-evidence','Observation identity replay detected.'));}
  const duplicate=existingId??replayStore.findByFingerprint(fingerprint);
  if(duplicate){validations.replay=validation('pass','EVIDENCE_REPLAY_DETECTED','identical evidence already admitted');return terminal('duplicate',[reason('EVIDENCE_REPLAY_DETECTED','identical evidence already admitted')],validations,duplicate.evidenceId);}
  validations.replay=validation('pass'); validations.lineage=validation('pass'); validations.integrity=validation('pass');
  const payloadDigest=sha256Digest(observation); const evidenceId=`ev_${fingerprint.slice(0,40)}`;
  const envelope: EvidenceEnvelope = Object.freeze({
    schema:'l9.evidence-envelope',schemaVersion:'1.0.0',evidenceId,subject:normalizedSubject,producer:observation.producer,
    evidenceType:`l9.observation/${observation.check.id}`,observedAt:observation.execution.completedAt,issuedAt:context.receivedAt,
    payload:observation,payloadDigest,sourceObservationId:observation.observationId,lineage:Object.freeze([]),
    admissionContext:{receivedAt:context.receivedAt,channel:context.channel}
  });
  const accepted: AcceptedEvidence = Object.freeze({ envelope, observation, fingerprint });
  replayStore.record({observationId:observation.observationId,fingerprint,evidenceId});
  return {result:terminalResult('accepted',[],validations,evidenceId),accepted};
}

export function createEvidenceEnvelope(observation: Observation, issuedAt: string, channel: AdmissionContext['channel'] = 'local'): EvidenceEnvelope {
  const subject=normalizeSubject(observation.subject); const fingerprint=observationFingerprint(observation); const payloadDigest=sha256Digest(observation);
  return Object.freeze({schema:'l9.evidence-envelope',schemaVersion:'1.0.0',evidenceId:`ev_${fingerprint.slice(0,40)}`,subject,producer:observation.producer,evidenceType:`l9.observation/${observation.check.id}`,observedAt:observation.execution.completedAt,issuedAt:requireDate(issuedAt,'issuedAt'),payload:observation,payloadDigest,sourceObservationId:observation.observationId,lineage:Object.freeze([]),admissionContext:{receivedAt:issuedAt,channel}});
}
export function verifyEnvelopeIntegrity(envelope: EvidenceEnvelope): boolean { return verifyDigest(envelope.payload,envelope.payloadDigest); }
export function observationFingerprint(observation: Observation): string {
  const record=observation as unknown as Readonly<Record<string,unknown>>; const {observationId: _ignored, ...rest}=record;
  return sha256Digest(rest).value;
}

type MutableValidations = { -readonly [K in keyof EvidenceAdmissionResult['validations']]: EvidenceAdmissionResult['validations'][K] };
function emptyValidations(): MutableValidations { const skipped=validation('skipped'); return {schema:skipped,producer:skipped,subject:skipped,integrity:skipped,freshness:skipped,authorization:skipped,replay:skipped,lineage:skipped}; }
function validation(status:'pass'|'fail'|'skipped',code?:string,message?:string):EvidenceAdmissionResult['validations']['schema']{return code?message?{status,code,message}:{status,code}:{status};}
function reason(code:AdmissionReasonCode,message:string):EvidenceAdmissionResult['reasons'][number]{return{code,message};}
function reasons(items:readonly EvidenceAdmissionResult['reasons'][number][]):readonly EvidenceAdmissionResult['reasons'][number][]{return items;}
function classifyStructuralCode(message:string):AdmissionReasonCode{return message.startsWith('EVIDENCE_TOO_LARGE')?'EVIDENCE_TOO_LARGE':message.startsWith('EVIDENCE_LIMIT_EXCEEDED')?'EVIDENCE_LIMIT_EXCEEDED':message.startsWith('EVIDENCE_EXTENSION_NAMESPACE_INVALID')?'EVIDENCE_EXTENSION_NAMESPACE_INVALID':message.startsWith('EVIDENCE_SCHEMA_UNSUPPORTED')?'EVIDENCE_SCHEMA_UNSUPPORTED':message.startsWith('EVIDENCE_CANONICALIZATION_FAILED')?'EVIDENCE_CANONICALIZATION_FAILED':'EVIDENCE_SCHEMA_INVALID';}
function terminal(status:EvidenceAdmissionResult['status'],why:readonly EvidenceAdmissionResult['reasons'][number][],validations:EvidenceAdmissionResult['validations'],evidenceId?:string,unknownRecord?:Unknown):{result:EvidenceAdmissionResult;unknown?:Unknown}{const result=terminalResult(status,why,validations,evidenceId);return unknownRecord?{result,unknown:unknownRecord}:{result};}
function terminalResult(status:EvidenceAdmissionResult['status'],why:readonly EvidenceAdmissionResult['reasons'][number][],validations:EvidenceAdmissionResult['validations'],evidenceId?:string):EvidenceAdmissionResult{return evidenceId?{evidenceId,status,reasons:why,validations}:{status,reasons:why,validations};}
function unknown(index:number,category:Unknown['category'],description:string):Unknown{return{unknownId:`unknown_admission_${String(index).padStart(4,'0')}`,category,description,impact:'decision',relatedControls:[],resolvableBy:['produce conformant exact-revision evidence']};}
function messageOf(error:unknown):string{return error instanceof Error?error.message:String(error);}
function requireDate(value:string,label:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(`${label} must be RFC3339`);return value;}

function normalizeRepository(value:string):string{return value.trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/i,'').toLowerCase();}
