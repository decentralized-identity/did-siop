import { Injectable } from '@nestjs/common';
import { SIOP_KEY_ALGO } from './dtos/DID';
import { JWT, JWK } from 'jose';
import { getRandomString } from './util/Util'
import { SIOPRequest, SIOPResponseType, SIOPScope, SIOPResponseMode, SIOPRegistration } from './dtos/siop';

export interface DID_SIOP {

  createSIOPRequest(iss: string, client_id: string, alg: SIOP_KEY_ALGO, key: JWK.Key): string;

}

@Injectable()
export class LibDidSiopService implements DID_SIOP {
  createSIOPRequest(iss: string, client_id: string, alg: SIOP_KEY_ALGO, key: JWK.Key): string {

    const siopRequest:SIOPRequest = this._createPayloadRequest(iss, client_id, alg)
    const payload = Buffer.from(JSON.stringify(siopRequest))

    return this._signSIOPRequest(alg, key, payload, siopRequest.kid)
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

  private _createPayloadRequest(
    iss: string, 
    client_id: string, 
    alg: SIOP_KEY_ALGO ): SIOPRequest {
    const kid = iss + '#veri-key1'
    const registration: SIOPRegistration = {
      jwks_uri: 'http://route.to.the.key/' + kid,
      id_token_signed_response_alg: [alg]
    }

    return <SIOPRequest> {
      iss,
      kid,
      response_type: SIOPResponseType.ID_TOKEN,
      client_id,
      scope: SIOPScope.OPENID_DIDAUTHN,
      state: getRandomString(),
      nonce: getRandomString(),
      registration,
      response_mode: SIOPResponseMode.FORM_POST
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
}
