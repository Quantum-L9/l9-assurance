import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
export function readJsonFile<T>(path:string):T{return JSON.parse(readFileSync(path,'utf8')) as T;}
export function readDataFile<T>(path:string):T{return readJsonFile<T>(path);}
export function writeTextFile(path:string,content:string):void{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content.endsWith('\n')?content:`${content}\n`,'utf8');}
export function writeJsonFile(path:string,value:unknown):void{writeTextFile(path,`${JSON.stringify(value,null,2)}\n`);}
export function resolveRoot(path?:string):string{return resolve(path??process.cwd());}
export function rootPath(root:string,...parts:string[]):string{return join(root,...parts);}
