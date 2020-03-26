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
import { SiopUriRequest, SiopResponse, SiopAckRequest, QRResponse } from './dtos/SIOP';
import { doPostCall, getUserDid } from 'src/util/Util';
import { BASE_URL } from 'src/Config';
import QRCode from 'qrcode';
import io from 'socket.io-client';

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
      response_mode: SIOPResponseMode.FORM_POST,
      request_uri: 'http://localhost:9003/siop/jwts/99999' // TODO: use session id as the last parameter
    }
    // call SIOP library to create a SIOP Request Object
    const siopRequestJwt = LibDidSiopService.createSIOPRequest(siopRequestCall);
    this.logger.debug(`SIOP Request JWT: ${siopRequestJwt}`)
    // TODO: store siopRequestJwt with the user session id

    // call SIOP library to create a SIOP Request Object and its correspondent URI
    const siopUri:string = LibDidSiopService.createUriRequest(siopRequestCall);
    this.logger.debug(`SIOP Request URI: ${siopUri}`)

    // TODO: store clien_id and nonce to local db
    this.logger.debug('SIOP Request completed.')

    return { siopUri }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: SiopUriRequest) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing result`)
    this.logger.debug('Result: ' + JSON.stringify(result))
    this.logger.debug('Data: ' + JSON.stringify(job.data))
    if (!job || !job.data || !result || !result.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }

    // sending a terminal QR to the frontend server
    const terminalQr = await QRCode.toString(
      result.siopUri ,
      { 
        type:'terminal',
        errorCorrectionLevel: 'low',
        version: 7 // minimum version for that amount of data
      })
    // this.logger.debug(terminalQr)
    const imageQr = await QRCode.toDataURL(result.siopUri)
    const qrResponse:QRResponse = {
      imageQr, 
      siopUri: result.siopUri, 
      terminalQr
    }
    // connect to server websocket
    const socket = io(BASE_URL);
    socket.emit('sendSIOPRequestJwtToFrontend', qrResponse);

    // when clientUriRedirect is present, we post the SIOP URI to the user server
    if (job.data.clientUriRedirect) {
      const response:SiopAckRequest = await doPostCall(result, job.data.clientUriRedirect)
      this.logger.debug('Response: ' + response)
      console.log('Response: ' + JSON.stringify(response))
      // sends error to Front-end
      if (!response || !response.validationRequest) {
        this.logger.debug('Error on SIOP Request Validation.')
        await this.siopErrorQueue.add('errorSiopRequestValidation');
      }
    }
  }

  @Process('emitSiopResponse')
  handleSiopResponse(job: Job): SiopResponse {
    if (!job || !job.data || !job.data.jwt || !job.data.validationResult) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    const siopResponse:SiopResponse = { 
      validationResult: job.data.validationResult,
      did: getUserDid(job.data.jwt)
    }
    this.logger.debug('SIOP Response: ' + JSON.stringify(siopResponse))
    return siopResponse
  }
}