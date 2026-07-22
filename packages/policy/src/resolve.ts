import type { AssurancePolicy, ResolvedAssurancePolicy, Waiver } from '@l9/assurance-contracts';

export class PolicyResolutionError extends Error { constructor(message:string){super(message);this.name='PolicyResolutionError';} }
export interface PolicyOverlay { readonly id:string; readonly precedence:number; readonly policy:Partial<AssurancePolicy>; }

export function resolvePolicy(base:AssurancePolicy,overlays:readonly PolicyOverlay[]=[],waivers:readonly Waiver[]=[]):ResolvedAssurancePolicy{
  const sorted=[...overlays].sort((a,b)=>a.precedence-b.precedence||a.id.localeCompare(b.id));
  const samePrecedence=new Map<number,PolicyOverlay[]>(); for(const overlay of sorted)samePrecedence.set(overlay.precedence,[...(samePrecedence.get(overlay.precedence)??[]),overlay]);
  for(const [precedence,group] of samePrecedence)detectConflicts(precedence,group);
  let resolved:AssurancePolicy=structuredClone(base);
  for(const overlay of sorted)resolved=mergePolicy(resolved,overlay.policy);
  if(compareSemVer(resolved.version,resolved.minimumPolicyVersion??'0.0.0')<0)throw new PolicyResolutionError(`Policy rollback: ${resolved.version} below minimum ${resolved.minimumPolicyVersion}`);
  return Object.freeze({policy:deepFreeze(resolved),waivers:Object.freeze([...waivers].sort((a,b)=>a.waiverId.localeCompare(b.waiverId)))});
}
function mergePolicy(base:AssurancePolicy,overlay:Partial<AssurancePolicy>):AssurancePolicy{
  return {
    ...base,...overlay,
    controlOverrides:overlay.controlOverrides??base.controlOverrides,
    mandatoryFindingSeverities:overlay.mandatoryFindingSeverities??base.mandatoryFindingSeverities,
    unknownHandling:overlay.unknownHandling??base.unknownHandling,
    waiverAuthorization:overlay.waiverAuthorization??base.waiverAuthorization,
    hardProhibitions:overlay.hardProhibitions??base.hardProhibitions,
    extensions:{...(base.extensions??{}),...(overlay.extensions??{})}
  };
}
function detectConflicts(precedence:number,group:readonly PolicyOverlay[]):void{
  const seen=new Map<string,string>();
  for(const overlay of group){for(const [key,value] of Object.entries(overlay.policy)){const serialized=JSON.stringify(value);const previous=seen.get(key);if(previous!==undefined&&previous!==serialized)throw new PolicyResolutionError(`Conflicting overlays at precedence ${precedence} for ${key}`);seen.set(key,serialized);}}
}
function deepFreeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value as Readonly<Record<string,unknown>>))deepFreeze(item);}return value;}

function compareSemVer(leftValue:string,rightValue:string):number{
  const left=parseVersion(leftValue),right=parseVersion(rightValue);if(!left||!right)throw new PolicyResolutionError(`Invalid semantic version: ${!left?leftValue:rightValue}`);
  const major=left[0]-right[0];if(major)return major;const minor=left[1]-right[1];if(minor)return minor;const patch=left[2]-right[2];if(patch)return patch;return comparePrerelease(left[3],right[3]);
}
function parseVersion(value:string):[number,number,number,string|undefined]|null{const match=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);return match?[Number(match[1]),Number(match[2]),Number(match[3]),match[4]]:null;}
function comparePrerelease(left:string|undefined,right:string|undefined):number{if(left===right)return 0;if(left===undefined)return 1;if(right===undefined)return-1;const a=left.split('.'),b=right.split('.');for(let index=0;index<Math.max(a.length,b.length);index+=1){const x=a[index],y=b[index];if(x===undefined)return-1;if(y===undefined)return 1;if(x===y)continue;const xn=/^\d+$/.test(x),yn=/^\d+$/.test(y);if(xn&&yn)return Number(x)-Number(y);if(xn)return-1;if(yn)return 1;return x<y?-1:1;}return 0;}
