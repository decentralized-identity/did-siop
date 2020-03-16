import { Process, Processor, InjectQueue, OnQueueCompleted } from '@nestjs/bull';
import { Logger, BadRequestException } from '@nestjs/common';
import { Job, Queue } from 'bull'
import { 
  LibDidSiopService, 
  SIOPRequestCall, 
  SIOP_KEY_ALGO, 
  SIOPResponseMode, 
  DID_SIOP_ERRORS} from '@lib/did-siop';
import { WalletService, WALLET } from '@lib/wallet';
import { SiopUriRequest, SiopResponse, SiopAckRequest } from './dtos/SIOP';
import { doPostCall, getIssDid } from 'src/util/Util';

@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}
  private readonly logger = new Logger(SiopProcessor.name);

  @Process('userRequest')
  handleSiopRequest(job: Job): SiopUriRequest {
    this.logger.debug('SIOP Request received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data ${job.data}`)
    if (!job || !job.data || !job.data.client_id) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
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
  async onCompleted(job: Job, result: SiopUriRequest) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing result`)
    if (!job || !job.data || !job.data.clientUriRedirect || !result || !result.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    const response:SiopAckRequest = await doPostCall(result, job.data.clientUriRedirect)
    // sends error to Front-end
    if (!response || !response.validationRequest) {
      this.logger.debug('Error on SIOP Request Validation.')
      await this.siopErrorQueue.add('errorSiopRequestValidation');
    }
  }

  @Process('emitSiopResponse')
  handleSiopResponse(job: Job): SiopResponse {
    if (!job || !job.data || !job.data.jwt || !job.data.validationResult) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    
    return {
      validationResponse: job.data.validationResult,
      did: getIssDid(job.data.jwt)
    }
  }
}