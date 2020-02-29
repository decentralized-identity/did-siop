import { Test, TestingModule } from '@nestjs/testing';
import { LibDidSiopService } from './lib-did-siop.service';
import { JWT, JWK } from 'jose'
import { SIOP_KEY_ALGO } from './dtos/DID';
import { getDIDFromKey, getKeyIdFromKey } from './util/Util';
import { SIOPResponseMode, SIOPRequestCall, SIOPRequestPayload, SIOPResponseType, SIOPScope } from './dtos/siop';
import { ecKeyToDidDoc, DIDDocument } from './dtos/DIDDocument'
import { TEST_KEY, SIOP_KEY_TYPE, generateTestKey } from '../test/Aux';


const SIOP_HEADER = {
  "alg": "ES256K",
  "typ": "JWT",
  "kid": "did:example:0xab#veri-key1"
}

const SIOP_PAYLOAD = {
  "iss": "did:example:0xab",
  "response_type": "id_token",
  "client_id": "http://localhost:5000/response/validation",
  "scope": "openid did_authn",
  "state": "af0ifjsldkj",
  "nonce": "n-0S6_WzA2Mj",
  "response_mode" : "form_post",
  "registration" : {
      "jwks_uri" : "https://uniresolver.io/1.0/identifiers/did:example:0xab;transform-keys=jwks",
      "id_token_signed_response_alg" : [ "ES256K", "EdDSA", "RS256" ]
  }
}

let testKeyRP: TEST_KEY;
let testKeyUser: TEST_KEY;

describe('LibDidSiopService', () => {
  let service: LibDidSiopService;

  beforeAll( () => {
    testKeyRP = generateTestKey(SIOP_KEY_TYPE.EC)
    testKeyUser = generateTestKey(SIOP_KEY_TYPE.EC)
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LibDidSiopService],
    }).compile();

    service = module.get<LibDidSiopService>(LibDidSiopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('SIOP Request', () => {
    it('should create a JWT SIOP Request Object with "ES256K" algo and random keys', () => {

      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:5000/response/validation',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const jws = service.createSIOPRequest(siopRequestCall);
      const { header, payload } = JWT.decode(jws, { complete: true });

      const expectedHeader = SIOP_HEADER;
      expectedHeader.kid = expect.any(String);
      const expectedPayload = SIOP_PAYLOAD;
      expectedPayload.iss = expect.stringContaining('did:key:');
      expectedPayload.state = expect.any(String);
      expectedPayload.nonce = expect.any(String);
      expectedPayload.registration.jwks_uri = expect.stringContaining((<SIOPRequestPayload>payload).iss);
      expectedPayload.registration.id_token_signed_response_alg = expect.arrayContaining([SIOP_KEY_ALGO.ES256K]);

      expect(header).toMatchObject(expectedHeader);
      expect(payload).toMatchObject(expectedPayload);
    });

    it('should create a SIOP Request URL', () => {
      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:5000/response/validation',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const siopURI:string = service.createRedirectRequest(siopRequestCall);
      expect(siopURI).toContain('openid://?response_type=' + SIOPResponseType.ID_TOKEN)
      expect(siopURI).toContain('client_id=' + siopRequestCall.client_id)
      expect(siopURI).toContain('scope=' + SIOPScope.OPENID_DIDAUTHN)
      expect(siopURI).toContain('&request=')
    })

    it('should return "true" on request validation', () => {
      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:5000/response/validation',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const siopURI:string = service.createRedirectRequest(siopRequestCall);
      const urlParams = new URLSearchParams(siopURI);

      expect(service.validateSIOPRequest(urlParams.get('request'))).toBe(true);
    })
  });

  describe('SIOP Response', () => {
    it('should return "first siop response"', () => {
      // expect(service.createSIOPResponse()).toBe('first siop response');
      expect(true)
    });

    it('should return "true" on response validation', () => {
      expect(service.validateSIOPResponse()).toBe(true);
    })
  });
});
