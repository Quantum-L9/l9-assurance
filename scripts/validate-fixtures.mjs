import { join, relative } from 'node:path';
import { ROOT, readJson, walkFiles } from './lib/files.mjs';
import { buildSchemaStore, validateInstance } from './lib/schema-validator.mjs';
const schemaPaths=walkFiles(join(ROOT,'schemas','v1'),(p)=>p.endsWith('.schema.json'));
const store=buildSchemaStore(schemaPaths);
const observationSchemaPath=join(ROOT,'schemas','v1','observation.schema.json');
const observationSchema=readJson(observationSchemaPath);
const valid=walkFiles(join(ROOT,'fixtures','valid'),(p)=>p.endsWith('.observation.json'));
const invalid=walkFiles(join(ROOT,'fixtures','invalid'),(p)=>p.endsWith('.observation.json'));
const errors=[];
for(const path of valid){const value=readJson(path);const result=[...validateInstance(value,observationSchema,{store,schemaPath:observationSchemaPath}),...semanticErrors(value)];if(result.length)errors.push(`${relative(ROOT,path)} expected valid: ${JSON.stringify(result)}`);}
for(const path of invalid){const value=readJson(path);const result=[...validateInstance(value,observationSchema,{store,schemaPath:observationSchemaPath}),...semanticErrors(value)];if(!result.length)errors.push(`${relative(ROOT,path)} expected invalid`);}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;} else console.log(`Validated ${valid.length} valid and ${invalid.length} invalid observation fixtures.`);

function semanticErrors(value){const errors=[];if(value&&typeof value==='object'&&Array.isArray(value.findings)&&value.summary&&typeof value.summary==='object'){const count=value.findings.length;const declared=value.summary.findingCount;const classified=Number(value.summary.errorCount)+Number(value.summary.warningCount)+Number(value.summary.informationalCount);if(declared!==count)errors.push({path:'$.summary.findingCount',message:'does not match findings length'});if(classified!==declared)errors.push({path:'$.summary',message:'category counts do not sum to findingCount'});}return errors;}
