import { Process, Processor, InjectQueue, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull'
import { 
  LibDidSiopService, 
  SIOPRequestCall, 
  SIOP_KEY_ALGO, 
  SIOPResponseMode, 
  SIOPResponsePayload } from '@lib/did-siop';
import { WalletService, WALLET } from '@lib/wallet';
import { SiopUriRequest, SiopResponse, SiopAckRequest } from './dtos/SIOP';
import { JWT } from 'jose';
import { doPostCall } from 'src/util/Util';

@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}
  private readonly logger = new Logger(SiopProcessor.name);

  @Process('user-request')
  handleSiopRequest(job: Job): SiopUriRequest {
    this.logger.debug('SIOP Request received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data ${job.data}`)
    const wallet: WALLET = WalletService.Instance.wallet
    // create SIOP Request Call
    const siopRequestCall:SIOPRequestCall = {
      iss: wallet.did,
      client_id: job.data.client_id,
      key: wallet.key,
      alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
      did_doc: wallet.didDoc,
      response_mode: SIOPResponseMode.FORM_POST
    }
    // call SIOP library to create a SIOP Request Object and its correspondent URI
    const siopUri:string = LibDidSiopService.createUriRequest(siopRequestCall);

    // TODO: store clien_id and nonce to local db
    this.logger.debug('SIOP Request completed.')

    return { siopUri }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: any) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data ${job.data}`)
    console.log(result)
    const response:SiopAckRequest = await doPostCall(result, job.data.clientUriRedirect)
    // sends error to Front-end
    if (!response || !response.validationRequest) {
      this.logger.debug('Error on SIOP Request Validation.')
      await this.siopErrorQueue.add('errorSiopRequestValidation');
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