import { JWK, JWKECKey, JWKRSAKey, JWKOKPKey } from "jose";
import { DIDDocument, ecKeyToDidDoc } from "@app/lib-did-siop/dtos/DIDDocument";
import { DID_SIOP_ERRORS } from "@app/lib-did-siop/error";
import { getKeyIdFromKey, getDIDFromKey } from "@app/lib-did-siop/util/Util";

export interface TEST_KEY {
  key: JWK.Key;
  did: string;
  didDoc: DIDDocument;
}

export enum SIOP_KEY_TYPE {
  EC = 'EC',
  RSA = 'RSA',
  OKP = 'OKP'
}

enum SIOP_KEY_CURVE {
  SECP256k1 = 'secp256k1',
  ED25519 = 'ed25519'
}

export function generateTestKey(kty: string): TEST_KEY {
  let initKey: JWK.Key;
  let key: JWK.Key;

  switch(kty) {
    case (SIOP_KEY_TYPE.RSA):
      initKey = JWK.generateSync(SIOP_KEY_TYPE.RSA, 2048, { use: 'sig' })
      key = JWK.asKey(<JWKRSAKey>{
        e: initKey.e,
        n: initKey.n,
        d: initKey.d,
        kty: initKey.kty,
        kid: getKeyIdFromKey(initKey)
      });
      break;
    case (SIOP_KEY_TYPE.EC):
      initKey = JWK.generateSync(SIOP_KEY_TYPE.EC, SIOP_KEY_CURVE.SECP256k1, { use: 'sig' });
      key = JWK.asKey(<JWKECKey>{
        crv: initKey.crv,
        x: initKey.x,
        y: initKey.y,
        d: initKey.d,
        kty: initKey.kty,
        kid: getKeyIdFromKey(initKey)
      });
      break;
    case (SIOP_KEY_TYPE.OKP):
      initKey = JWK.generateSync(SIOP_KEY_TYPE.OKP)
      key = JWK.asKey(<JWKOKPKey>{
        crv: initKey.crv,
        x: initKey.x,
        d: initKey.d,
        kty: initKey.kty,
        kid: getKeyIdFromKey(initKey)
      });
      break;
    default: throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED)
  }

  const did = getDIDFromKey(key)
  console.log('DID created: ' + did)
  const didDoc = ecKeyToDidDoc(key)

  return {
    key,
    did,
    didDoc
  }
}