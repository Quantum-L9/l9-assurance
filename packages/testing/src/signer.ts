import { createHash } from 'node:crypto';
export interface TestSignature { readonly keyId:string; readonly algorithm:'TEST_HMAC_SHA256'; readonly value:string; readonly signedAt:string; readonly context:'TEST_ONLY'; }
export class InMemoryTestSigner {
  readonly identity='TEST_ONLY_L9_ASSURANCE_SIGNER';
  constructor(readonly keyId:string,private readonly clock:()=>string=()=>new Date(0).toISOString()){}
  sign(payload:string):TestSignature{const signedAt=this.clock();const value=createHash('sha256').update(`${payload}\u0000${this.keyId}\u0000${signedAt}`).digest('hex');return{keyId:this.keyId,algorithm:'TEST_HMAC_SHA256',value,signedAt,context:'TEST_ONLY'};}
}
