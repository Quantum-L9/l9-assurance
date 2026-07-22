import { join, relative } from 'node:path';
import { ROOT, readJson, readText, walkFiles } from './lib/files.mjs';
const expected=['contracts','evidence','controls','policy','evaluator','conformance','cli','testing'];
const allowed={contracts:[],evidence:['contracts'],controls:['contracts'],policy:['contracts'],evaluator:['contracts','evidence','controls','policy'],conformance:['contracts','evidence','evaluator'],cli:['contracts','evidence','controls','policy','evaluator'],testing:['contracts']};
const packageName=Object.fromEntries(expected.map((name)=>[name,readJson(join(ROOT,'packages',name,'package.json')).name]));
const keyByName=Object.fromEntries(Object.entries(packageName).map(([k,v])=>[v,k]));
const errors=[];
const actual=(await import('node:fs')).readdirSync(join(ROOT,'packages')).sort();
if (JSON.stringify(actual)!==JSON.stringify(expected.slice().sort())) errors.push(`workspace set mismatch: ${actual.join(', ')}`);
for (const key of expected) {
  const pkg=readJson(join(ROOT,'packages',key,'package.json')); const deps=Object.keys(pkg.dependencies??{}).filter((x)=>x.startsWith('@l9/assurance-')).map((x)=>keyByName[x]).sort();
  if (JSON.stringify(deps)!==JSON.stringify(allowed[key].slice().sort())) errors.push(`${key}: dependencies ${deps} != ${allowed[key]}`);
  if (key!=='testing' && (pkg.dependencies??{})[packageName.testing]) errors.push(`${key}: production depends on testing`);
}
const sourceFiles=walkFiles(join(ROOT,'packages'),(path)=>path.endsWith('.ts'));
const forbidden=[/@octokit\//, /from ['"]github/, /node:child_process/, /execFile\(/, /spawn\(/, /legacy\//, /@l9\/(?:adversarial|testkit|ci-orchestrator|testing-platform|assurance-platform)/];
for (const path of sourceFiles) { const text=readText(path); for (const pattern of forbidden) if (pattern.test(text)) errors.push(`${relative(ROOT,path)}: forbidden source pattern ${pattern}`); }
const evaluatorFiles=walkFiles(join(ROOT,'packages','evaluator','src'),(path)=>path.endsWith('.ts'));
for (const path of evaluatorFiles) { const text=readText(path); for (const pattern of [/node:fs/,/node:path/,/node:http/,/node:https/,/process\./,/new Date\(/,/Date\.now\(/,/Math\.random\(/]) if(pattern.test(text)) errors.push(`${relative(ROOT,path)}: evaluator impurity ${pattern}`); }
const productionKeys=expected.filter((x)=>x!=='testing');
for (const key of productionKeys) { for (const path of walkFiles(join(ROOT,'packages',key,'src'),(p)=>p.endsWith('.ts'))) if (/InMemoryTestSigner|@l9\/assurance-testing/.test(readText(path))) errors.push(`${relative(ROOT,path)}: test signer is production reachable`); }
if (errors.length){console.error(errors.join('\n'));process.exitCode=1;} else console.log(`Validated ${expected.length} workspace boundaries and evaluator purity.`);
