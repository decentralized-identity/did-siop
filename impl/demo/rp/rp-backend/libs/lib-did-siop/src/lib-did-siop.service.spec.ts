import { Test, TestingModule } from '@nestjs/testing';
import { LibDidSiopService } from './lib-did-siop.service';
import { JWT, JWK } from 'jose'
import { SIOP_KEY_ALGO } from './dtos/DID';

const SIOP_HEADER = {
  "alg": "ES256K",
  "typ": "JWT",
  "kid": "did:example:0xab#veri-key1"
}

const SIOP_PAYLOAD = {
  "iss": "did:example:0xab",
  "response_type": "id_token",
  "client_id": "https://my.rp.com/cb",
  "scope": "openid did_authn",
  "state": "af0ifjsldkj",
  "nonce": "n-0S6_WzA2Mj",
  "response_mode" : "form_post",
  "registration" : {
      "jwks_uri" : "https://uniresolver.io/1.0/identifiers/did:example:0xab;transform-keys=jwks",
      "id_token_signed_response_alg" : [ "ES256K", "EdDSA", "RS256" ]
  }
}

describe('LibDidSiopService', () => {
  let service: LibDidSiopService;

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
    it('should create a JWT SIOP Request Object with "ES256K" algo and random keys', async () => {
      const iss = 'did:example:0xab';
      const client_id = 'https://my.rp.com/cb';
      const algo = SIOP_KEY_ALGO.ES256K;
      const key = JWK.generateSync("EC", "secp256k1", { use: 'sig' });

      const jws = await service.createSIOPRequest(iss, client_id, algo, key);
      const { header, payload } = JWT.decode(jws, { complete: true });

      const expectedHeader = SIOP_HEADER;
      expectedHeader.kid = expect.any(String);
      const expectedPayload = SIOP_PAYLOAD;
      expectedPayload.state = expect.any(String);
      expectedPayload.nonce = expect.any(String);
      expectedPayload.registration.jwks_uri = expect.any(String);

      expect(header).toMatchObject(expectedHeader);
      expect(payload).toMatchObject(expectedPayload);
    });

    it('should return "true" on request validation', () => {
      expect(service.validateSIOPRequest()).toBe(true);
    })
  });

  describe('SIOP Response', () => {
    it('should return "first siop response"', () => {
      expect(service.createSIOPResponse()).toBe('first siop response');
    });

    it('should return "true" on response validation', () => {
      expect(service.validateSIOPResponse()).toBe(true);
    })
  });
});
