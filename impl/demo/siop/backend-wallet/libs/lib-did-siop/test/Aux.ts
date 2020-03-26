import { JWK, JWKECKey, JWKRSAKey, JWKOKPKey } from "jose";
import { DIDDocument, ecKeyToDidDoc } from "@lib/did-siop";
import { DID_SIOP_ERRORS } from "@lib/did-siop";
import { getKeyIdFromKey, getDIDFromKey } from "@lib/did-siop";
import { SIOP_KEY_TYPE, SIOP_KEY_CURVE } from "@lib/did-siop";

export const SIOP_HEADER = {
  "alg": "ES256K",
  "typ": "JWT",
  "kid": "did:example:0xab#veri-key1"
}

export const SIOP_REQUEST_PAYLOAD = {
  "iss": "did:example:0xab",
  "response_type": "id_token",
  "client_id": "http://localhost:9003/siop/responses",
  "scope": "openid did_authn",
  "state": "af0ifjsldkj",
  "nonce": "n-0S6_WzA2Mj",
  "response_mode" : "form_post",
  "registration" : {
      "jwks_uri" : "https://uniresolver.io/1.0/identifiers/did:example:0xab;transform-keys=jwks",
      "id_token_signed_response_alg" : [ "ES256K", "EdDSA", "RS256" ]
  }
}

export const SIOP_RESPONSE_PAYLOAD ={
    "iss": "https://self-issued.me",
    "nonce": "n-0S6_WzA2Mj",
    "exp": 1311281970,
    "iat": 1311280970,
    "sub_jwk" : {
       "crv":"secp256k1",
       "kid":"did:example:0xcd#verikey-1",
       "kty":"EC",
       "x":"7KEKZa5xJPh7WVqHJyUpb2MgEe3nA8Rk7eUlXsmBl-M",
       "y":"3zIgl_ml4RhapyEm5J7lvU-4f5jiBvZr4KgxUjEhl9o"
    },
    "sub": "9-aYUQ7mgL2SWQ_LNTeVN2rtw7xFP-3Y2EO9WV22cF0",
    "did": "did:example:0xcd"
}

export interface TEST_KEY {
  key: JWK.Key;
  did: string;
  didDoc: DIDDocument;
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