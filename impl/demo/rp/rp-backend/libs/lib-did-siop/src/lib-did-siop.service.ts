import { Injectable } from '@nestjs/common';
import { SIOP_KEY_ALGO } from './dtos/DID';
import { JWT, JWK, JSONWebKey, JWKRSAKey, JWKECKey, JWKOKPKey } from 'jose';
import { getRandomString, getPemPubKey } from './util/Util'
import { 
  SIOPRequest, SIOPResponseType, SIOPScope, 
  SIOPRequestCall, SIOPIndirectRegistration, SIOPDirectRegistration, 
  SIOPRequestPayload, SIOPJwtHeader, SIOPResponseCall, SIOPResponse, SIOP_RESPONSE_ISS, SIOPResponsePayload, SIOP_KEY_TYPE } from './dtos/siop';
import { DIDDocument, getDIDDocument, PublicKey } from './dtos/DIDDocument'
import { DID_SIOP_ERRORS } from './error'
import base64url from "base64url";

@Injectable()
export class LibDidSiopService {

  /**
   * 
   * @param siopRequest 
   */
  static createUriRequest(siopRequest:SIOPRequestCall): string {
    const responseUri = 
    'openid://?response_type=' + SIOPResponseType.ID_TOKEN +
    '&client_id=' + siopRequest.client_id +
    '&scope=' + SIOPScope.OPENID_DIDAUTHN;
    
    // The Request Object can be passed by value in the request request parameter,
    // or by reference using the request_uri parameter.
    if (siopRequest.request_uri) {
      return responseUri + '&request_uri=' + siopRequest.request_uri
    }
    // returns a URI with SIOP Request JWT embedded
    return responseUri + '&request=' + this.createSIOPRequest(siopRequest)
  }

  /**
   * 
   * @param input 
   */
  static createSIOPRequest(input: SIOPRequestCall): string {

    const siopRequest:SIOPRequest = this._createPayloadRequest(input)
    const payload = Buffer.from(JSON.stringify(siopRequest))

    return this._signSIOPRequest (
      this._getAlgKeyType(input.alg, input.key), 
      input.key, 
      payload, 
      siopRequest.kid )
  }

  /**
   * 
   * @param siopJwt 
   */
  static validateSIOPRequest(siopJwt: string): boolean {
    // decode token
    const { header, payload } = JWT.decode(siopJwt, { complete: true });
    const siopHeader = <SIOPJwtHeader>header;
    const siopPayload = <SIOPRequestPayload>payload;
    // assign the default DID Document value, which can be null
    let didDoc: DIDDocument = siopPayload.did_doc;

    // throw error if scope does not contain did_authn both in URI and inside the decoded JWT
    if (!siopPayload.scope.includes(SIOPScope.OPENID_DIDAUTHN)) {
      throw new Error(DID_SIOP_ERRORS.NO_DIDAUTHN_SCOPE_INCLUDED);
    }

    // If no did_doc is present, resolve the DID Document from the 
    // RP's DID specified in the iss request parameter.
    if (!siopPayload.did_doc) didDoc = getDIDDocument(siopPayload.iss)

    // If did_doc is present, ensure this is a viable channel to exchange 
    // the RP's DID Document according to the applicable DID method.
    // !!! TODO

    // If jwks_uri is present, ensure that the DID in the jwks_uri matches the DID in the iss claim.
    if (siopPayload.registration && (<SIOPIndirectRegistration>siopPayload.registration).jwks_uri && 
    !(<SIOPIndirectRegistration>siopPayload.registration).jwks_uri.includes(siopPayload.iss)) {
      throw new Error(DID_SIOP_ERRORS.DID_MISMATCH)
    }

    // Determine the verification method from the RP's DID Document that matches the kid of the SIOP Request.
    if (didDoc.publicKey && didDoc.publicKey.length>0 && didDoc.publicKey[0].id !== siopHeader.kid) {
      throw new Error(DID_SIOP_ERRORS.KID_MISMATCH)
    }

    // Verify the SIOP Request according to the verification method above.
    return this._verifySIOPToken(didDoc.publicKey[0], siopJwt);
  }

  static createSIOPResponse(input: SIOPResponseCall): string {

    const siopResponse:SIOPResponse = this._createPayloadResponse(input)
    const payload = Buffer.from(JSON.stringify(siopResponse))

    return this._signSIOPResponse (
      this._getAlgKeyType(input.alg, input.key), 
      input.key, 
      payload, 
      siopResponse.kid )
  }

  /**
   * 
   * @param siopJwt 
   * @param redirectUri 
   * @param nonce 
   */
  static validateSIOPResponse(siopJwt: string, redirectUri: string, nonce: string): boolean {
    // decode token
    const { header, payload } = JWT.decode(siopJwt, { complete: true });
    const siopHeader = <SIOPJwtHeader>header;
    const siopPayload = <SIOPResponsePayload>payload;
    // assign the default DID Document value, which can be null
    let didDoc: DIDDocument = siopPayload.did_doc;

    // The Client MUST validate that the value of the iss (issuer) Claim is https://self-isued.me.
    if (siopPayload.iss !== SIOP_RESPONSE_ISS.SELF_ISSUE) throw new Error(DID_SIOP_ERRORS.ISS_NOT_SELF_ISSUED)
    // The Client MUST validate that the aud (audience) Claim contains 
    // the value of the redirect_uri that the Client sent in the Authentication Request as an audience.
    if (siopPayload.aud !== redirectUri) throw new Error(DID_SIOP_ERRORS.AUD_MISMATCH)
    // The Client MUST validate the signature of the ID Token according to JWS [JWS] using the algorithm 
    // specified in the alg Header Parameter of the JOSE Header, using the key in the sub_jwk
    if (!this._verifySIOPResponse(siopHeader.alg, siopPayload.sub_jwk, siopJwt)) {
      throw new Error(DID_SIOP_ERRORS.SIGNATURE_VALIDATION_ERROR)
    }
    // The Client MUST validate that the sub Claim value is the base64url encoded 
    // representation of the thumbprint of the key in the sub_jwk Claim
    if (!this._verifySubClaim(siopPayload.sub, siopPayload.sub_jwk)) throw new Error(DID_SIOP_ERRORS.SUB_CLAIM_ERROR);
    // The current time MUST be before the time represented by the exp Claim
    if (this._isTokenExpired(siopPayload.exp)) throw new Error(DID_SIOP_ERRORS.TOKEN_EXPIRED)
    //  a nonce Claim MUST be present and its value checked to verify that it is the same value 
    // as the one that was sent in the Authentication Request
    if (nonce !== siopPayload.nonce) throw new Error(DID_SIOP_ERRORS.NONCE_MISMATCH)
    // If no did_doc is present, resolve the DID Document from the SIOP's DID specified in the did claim
    if (!siopPayload.did_doc) didDoc = getDIDDocument(siopPayload.did)
    // If did_doc is present, ensure this is a viable channel to exchange 
    // the RP's DID Document according to the applicable DID method.
    // !!! TODO
    // Determine the verification method from the RP's DID Document that matches the kid of the SIOP Request.
    if (didDoc.publicKey && didDoc.publicKey.length>0 && didDoc.publicKey[0].id !== siopHeader.kid) {
      throw new Error(DID_SIOP_ERRORS.KID_MISMATCH)
    }
    // If the key pair that signed the id_token refers to the same key as indicated by the verification method, 
    // then no additional verification has to be done as the SIOP validation will verify the signature of the JWS.
    if (siopPayload.sub_jwk.kid !== didDoc.publicKey[0].id) {
      if (!this._verifySIOPToken(didDoc.publicKey[0], siopJwt)) throw new Error(DID_SIOP_ERRORS.SIGNATURE_VALIDATION_ERROR)
    }

    return true;
  }

  private static _createPayloadRequest(input: SIOPRequestCall): SIOPRequest {

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
  
  private static _signSIOPRequest(alg: SIOP_KEY_ALGO, key: JWK.Key, payload: Buffer, kid: string): string {
    const jws = JWT.sign(
      JSON.parse(payload.toString()),
      key,
      {
        kid: true, // When true it pushes the key's "kid" to the JWT Header
        header: {
          alg,
          typ: 'JWT'
        },
      },
    )

    return jws;
  }

  private static _createPayloadResponse(input: SIOPResponseCall): SIOPResponse {
    const kid:string = input.kid ? input.kid : this._getKidFromDidDoc(input.did_doc)

    return {
      iss: SIOP_RESPONSE_ISS.SELF_ISSUE,
      kid,
      nonce: input.nonce,
      did: input.did,
      sub_jwk: this._getJWK(input.alg, input.key, kid),
      sub: this._getSIOPResponseSub(input.key),
      exp: 'bar',
      aud: input.redirect_uri,
      did_doc: input.did_doc ? this._validateDID(input.did, input.did_doc) : undefined
    }
  }

  private static _signSIOPResponse(alg: SIOP_KEY_ALGO, key: JWK.Key, payload: Buffer, kid: string): string {
    const jws = JWT.sign(
      JSON.parse(payload.toString()),
      key,
      {
        kid: true, // When true it pushes the key's "kid" to the JWT Header
        now: new Date(Date.now() * 1000), // current time in epoch milliseconds
        expiresIn: '5m', // expires in 5 minutes
        header: {
          alg,
          typ: 'JWT'
        }
      }
    )

    return jws;
  }

  private static _verifySIOPToken(pubKey: PublicKey, siopJwt: string): boolean {
    const pemKey:string = getPemPubKey(pubKey)
    const jwk = JWK.asKey(pemKey);
    // throws error if verify is signature incorrect
    JWT.verify(siopJwt, jwk);
    return true;
  }

  private static _verifySIOPResponse(alg: string, jwk: JSONWebKey, siopJwt: string): boolean {
    // checks the algorithm is valid for the provided key !!! TODO
    this._getAlgKeyType([alg], jwk);
    // throws error if verify is signature incorrect
    JWT.verify(siopJwt, jwk);
    return true;
  }

  private static _getAlgKeyType(supportedAlg: string[], key: JWK.Key | JSONWebKey): SIOP_KEY_ALGO {
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

  private static _getKidFromDidDoc(didDoc: DIDDocument): string {
    if (!didDoc?.publicKey[0]?.id) throw new Error(DID_SIOP_ERRORS.NO_DIDDOCUMENT_KID);
    return didDoc.publicKey[0].id;
  }

  private static _getRegistration(input: SIOPRequestCall): (SIOPIndirectRegistration | SIOPDirectRegistration) {
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

  private static _retrievablePubKeyFromDidDoc(issuer: string, didDoc: DIDDocument): boolean {
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

  private static _getJWK(alg:string[], key: JWK.Key, kid: string): JSONWebKey {
    const keyType:SIOP_KEY_ALGO = this._getAlgKeyType(alg, key);

    switch (keyType) {
      case (SIOP_KEY_ALGO.RS256):
        return <JWKRSAKey> {
          kid,
          kty: key.kty,
          e: key.e,
          n: key.n
        }
      case (SIOP_KEY_ALGO.ES256K):
        return <JWKECKey> {
          kid,
          kty: key.kty,
          crv: key.crv,
          x: key.x,
          y: key.y
        }
      case (SIOP_KEY_ALGO.EdDSA):
        return <JWKOKPKey> {
          kid,
          kty: key.kty,
          crv: key.crv,
          x: key.x
        }
      default: throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED)
    }
  }

  private static _getKeyFromJSONWebKey(jwk: JSONWebKey): JWK.RSAKey | JWK.ECKey | JWK.OKPKey {
    switch (jwk.kty) {
      case (SIOP_KEY_TYPE.RSA):
        return JWK.asKey(<JWKRSAKey>jwk);
      case (SIOP_KEY_TYPE.EC):
        return JWK.asKey(<JWKECKey>jwk);
      case (SIOP_KEY_TYPE.OKP):
          return JWK.asKey(<JWKOKPKey>jwk);
      default: throw new Error(DID_SIOP_ERRORS.NO_ALG_SUPPORTED)
    }
  }

  private static _getSIOPResponseSub(key: JWK.Key): string {
    if (!key || !key.thumbprint) throw new Error(DID_SIOP_ERRORS.KEY_MALFORMED_THUMBPRINT)
    return base64url.encode(key.thumbprint)
  }

  /**
   * When DID Document is present, MUST be the SIOP's DID Document corresponding to did in JSON encoding.
   * @param did 
   * @param didDoc 
   * @return DIDDocument 
   */
  private static _validateDID(did: string, didDoc: DIDDocument): DIDDocument {
    if (!did || !didDoc || !didDoc.id) throw new Error(DID_SIOP_ERRORS.INVALID_PARAMS)
    if (did !== didDoc.id) throw new Error(DID_SIOP_ERRORS.DID_MISMATCH)

    return didDoc
  }

  private static _verifySubClaim(sub: string, jwk: JSONWebKey): boolean {
    if (!sub || !jwk) throw new Error(DID_SIOP_ERRORS.INVALID_PARAMS)

    const key = this._getKeyFromJSONWebKey(jwk);

    return (sub === this._getSIOPResponseSub(key))
  }

  private static _isTokenExpired(exp: string):boolean {
    // check if token is still active 
    const now = Date.now();  
    if (+(exp)*1000 > now) return false
    return true
  }
}
