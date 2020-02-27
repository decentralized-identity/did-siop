import { Injectable } from '@nestjs/common';
import { SIOP_KEY_ALGO } from './dtos/DID';
import { JWT, JWK } from 'jose';
import { getRandomString } from './util/Util'
import { SIOPRequest, SIOPResponseType, SIOPScope, SIOPRequestCall, SIOPIndirectRegistration, SIOPDirectRegistration } from './dtos/siop';
import { DIDDocument } from './dtos/DIDDocument'
import { DID_SIOP_ERRORS } from './error'

export interface DID_SIOP {

  createSIOPRequest(siopRequest:SIOPRequestCall): string

}

@Injectable()
export class LibDidSiopService implements DID_SIOP {
  createSIOPRequest(input: SIOPRequestCall): string {

    const siopRequest:SIOPRequest = this._createPayloadRequest(input)
    const payload = Buffer.from(JSON.stringify(siopRequest))

    return this._signSIOPRequest (
      this._getAlgKeyType(input.alg, input.key), 
      input.key, 
      payload, 
      siopRequest.kid )
  }

  validateSIOPRequest(): boolean {
    return true;
  }

  createSIOPResponse(): string {
    return 'first siop response';
  }

  validateSIOPResponse(): boolean {
    return true;
  }

  private _createPayloadRequest(input: SIOPRequestCall): SIOPRequest {

    return {
      iss: input.iss,
      kid: input.kid ? input.kid : this._getKidFromDidDoc(input.did_doc),
      response_type: SIOPResponseType.ID_TOKEN,
      client_id: input.client_id,
      scope: SIOPScope.OPENID_DIDAUTHN,
      state: getRandomString(),
      nonce: getRandomString(),
      registration: this._getRegistration(input),
      response_mode: input.response_mode,
      did_doc: input.did_doc
    }
  }
  
  private _signSIOPRequest(alg: SIOP_KEY_ALGO, key: JWK.Key, payload: Buffer, kid: string): string {
    const jws = JWT.sign(
      JSON.parse(payload.toString()),
      key,
      {
        header: {
          alg,
          typ: 'JWT',
          kid,
        }
      }
    )

    return jws;
  }

  private _getAlgKeyType(supportedAlg: string[], key: JWK.Key): SIOP_KEY_ALGO {
    // finds if the key type is included in the algorithms supported
    switch (key.kty) {
      case 'RSA':
        if (!supportedAlg.includes(SIOP_KEY_ALGO.RS256)) throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED);
        return SIOP_KEY_ALGO.RS256;
      case 'EC':
        switch (key.crv) {
          case 'secp256k1':
            if (!supportedAlg.includes(SIOP_KEY_ALGO.ES256K)) throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED);
            return SIOP_KEY_ALGO.ES256K;
          default:
            throw new Error(DID_SIOP_ERRORS.NO_KEY_CURVE_SUPPORTED);
        }
      case 'OKP':
        switch (key.crv) {
          case 'Ed25519':
            if (!supportedAlg.includes(SIOP_KEY_ALGO.EdDSA)) throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED);
            return SIOP_KEY_ALGO.EdDSA;
          default:
            throw new Error(DID_SIOP_ERRORS.NO_KEY_CURVE_SUPPORTED);
        }
      default:
        throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED);
    }
  }

  private _getKidFromDidDoc(didDoc: DIDDocument): string {
    if (!didDoc?.publicKey[0]?.id) throw new Error(DID_SIOP_ERRORS.NO_DIDDOCUMENT_KID);
    return didDoc.publicKey[0].id;
  }

  private _getRegistration(input: SIOPRequestCall): (SIOPIndirectRegistration | SIOPDirectRegistration) {
    // The jwks request parameter SHOULD be used only if the public key cannot be directly obtained from the DID Document.
    if (!this._retrievablePubKeyFromDidDoc(input.iss, input.did_doc)) {
      if (!input.kid) throw new Error(DID_SIOP_ERRORS.NO_KID_PROVIDED)
      return <SIOPDirectRegistration> {
        jwks: input.kid
      }
    }
    // jwks_uri MUST use the HTTP(S) DID Resolution Binding as per [DID.Resolution] 
    // for backward compatibility reasons with plain SIOP OPs
    return <SIOPIndirectRegistration> {
      jwks_uri: 'https://uniresolver.io/1.0/identifiers/' + input.iss + ';transform-keys=jwks',
      id_token_signed_response_alg: input.alg
    }
  }

  private _retrievablePubKeyFromDidDoc(issuer: string, didDoc: DIDDocument): boolean {
    if (!didDoc) return false;
    if (!didDoc.publicKey) return false;
    // it should search for the exact public key matching the same owner
    // for now we take the first one !!! TODO 
    if (!didDoc.publicKey[0].id.includes(issuer)) return false;
    const pubkey = didDoc.publicKey[0]
    // check if there is a defined format for public key or throws an error
    if (!pubkey.publicKeyPem && !pubkey.publicKeyHex && !pubkey.publicKeyBase64 && !pubkey.publicKeyBase58) return false;
    // if we get here it means that the public key can be retrieved
    return true;
  }
}
