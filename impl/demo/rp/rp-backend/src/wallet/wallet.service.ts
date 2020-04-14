import { Injectable } from '@nestjs/common';
import { JWK, JWKRSAKey, JWKECKey, JWKOKPKey } from 'jose';
import { 
  DIDDocument, 
  SIOP_KEY_TYPE, 
  getKeyIdFromKey, 
  SIOP_KEY_CURVE, 
  DID_SIOP_ERRORS, 
  getDIDFromKey, 
  ecKeyToDidDoc } from '@lib/did-siop';

export interface WALLET {
  key: JWK.Key;
  did: string;
  didDoc: DIDDocument;
}

@Injectable()
export class WalletService {

  private static _instance: WalletService;
  private _wallet: WALLET;
  
  private constructor() {
    // create a new wallet from EC default key type
    // TODO: add different key types via parameter
    this._wallet = this._generateWallet(SIOP_KEY_TYPE.EC)
  }

  public static get Instance(): WalletService {
    return this._instance || (this._instance = new this())
  }

  public get wallet(): WALLET {
    return this._wallet;
  }

  private _generateWallet(kty: string): WALLET {
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
}
