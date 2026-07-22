import { join } from 'node:path';
import { ROOT, readData, readJson } from './lib/files.mjs';
const errors=[];
const producerRegistry=readData(join(ROOT,'registry','producers.yaml'));
const checkRegistry=readData(join(ROOT,'registry','checks.yaml'));
const claimRegistry=readData(join(ROOT,'registry','claims.yaml'));
const controlRegistry=readData(join(ROOT,'registry','controls.yaml'));
const profileRegistry=readData(join(ROOT,'registry','profiles.yaml'));
function unique(items, key, label){ const seen=new Set(); for (const item of items) { const value=item[key]; if (!value || seen.has(value)) errors.push(`${label}: missing or duplicate ${key} ${value}`); seen.add(value); } }
unique(producerRegistry.producers,'id','producers'); unique(checkRegistry.checks,'id','checks'); unique(claimRegistry.claims,'id','claims'); unique(controlRegistry.controls,'id','controls'); unique(profileRegistry.profiles,'id','profiles');
const checkIds=new Set(checkRegistry.checks.map((x)=>x.id));
for (const producer of producerRegistry.producers) {
  if (producer.authorization_status === 'pending' && producer.allowed_versions !== null) errors.push(`${producer.id}: pending producer must not have active allowed_versions`);
  for (const id of producer.checks) if (!checkIds.has(id)) errors.push(`${producer.id}: unknown check ${id}`);
}
const claimIds=new Set(claimRegistry.claims.map((x)=>x.id));
const controlIds=new Set(controlRegistry.controls.map((x)=>x.id));
for (const record of controlRegistry.controls) {
  const control=readData(join(ROOT,record.path));
  if (control.id!==record.id || control.version!==record.version) errors.push(`${record.path}: registry identity mismatch`);
  if (!claimIds.has(control.claim)) errors.push(`${control.id}: unknown claim ${control.claim}`);
  for (const req of control.evidenceRequirements) if (!checkIds.has(req.check)) errors.push(`${control.id}: unknown check ${req.check}`);
}
for (const record of profileRegistry.profiles) {
  const profile=readData(join(ROOT,record.path)); const policy=readData(join(ROOT,record.policy_path));
  if (profile.id!==record.id || profile.version!==record.version) errors.push(`${record.path}: profile identity mismatch`);
  for (const ref of profile.controls) if (!controlIds.has(ref.id)) errors.push(`${profile.id}: unknown control ${ref.id}`);
  if (profile.defaultPolicy.id!==policy.id || profile.defaultPolicy.version!==policy.version) errors.push(`${profile.id}: default policy mismatch`);
}
if (errors.length){console.error(errors.join('\n'));process.exitCode=1;} else console.log(`Validated trust registries: ${producerRegistry.producers.length} producer, ${checkRegistry.checks.length} checks, ${controlRegistry.controls.length} controls, ${profileRegistry.profiles.length} profile.`);
