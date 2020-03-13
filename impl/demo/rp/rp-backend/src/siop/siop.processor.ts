import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull'
import { LibDidSiopService, SIOPRequestCall, SIOP_KEY_ALGO, SIOPResponseMode, SIOPResponsePayload } from '@app/lib-did-siop';
import { WalletService, WALLET } from 'src/wallet/wallet.service';
import { SiopUriRequest, SiopResponse } from './dtos/SIOP';
import { JWT } from 'jose';

@Processor('siop')
export class SiopProcessor {
  private readonly logger = new Logger(SiopProcessor.name);

  @Process('createSiopRequest')
  handleSiopRequest(job: Job): SiopUriRequest {
    this.logger.debug('SIOP Request received.')
    
    const wallet: WALLET = WalletService.Instance.wallet
    // create SIOP Request Call
    const siopRequestCall:SIOPRequestCall = {
      iss: wallet.did,
      client_id: 'http://localhost:9003/siop/responses',
      key: wallet.key,
      alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
      did_doc: wallet.didDoc,
      response_mode: SIOPResponseMode.FORM_POST
    }
    // call SIOP library to create a SIOP Request Object and its correspondent URI
    const siopUri:string = LibDidSiopService.createUriRequest(siopRequestCall);

    // TODO: store clien_id and nonce to local db
    this.logger.debug('SIOP Request completed.')

    return { 
      siopUri,
      clientUriRedirect: 'http://localhost:9001/siop/request-urls'
     }
  }

  @Process('validateSiopResponse')
  handleSiopResponse(job: Job): SiopResponse {
    
    const siopResponseJwt:string = job.data;
    // TODO: get clien_id and nonce from local db
    const { payload } = JWT.decode(siopResponseJwt, { complete: true });
    const siopPayload = <SIOPResponsePayload>payload;
    const redirectUri = siopPayload.aud;
    const nonce = siopPayload.nonce;

    const validationResult:boolean = LibDidSiopService.validateSIOPResponse(
      siopResponseJwt, 
      redirectUri, 
      nonce);

    return {
      validationResponse: validationResult,
      did: siopPayload.iss
    }
  }
}