import type {
  AcceptedEvidence, AdmissionReport, AssuranceDecision, AssurancePlan, AssurancePolicy, AssuranceProfile, CheckRegistry,
  ControlDefinition, EvaluationContext, ProducerIdentity, ProducerRegistry, ResolvedAssurancePolicy, ResolvedAssuranceProfile,
  SubjectReference, VerificationReport, Waiver
} from '@l9/assurance-contracts';
import { admitObservations, InMemoryReplayStore, sha256Digest, type AdmissionContext, type ReplayStore } from '@l9/assurance-evidence';
import { resolveProfile } from '@l9/assurance-controls';
import { resolvePolicy, type PolicyOverlay } from '@l9/assurance-policy';
import { evaluate, verifyDecision } from '@l9/assurance-evaluator';

export interface EngineConfiguration {
  readonly producerRegistry:ProducerRegistry; readonly checkRegistry:CheckRegistry; readonly profile:AssuranceProfile; readonly policy:AssurancePolicy;
  readonly controls:readonly ControlDefinition[]; readonly clock?:()=>string; readonly replayStore?:ReplayStore; readonly evaluator?:ProducerIdentity;
}
export interface PlanRequest { readonly subject:SubjectReference; }
export interface AdmissionRequest { readonly subject:SubjectReference; readonly observations:readonly unknown[]; readonly receivedAt?:string; readonly channel?:AdmissionContext['channel']; }
export interface EvaluationRequest { readonly subject:SubjectReference; readonly acceptedEvidence:readonly AcceptedEvidence[]; readonly evaluationTime?:string; readonly decisionId?:string; readonly waivers?:readonly Waiver[]; readonly overlays?:readonly PolicyOverlay[]; readonly admissionReport?:AdmissionReport; readonly previousDecisionId?:string; }
export interface VerificationRequest { readonly decision:unknown; }

export class AssuranceEngine {
  readonly #configuration:EngineConfiguration; readonly #profile:ResolvedAssuranceProfile; readonly #clock:()=>string; readonly #replayStore:ReplayStore;
  constructor(configuration:EngineConfiguration){this.#configuration=configuration;this.#profile=resolveProfile(configuration.profile,configuration.controls);this.#clock=configuration.clock??(()=>new Date().toISOString());this.#replayStore=configuration.replayStore??new InMemoryReplayStore();}
  async plan(request:PlanRequest):Promise<AssurancePlan>{const producers=new Set<string>();const checks=new Set<string>();for(const control of this.#profile.controls)for(const requirement of control.evidenceRequirements){producers.add(requirement.producer);checks.add(requirement.check);}return{subject:request.subject,profile:{id:this.#profile.profile.id,version:this.#profile.profile.version},controls:this.#profile.controls.map((control)=>({id:control.id,version:control.version,severity:control.severity})),requiredProducers:[...producers].sort(),requiredChecks:[...checks].sort(),waiverRules:this.#profile.controls.map((control)=>({controlId:control.id,allowed:control.waiver?.allowed??false})).sort((a,b)=>a.controlId.localeCompare(b.controlId))};}
  async admit(request:AdmissionRequest):Promise<AdmissionReport>{return admitObservations(request.observations,{subject:request.subject,producerRegistry:this.#configuration.producerRegistry,checkRegistry:this.#configuration.checkRegistry,receivedAt:request.receivedAt??this.#clock(),channel:request.channel??'local',replayStore:this.#replayStore});}
  async evaluate(request:EvaluationRequest):Promise<AssuranceDecision>{const evaluationTime=request.evaluationTime??this.#clock();const resolvedPolicy:ResolvedAssurancePolicy=resolvePolicy(this.#configuration.policy,request.overlays??[],request.waivers??[]);const decisionId=request.decisionId??deriveDecisionId(request.subject,this.#profile,resolvedPolicy,request.acceptedEvidence,evaluationTime);const context:EvaluationContext={evaluationTime,decisionId,evaluator:this.#configuration.evaluator??{id:'l9-assurance',version:'2.0.0',repository:'Quantum-L9/l9-assurance'},...(request.previousDecisionId?{previousDecisionId:request.previousDecisionId}:{}),...(request.admissionReport?.unknowns.length?{admissionUnknowns:request.admissionReport.unknowns}:{})};return evaluate(request.subject,this.#profile,resolvedPolicy,request.acceptedEvidence,context);}
  async verify(request:VerificationRequest):Promise<VerificationReport>{return verifyDecision(request.decision);}
}
function deriveDecisionId(subject:SubjectReference,profile:ResolvedAssuranceProfile,policy:ResolvedAssurancePolicy,evidence:readonly AcceptedEvidence[],evaluationTime:string):string{return`dec_${sha256Digest({subject,profile:profile.profile,policy:policy.policy,evidence:evidence.map((item)=>item.envelope.evidenceId).sort(),evaluationTime}).value.slice(0,40)}`;}
