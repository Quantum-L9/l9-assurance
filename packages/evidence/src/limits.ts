export interface AdmissionLimits {
  readonly maximumSingleObservationBytes: number;
  readonly maximumObservationCount: number;
  readonly maximumFindingsPerObservation: number;
  readonly maximumLineageDepth: number;
  readonly maximumJsonDepth: number;
  readonly maximumStringBytes: number;
  readonly maximumExtensionNamespaces: number;
}
export const DEFAULT_ADMISSION_LIMITS: AdmissionLimits = Object.freeze({
  maximumSingleObservationBytes: 1_048_576,
  maximumObservationCount: 1_000,
  maximumFindingsPerObservation: 10_000,
  maximumLineageDepth: 32,
  maximumJsonDepth: 64,
  maximumStringBytes: 1_048_576,
  maximumExtensionNamespaces: 64
});
export function measureJson(value: unknown): { readonly depth: number; readonly maximumStringBytes: number } {
  const seen=new Set<object>(); let maxDepth=0; let maxString=0;
  function visit(node: unknown, depth: number): void {
    if(depth>maxDepth)maxDepth=depth;
    if(typeof node==='string'){const bytes=new TextEncoder().encode(node).byteLength;if(bytes>maxString)maxString=bytes;return;}
    if(!node||typeof node!=='object')return; if(seen.has(node))throw new Error('Cyclic JSON value'); seen.add(node);
    if(Array.isArray(node))for(const item of node)visit(item,depth+1); else for(const [key,item] of Object.entries(node)){visit(key,depth+1);visit(item,depth+1);} seen.delete(node);
  }
  visit(value,1); return {depth:maxDepth,maximumStringBytes:maxString};
}
