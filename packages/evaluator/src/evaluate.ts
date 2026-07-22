import type {
  AcceptedEvidence,
  AssuranceDecision,
  ControlDefinition,
  ControlResult,
  EvaluationContext,
  ResolvedAssurancePolicy,
  ResolvedAssuranceProfile,
  SubjectReference,
  Unknown,
  Waiver
} from '@l9/assurance-contracts';
import { assessControl } from '@l9/assurance-controls';
import { sha256Digest } from '@l9/assurance-evidence';
import { findActiveWaiver } from '@l9/assurance-policy';

export function evaluate(
  subject: SubjectReference,
  profile: ResolvedAssuranceProfile,
  policy: ResolvedAssurancePolicy,
  evidence: readonly AcceptedEvidence[],
  context: EvaluationContext
): AssuranceDecision {
  assertContext(context);
  const results:ControlResult[]=[]; const unknowns:Unknown[]=[...(context.admissionUnknowns??[])]; const appliedWaivers:Waiver[]=[];
  const byControl=new Map<string,ControlResult>();
  for(const original of profile.controls){
    const control=applyOverride(original,policy.policy);
    if(!control){const disabled:ControlResult={controlId:original.id,controlVersion:original.version,status:'not-applicable',severity:original.severity,evidenceRefs:[],waiverRefs:[],unknownRefs:[],reasons:[{code:'CONTROL_POLICY_DISABLED',message:'control disabled by resolved policy'}],evaluatedAt:context.evaluationTime};results.push(disabled);byControl.set(original.id,disabled);continue;}
    const blocked=(control.dependencies??[]).find((dependency)=>!['pass','conditional'].includes(byControl.get(dependency.id)?.status??'indeterminate'));
    if(blocked){
      const unknownRecord=createUnknown(control,'external-dependency',`Dependency ${blocked.id} did not complete successfully.`); unknowns.push(unknownRecord);
      const result:ControlResult={controlId:control.id,controlVersion:control.version,status:'indeterminate',severity:control.severity,evidenceRefs:[],waiverRefs:[],unknownRefs:[unknownRecord.unknownId],reasons:[{code:'CONTROL_EVIDENCE_MISSING',message:`dependency ${blocked.id} is unresolved`}],evaluatedAt:context.evaluationTime}; results.push(result); byControl.set(control.id,result); continue;
    }
    const effectiveControl=control.evaluation.type==='no-matching-findings'
      ?{...control,evaluation:{...control.evaluation,mandatoryFindingSeverities:policy.policy.mandatoryFindingSeverities}}
      :control;
    const assessment=assessControl(effectiveControl,evidence,subject); let status:ControlResult['status']=assessment.status; const waiverRefs:string[]=[]; const unknownRefs:string[]=[]; const reasons=[...assessment.reasons];
    if(status==='fail'){
      const waiver=findActiveWaiver(policy.waivers,control,subject,policy.policy,context.evaluationTime);
      if(waiver){status='conditional';waiverRefs.push(waiver.waiverId);appliedWaivers.push(waiver);reasons.push({code:'CONTROL_WAIVER_APPLIED',message:`active waiver ${waiver.waiverId} applied`});}
    }
    if(status==='indeterminate'){
      const handling=control.severity==='mandatory'?policy.policy.unknownHandling.mandatory:policy.policy.unknownHandling.advisory;
      if(handling==='fail'){status='fail';reasons.push({code:'CONTROL_POLICY_UNKNOWN_FAIL',message:`policy converts unresolved mandatory control ${control.id} to fail`});}
      else if(handling!=='ignore'){const unknownRecord=createUnknown(control,assessment.unknownCategory??'other',`Control ${control.id} could not be established.`); unknowns.push(unknownRecord); unknownRefs.push(unknownRecord.unknownId);}
    }
    const result:ControlResult={
      controlId:control.id,controlVersion:control.version,status,severity:control.severity,
      evidenceRefs:Object.freeze([...assessment.evidenceRefs].sort()),waiverRefs:Object.freeze(waiverRefs.sort()),unknownRefs:Object.freeze(unknownRefs.sort()),
      reasons:Object.freeze(reasons.sort((a,b)=>a.code.localeCompare(b.code)||a.message.localeCompare(b.message))),evaluatedAt:context.evaluationTime
    };
    results.push(result); byControl.set(control.id,result);
  }
  const sortedResults=Object.freeze(results.sort((a,b)=>a.controlId.localeCompare(b.controlId)));
  const verdict=reduceVerdict(sortedResults);
  const claims=buildClaims(profile,sortedResults,verdict);
  const manifest=Object.freeze(evidence.map((item)=>({evidenceId:item.envelope.evidenceId,digest:item.envelope.payloadDigest,evidenceType:item.envelope.evidenceType})).sort((a,b)=>a.evidenceId.localeCompare(b.evidenceId)));
  const decision:AssuranceDecision={
    schema:'l9.assurance-decision',schemaVersion:'1.0.0',decisionId:context.decisionId,subject,
    profile:{id:profile.profile.id,version:profile.profile.version,digest:sha256Digest(profile.profile)},
    policy:{id:policy.policy.id,version:policy.policy.version,digest:sha256Digest(policy.policy)},
    verdict,controlResults:sortedResults,claims,evidenceManifest:manifest,
    waivers:Object.freeze(uniqueWaivers(appliedWaivers).map((waiver)=>({waiverId:waiver.waiverId,controlId:waiver.controlId}))),
    unknowns:Object.freeze(dedupeUnknowns(unknowns)),dimensions:dimensions(sortedResults,profile.controls,evidence),issuedAt:context.evaluationTime,evaluator:context.evaluator,
    ...(context.previousDecisionId?{supersedes:context.previousDecisionId}:{})
  };
  return deepFreeze(decision);
}

export function reduceVerdict(results:readonly ControlResult[]):AssuranceDecision['verdict']{
  const mandatory=results.filter((result)=>result.severity==='mandatory'&&result.status!=='not-applicable');
  if(mandatory.some((result)=>result.status==='fail'))return'fail';
  if(mandatory.some((result)=>result.status==='indeterminate'))return'indeterminate';
  if(mandatory.some((result)=>result.status==='conditional'))return'conditional';
  return'pass';
}
function applyOverride(control:ControlDefinition,policy:ResolvedAssurancePolicy['policy']):ControlDefinition|undefined{
  const override=policy.controlOverrides.find((item)=>item.controlId===control.id); if(override?.enabled===false)return undefined;
  if(!override)return control;
  return{...control,...(override.severity?{severity:override.severity}:{}),...(override.waiverAllowed!==undefined?{waiver:{...(control.waiver??{allowed:false}),allowed:override.waiverAllowed}}:{})};
}
function buildClaims(profile:ResolvedAssuranceProfile,results:readonly ControlResult[],verdict:AssuranceDecision['verdict']):AssuranceDecision['claims']{
  const byId=new Map(results.map((result)=>[result.controlId,result]));
  const controlClaims=profile.controls.map((control)=>{const result=byId.get(control.id);const status=result?.status==='pass'?'supported':result?.status==='conditional'?'conditional':result?.status==='indeterminate'?'indeterminate':'unsupported';return{claimId:control.claim,claimVersion:'1.0.0',status,controlRefs:[control.id]} as const;});
  const aggregate=profile.profile.outputClaims.map((claim)=>({claimId:claim.id,claimVersion:claim.version,status:verdict==='pass'?'supported':verdict==='conditional'?'conditional':verdict==='indeterminate'?'indeterminate':'unsupported',controlRefs:results.map((result)=>result.controlId).sort()} as const));
  return Object.freeze([...controlClaims,...aggregate].sort((a,b)=>a.claimId.localeCompare(b.claimId)));
}
function dimensions(results:readonly ControlResult[],controls:readonly ControlDefinition[],evidence:readonly AcceptedEvidence[]):NonNullable<AssuranceDecision['dimensions']>{
  const applicable=results.filter((result)=>result.status!=='not-applicable'); const passed=applicable.filter((result)=>result.status==='pass').length; const conditional=applicable.filter((result)=>result.status==='conditional').length;
  const requiredChecks=new Set(controls.flatMap((control)=>control.evidenceRequirements.map((requirement)=>requirement.check))); const presentChecks=new Set(evidence.map((item)=>item.observation.check.id)); const completeness=requiredChecks.size===0?1:[...requiredChecks].filter((id)=>presentChecks.has(id)).length/requiredChecks.size;
  return Object.freeze({controlSatisfaction:round4(applicable.length===0?1:(passed+conditional*0.5)/applicable.length),evidenceCompleteness:round4(completeness),evidenceFreshness:evidence.length?1:0,producerTrust:evidence.length?1:0});
}
function createUnknown(control:ControlDefinition,category:Unknown['category'],description:string):Unknown{return{unknownId:`unknown_${slug(control.id)}`,category,description,impact:control.severity==='mandatory'?'decision':'advisory',relatedControls:[control.id],resolvableBy:[`provide admissible evidence for ${control.id}`]};}
function dedupeUnknowns(values:readonly Unknown[]):Unknown[]{const map=new Map<string,Unknown>();for(const value of values)map.set(value.unknownId,value);return[...map.values()].sort((a,b)=>a.unknownId.localeCompare(b.unknownId));}
function uniqueWaivers(values:readonly Waiver[]):Waiver[]{const map=new Map(values.map((value)=>[value.waiverId,value]));return[...map.values()].sort((a,b)=>a.waiverId.localeCompare(b.waiverId));}
function slug(value:string):string{return value.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function round4(value:number):number{return Math.round(value*10_000)/10_000;}
function assertContext(context:EvaluationContext):void{if(!context.decisionId.trim())throw new Error('decisionId is required');if(!Number.isFinite(Date.parse(context.evaluationTime)))throw new Error('evaluationTime must be RFC3339');}
function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value as Readonly<Record<string,unknown>>))deepFreeze(item);}return value;}
