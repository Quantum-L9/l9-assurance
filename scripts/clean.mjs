import { join } from 'node:path';
import { ROOT, remove } from './lib/files.mjs';
for (const name of ['contracts','evidence','controls','policy','evaluator','conformance','cli','testing']) remove(join(ROOT,'packages',name,'dist'));
remove(join(ROOT,'.tmp'));
console.log('Removed generated build directories.');
