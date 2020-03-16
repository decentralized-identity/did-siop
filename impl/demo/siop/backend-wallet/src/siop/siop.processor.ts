import { Process, Processor, InjectQueue, OnQueueCompleted } from '@nestjs/bull';
import { Logger, BadRequestException } from '@nestjs/common';
import { Job, Queue } from 'bull'
import { 
  LibDidSiopService, 
  SIOP_KEY_ALGO, 
  SIOPResponseCall,
  SIOPRequestPayload,
  DID_SIOP_ERRORS} from '@lib/did-siop';
import { WalletService, WALLET } from '@lib/wallet';
import { SiopUriRequest, SiopResponseJwt, SiopResponseQueue } from './dtos/SIOP';
import { JWT } from 'jose';
import { doPostCall } from 'src/util/Util';

@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}
  private readonly logger = new Logger(SiopProcessor.name);

  @Process('createSiopResponse')
  handleCreateSiopResponse(job: Job): SiopResponseQueue {
    this.logger.debug('SIOP Response received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data ${job.data}`)
    if (!job || !job.data || !job.data.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    // decode SIOP Request Token to extract nonce and client_id uri
    const siopUriRequest = job.data as SiopUriRequest
    const urlParams = new URLSearchParams(siopUriRequest.siopUri);
    const siopRequestJwt = urlParams.get('request')
    const { payload } = JWT.decode(siopRequestJwt, { complete: true });
    const siopPayload = <SIOPRequestPayload>payload;
    // Instantiate a wallet
    const wallet: WALLET = WalletService.Instance.wallet
    // create SIOP Response Call
    const siopResponseCall:SIOPResponseCall = {
      key: wallet.key,
      alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
      did: wallet.did,
      nonce: siopPayload.nonce,
      redirect_uri: siopPayload.client_id,
      did_doc: wallet.didDoc
    }
    // call SIOP library to create a SIOP Response Object
    const jwt = LibDidSiopService.createSIOPResponse(siopResponseCall);
    this.logger.debug('SIOP Response completed.')
    this.logger.debug('SIOP Response JWT: ' + JSON.stringify(jwt))

    return { jwt, callbackUrl:  siopPayload.client_id }
  }

  @OnQueueCompleted()
  async onCompleted(_job: Job, result: SiopResponseQueue) {
    this.logger.debug('SIOP Response event completed.')
    this.logger.debug(`Processing result`)
    if (!result || !result.callbackUrl || !result.jwt) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    const siopResponse:SiopResponseJwt = { jwt: result.jwt }
    const response = await doPostCall(siopResponse, result.callbackUrl)
    this.logger.debug('SIOP Response sent.')
    this.logger.debug(JSON.stringify(response))
  }
}