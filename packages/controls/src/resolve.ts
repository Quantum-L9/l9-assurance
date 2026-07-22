import type { AssuranceProfile, ControlDefinition, ResolvedAssuranceProfile } from '@l9/assurance-contracts';

export class ControlResolutionError extends Error {
  constructor(message: string) { super(message); this.name='ControlResolutionError'; }
}

export function resolveProfile(profile: AssuranceProfile, definitions: readonly ControlDefinition[]): ResolvedAssuranceProfile {
  const byKey=new Map(definitions.map((control)=>[key(control.id,control.version),control]));
  const selected=profile.controls.map((reference)=>{
    const control=byKey.get(key(reference.id,reference.version));
    if(!control)throw new ControlResolutionError(`Missing control ${reference.id}@${reference.version}`);
    return control;
  });
  const ordered=orderControls(selected);
  return Object.freeze({profile,controls:Object.freeze(ordered)});
}

export function orderControls(controls: readonly ControlDefinition[]): readonly ControlDefinition[] {
  const byId=new Map<string,ControlDefinition>();
  for(const control of controls){if(byId.has(control.id))throw new ControlResolutionError(`Duplicate control ${control.id}`);byId.set(control.id,control);}
  const visiting=new Set<string>(); const visited=new Set<string>(); const output:ControlDefinition[]=[];
  function visit(control:ControlDefinition):void{
    if(visited.has(control.id))return;
    if(visiting.has(control.id))throw new ControlResolutionError(`Control dependency cycle at ${control.id}`);
    visiting.add(control.id);
    for(const dependency of [...(control.dependencies??[])].sort((a,b)=>a.id.localeCompare(b.id))){
      const target=byId.get(dependency.id); if(!target)throw new ControlResolutionError(`Control ${control.id} depends on missing ${dependency.id}`);
      if(target.version!==dependency.version)throw new ControlResolutionError(`Control ${control.id} dependency version mismatch for ${dependency.id}`);
      visit(target);
    }
    visiting.delete(control.id); visited.add(control.id); output.push(control);
  }
  for(const control of [...controls].sort((a,b)=>a.id.localeCompare(b.id)))visit(control);
  return Object.freeze(output);
}
function key(id:string,version:string):string{return`${id}@${version}`;}
