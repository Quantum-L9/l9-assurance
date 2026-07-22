import type { Digest, Observation, SubjectReference } from '@l9/assurance-contracts';
const ZERO_DIGEST:Digest={algorithm:'sha256',value:'0'.repeat(64)};
const DEFAULT_COMMIT='a'.repeat(40);
export function buildSubject(overrides:Partial<SubjectReference>={}):SubjectReference{
  const base:SubjectReference={kind:'git-revision',repository:{host:'github.com',owner:'Quantum-L9',name:'example'},revision:{commit:DEFAULT_COMMIT}};
  return{...base,...overrides,repository:{...base.repository,...overrides.repository},revision:{...base.revision,...overrides.revision}};
}
export interface ObservationOverrides { readonly observationId?:string; readonly checkId?:string; readonly checkVersion?:string; readonly status?:Observation['execution']['status']; readonly subject?:SubjectReference; readonly findings?:Observation['findings']; readonly producerVersion?:string; readonly startedAt?:string; readonly completedAt?:string; }
export function buildObservation(overrides:ObservationOverrides={}):Observation{
  const findings=overrides.findings??[]; const counts=countFindings(findings);
  return{
    schema:'l9.observation',schemaVersion:'1.0.0',observationId:overrides.observationId??`obs_${(overrides.checkId??'l9.tests').replaceAll('.','_')}`,
    producer:{id:'l9-ci-sdk',version:overrides.producerVersion??'2.0.0',repository:'Quantum-L9/l9-ci-sdk'},subject:overrides.subject??buildSubject(),
    check:{id:overrides.checkId??'l9.tests',version:overrides.checkVersion??'1.0.0',configurationDigest:ZERO_DIGEST},
    execution:{runId:'run_fixture',attempt:1,status:overrides.status??'passed',startedAt:overrides.startedAt??'2026-07-21T00:00:00.000Z',completedAt:overrides.completedAt??'2026-07-21T00:00:01.000Z'},
    summary:{findingCount:findings.length,errorCount:counts.error,warningCount:counts.warning,informationalCount:counts.informational},findings,artifacts:[]
  };
}
function countFindings(findings:Observation['findings']):{error:number;warning:number;informational:number}{let error=0,warning=0,informational=0;for(const finding of findings){if(finding.severity==='critical'||finding.severity==='high')error+=1;else if(finding.severity==='informational')informational+=1;else warning+=1;}return{error,warning,informational};}
