import type { AssurancePolicy, ControlDefinition, SubjectReference, Waiver } from '@l9/assurance-contracts';
export interface WaiverDecision { readonly valid:boolean; readonly reason:'active'|'expired'|'not-yet-active'|'subject-mismatch'|'control-disallows'|'role-unauthorized'|'duration-exceeded'|'signature-required'; }
export function evaluateWaiver(waiver:Waiver,control:ControlDefinition,subject:SubjectReference,policy:AssurancePolicy,evaluationTime:string):WaiverDecision{
  if(!control.waiver?.allowed)return{valid:false,reason:'control-disallows'};
  if(waiver.controlId!==control.id||!scopeMatches(waiver,subject))return{valid:false,reason:'subject-mismatch'};
  const now=Date.parse(evaluationTime),issued=Date.parse(waiver.issuedAt),expires=Date.parse(waiver.expiresAt);
  if(!Number.isFinite(now)||!Number.isFinite(issued)||!Number.isFinite(expires))return{valid:false,reason:'expired'};
  if(now<issued)return{valid:false,reason:'not-yet-active'}; if(now>=expires)return{valid:false,reason:'expired'};
  if(control.waiver.maximumDurationSeconds!==undefined&&(expires-issued)/1000>control.waiver.maximumDurationSeconds)return{valid:false,reason:'duration-exceeded'};
  const accepted=new Set(policy.waiverAuthorization.acceptedRoles); const required=new Set(control.waiver.requiredRoles??[]); const roles=new Set(waiver.authorizedBy.roles);
  const policyAuthorized=[...roles].some((role)=>accepted.has(role)); const controlAuthorized=required.size===0||[...roles].some((role)=>required.has(role));
  if(!policyAuthorized||!controlAuthorized)return{valid:false,reason:'role-unauthorized'};
  if(policy.waiverAuthorization.requireSignature&&!waiver.signature)return{valid:false,reason:'signature-required'};
  return{valid:true,reason:'active'};
}
export function findActiveWaiver(waivers:readonly Waiver[],control:ControlDefinition,subject:SubjectReference,policy:AssurancePolicy,evaluationTime:string):Waiver|undefined{return[...waivers].sort((a,b)=>a.waiverId.localeCompare(b.waiverId)).find((waiver)=>evaluateWaiver(waiver,control,subject,policy,evaluationTime).valid);}
function scopeMatches(waiver:Waiver,subject:SubjectReference):boolean{const scope=waiver.subjectScope;return scope.repository.host.toLowerCase()===subject.repository.host.toLowerCase()&&scope.repository.owner===subject.repository.owner&&scope.repository.name.replace(/\.git$/i,'')===subject.repository.name.replace(/\.git$/i,'')&&(scope.commit==='*'||scope.commit.toLowerCase()===subject.revision.commit.toLowerCase());}
