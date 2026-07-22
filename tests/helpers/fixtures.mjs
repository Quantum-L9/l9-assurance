import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssuranceEngine } from '@l9/assurance-cli';
const HERE=dirname(fileURLToPath(import.meta.url));
export const ROOT=resolve(HERE,'../..');
export const FIXED_TIME='2026-07-21T00:00:02.000Z';
export function json(path){return JSON.parse(readFileSync(path,'utf8'));}
export function rootJson(...parts){return json(join(ROOT,...parts));}
export function controls(){return readdirSync(join(ROOT,'controls','ci')).filter((name)=>name.endsWith('.yaml')).sort().map((name)=>rootJson('controls','ci',name));}
export function trustedConfiguration(){return{producerRegistry:rootJson('fixtures','compatibility','producer-registry.trusted.json'),checkRegistry:rootJson('fixtures','compatibility','check-registry.json'),profile:rootJson('fixtures','compatibility','profile.json'),policy:rootJson('fixtures','compatibility','policy.json'),controls:controls(),clock:()=>FIXED_TIME,evaluator:{id:'l9-assurance',version:'2.0.1',repository:'Quantum-L9/l9-assurance'}};}
export function engine(){return new AssuranceEngine(trustedConfiguration());}
export function subject(){return rootJson('fixtures','valid','subject.json');}
export function validObservations(){return readdirSync(join(ROOT,'fixtures','valid')).filter((name)=>name.endsWith('.observation.json')).sort().map((name)=>rootJson('fixtures','valid',name));}
export async function admitted(observations=validObservations()){const report=await engine().admit({subject:subject(),observations,receivedAt:FIXED_TIME});return report;}
export async function passDecision(){const e=engine();const report=await e.admit({subject:subject(),observations:validObservations(),receivedAt:FIXED_TIME});return e.evaluate({subject:subject(),acceptedEvidence:report.accepted,evaluationTime:FIXED_TIME,decisionId:'dec_fixture_pass',admissionReport:report});}
