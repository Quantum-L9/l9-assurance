export interface FakeClock { readonly now:()=>string; advance(milliseconds:number):void; reset():void; }
export function createFakeClock(initialIso:string):FakeClock{
  const initial=Date.parse(initialIso); if(!Number.isFinite(initial))throw new Error('initialIso must be RFC3339'); let current=initial;
  return{now:()=>new Date(current).toISOString(),advance:(milliseconds:number)=>{if(!Number.isFinite(milliseconds))throw new Error('milliseconds must be finite');current+=milliseconds;},reset:()=>{current=initial;}};
}
