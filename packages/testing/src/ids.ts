export function createDeterministicIdFactory(prefix='id'):()=>string{let counter=0;return()=>`${prefix}_${String(counter++).padStart(6,'0')}`;}
