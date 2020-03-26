import { Test, TestingModule } from '@nestjs/testing';
import { LibDidSiopService } from '@lib/did-siop';
import { JWT } from 'jose'
import { SIOP_KEY_ALGO } from '../src/dtos/DID';
import { SIOPResponseMode, SIOPRequestCall, SIOPRequestPayload, SIOPResponseType, SIOPScope, SIOPResponseCall, SIOP_RESPONSE_ISS, SIOP_KEY_TYPE } from '@lib/did-siop';
import { TEST_KEY, generateTestKey, SIOP_HEADER, SIOP_REQUEST_PAYLOAD, SIOP_RESPONSE_PAYLOAD } from './Aux';
import { getRandomString } from '../src/util/Util';

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
        client_id: 'http://localhost:9003/siop/responses',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const jws = LibDidSiopService.createSIOPRequest(siopRequestCall);
      const { header, payload } = JWT.decode(jws, { complete: true });

      const expectedHeader = SIOP_HEADER;
      expectedHeader.kid = expect.any(String);
      const expectedPayload = SIOP_REQUEST_PAYLOAD;
      expectedPayload.iss = expect.stringContaining('did:key:');
      expectedPayload.state = expect.any(String);
      expectedPayload.nonce = expect.any(String);
      expectedPayload.registration.jwks_uri = expect.stringContaining((<SIOPRequestPayload>payload).iss);
      expectedPayload.registration.id_token_signed_response_alg = expect.arrayContaining([SIOP_KEY_ALGO.ES256K]);

      expect(header).toMatchObject(expectedHeader);
      expect(payload).toMatchObject(expectedPayload);
    });

    it('should create a SIOP Request URL with a JWT embedded', () => {
      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:9003/siop/responses',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const siopURI:string = LibDidSiopService.createUriRequest(siopRequestCall);
      expect(siopURI).toContain('openid://?response_type=' + SIOPResponseType.ID_TOKEN)
      expect(siopURI).toContain('client_id=' + siopRequestCall.client_id)
      expect(siopURI).toContain('scope=' + SIOPScope.OPENID_DIDAUTHN)
      expect(siopURI).toContain('&request=')
    })

    it('should create a SIOP Request URL with a Request URI referencing a JWT', () => {
      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:9003/siop/responses',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST,
        request_uri: 'http://localhost:9003/siop/jwts/99999'
      }

      const siopURI:string = LibDidSiopService.createUriRequest(siopRequestCall);
      expect(siopURI).toContain('openid://?response_type=' + SIOPResponseType.ID_TOKEN)
      expect(siopURI).toContain('client_id=' + siopRequestCall.client_id)
      expect(siopURI).toContain('scope=' + SIOPScope.OPENID_DIDAUTHN)
      expect(siopURI).toContain('&request_uri=' + siopRequestCall.request_uri)
    })

    it('should return "true" on request validation', () => {
      const siopRequestCall:SIOPRequestCall = {
        iss: testKeyRP.did,
        client_id: 'http://localhost:9003/siop/responses',
        key: testKeyRP.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did_doc: testKeyRP.didDoc,
        response_mode: SIOPResponseMode.FORM_POST
      }

      const siopURI:string = LibDidSiopService.createUriRequest(siopRequestCall);
      const urlParams = new URLSearchParams(siopURI);

      expect(LibDidSiopService.validateSIOPRequest(urlParams.get('request'))).toBe(true);
    })
  });

  describe('SIOP Response', () => {
    it('should create a JWT SIOP Response Object with "ES256K" algo and random keys', () => {

      const siopResponseCall:SIOPResponseCall = {
        key: testKeyUser.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did: testKeyUser.did,
        nonce: getRandomString(),
        redirect_uri: 'http://localhost:9003/siop/responses',
        did_doc: testKeyUser.didDoc
      }
      
      const jws = LibDidSiopService.createSIOPResponse(siopResponseCall);
      const { header, payload } = JWT.decode(jws, { complete: true });
      const expectedHeader = SIOP_HEADER;
      expectedHeader.kid = expect.any(String);
      const expectedPayload = SIOP_RESPONSE_PAYLOAD;
      expectedPayload.iss = expect.stringMatching(SIOP_RESPONSE_ISS.SELF_ISSUE);
      expectedPayload.exp = expect.any(Number);
      expectedPayload.iat = expect.any(Number);
      expectedPayload.nonce = expect.any(String);
      expectedPayload.sub_jwk.kid = expect.stringContaining('did:key:');
      expectedPayload.sub_jwk.x = expect.any(String);
      expectedPayload.sub_jwk.y = expect.any(String);
      expectedPayload.sub = expect.any(String);
      expectedPayload.did = expect.stringContaining('did:key:');
      
      expect(header).toMatchObject(expectedHeader);
      expect(payload).toMatchObject(expectedPayload);
    });

    it('should return "true" on response validation', () => {
      const siopResponseCall:SIOPResponseCall = {
        key: testKeyUser.key,
        alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
        did: testKeyUser.did,
        nonce: getRandomString(),
        redirect_uri: 'http://localhost:9003/siop/responses',
        did_doc: testKeyUser.didDoc
      }
      const jws = LibDidSiopService.createSIOPResponse(siopResponseCall);

      expect(
        LibDidSiopService.validateSIOPResponse(
          jws, 
          siopResponseCall.redirect_uri, 
          siopResponseCall.nonce)
      ).toBe(true);
    })
  });
});
