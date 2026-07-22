import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/files.mjs';
const result=spawnSync(process.execPath,['--test','tests/replay/*.test.mjs'],{cwd:ROOT,stdio:'inherit'});
process.exitCode=result.status??1;
