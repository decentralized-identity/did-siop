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
import { doPostCall, getUserDid, getJwtNonce } from 'src/util/Util';
import { BASE_URL } from 'src/Config';
import QRCode from 'qrcode';
import io from 'socket.io-client';
import Redis from 'ioredis';

@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}
  private readonly logger = new Logger(SiopProcessor.name);
  private readonly jwtRedis = new Redis({ keyPrefix: "jwt:" });
  private readonly nonceRedis = new Redis({ keyPrefix: "nonce:" });
  private readonly socket = io(BASE_URL);

  @Process('userRequest')
  handleSiopRequest(job: Job): SiopUriRequest {
    this.logger.debug('SIOP Request received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`)
    if (!job || !job.data || !job.data.clientId || !job.data.sessionId) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    // creates a new Enterprise Wallet with a new set of keys and DID
    const wallet: WALLET = WalletService.Instance.wallet
    // create SIOP Request Call
    const siopRequestCall:SIOPRequestCall = {
      iss: wallet.did,
      client_id: job.data.clientId,
      key: wallet.key,
      alg: [SIOP_KEY_ALGO.ES256K, SIOP_KEY_ALGO.EdDSA, SIOP_KEY_ALGO.RS256],
      did_doc: wallet.didDoc,
      response_mode: SIOPResponseMode.FORM_POST,
      request_uri: `http://localhost:9003/siop/jwts/${job.data.sessionId}`
    }
    // call SIOP library to create a SIOP Request Object
    const siopRequestJwt = LibDidSiopService.createSIOPRequest(siopRequestCall);
    this.logger.debug(`SIOP Request JWT: ${siopRequestJwt}`)
    // store siopRequestJwt with the user session id
    this.jwtRedis.set(job.data.sessionId, siopRequestJwt)
    // call SIOP library to create a SIOP Request Object and its correspondent URI
    const siopUri:string = LibDidSiopService.createUriRequest(siopRequestCall);
    this.logger.debug(`SIOP Request URI: ${siopUri}`)
    // store sessionId and nonce 
    this.nonceRedis.set(job.data.sessionId, getJwtNonce(siopRequestJwt))
    this.logger.debug('SIOP Request completed.')

    return { siopUri }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: SiopUriRequest) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing result`)
    this.logger.debug('Result: ' + JSON.stringify(result))
    // this.logger.debug('Data: ' + JSON.stringify(job.data))
    if (!job || !job.data || !result || !result.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }

    // when clientUriRedirect NOT present, print QR to be read from an APP
    // !!! TODO: implement a way to send the siop:// and be catched by client (web plugin or APP deep link)
    if (!job.data.clientUriRedirect) {
      // generate QR code image 
      const imageQr = await QRCode.toDataURL(result.siopUri)
      const qrResponse:QRResponse = {
        imageQr, 
        siopUri: result.siopUri
      }
      // sends an event to the server, to send the QR to the client
      this.socket.emit('sendSIOPRequestJwtToFrontend', qrResponse);
    }

    // when clientUriRedirect is present, we post the SIOP URI to the user server
    if (job.data.clientUriRedirect) {
      const response:SiopAckRequest = await doPostCall(result, job.data.clientUriRedirect)
      this.logger.debug('Response: ' + JSON.stringify(response))
      // sends error to Front-end
      if (!response || !response.validationRequest) {
        this.logger.debug('Error on SIOP Request Validation.')
        await this.siopErrorQueue.add('errorSiopRequestValidation');
      }
    }
  }
}