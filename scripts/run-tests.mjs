import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/files.mjs';
const requested=process.argv[2]??'all';
const categories=['architecture','unit','contract','conformance','integration','replay','security','performance'];
const selected=requested==='all'?categories:[requested];
if(!selected.every((x)=>categories.includes(x))){console.error(`Unknown test category ${requested}`);process.exitCode=2;} else {
  let failed=0;
  if(!existsSync(join(ROOT,'packages','contracts','dist','index.js'))){const build=spawnSync('npm',['run','build'],{cwd:ROOT,stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);}
  for(const category of selected){
    const directory=join(ROOT,'tests',category);
    const files=readdirSync(directory).filter((name)=>name.endsWith('.test.mjs')).sort().map((name)=>join('tests',category,name));
    const result=spawnSync(process.execPath,['--test',...files],{cwd:ROOT,stdio:'inherit',shell:false});
    if(result.status!==0) failed+=1;
  }
  if(failed){console.error(`${failed} test categories failed.`);process.exitCode=1;} else console.log(`Passed ${selected.length} test categories.`);
}
