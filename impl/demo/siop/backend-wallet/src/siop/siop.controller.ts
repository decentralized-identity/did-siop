import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopUriRequest, SiopAckRequest, SiopRequestJwt } from './dtos/SIOP';
import { LibDidSiopService, DID_SIOP_ERRORS } from '@lib/did-siop';
import { doGetCall } from 'src/util/Util';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}
  private readonly logger = new Logger(SiopController.name);

  @Post('request-urls')
  async validateSIOPRequest(@Body() siopUriRequest: SiopUriRequest): Promise<SiopAckRequest>  {
    this.logger.debug('POST SIOP request-urls.')
    if (!siopUriRequest || !siopUriRequest.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    // get siop uri
    this.logger.debug('SIOP Request received: ' + JSON.stringify(siopUriRequest))
    const siopRequestJwt = await this._getRequestJwt(siopUriRequest.siopUri)
    this.logger.log('SIOP Request JWT received: ' + siopRequestJwt)
    // validated siop Request
    const validationRequest:boolean = LibDidSiopService.validateSIOPRequest(siopRequestJwt)
    if (!validationRequest) {
      this.logger.error(DID_SIOP_ERRORS.INVALID_SIOP_REQUEST)
      return { validationRequest  }
    }
    this.logger.debug('SIOP Request validation: ' + validationRequest)
    // queue request to create a SIOP Response
    await this.siopQueue.add('createSiopResponse', siopRequestJwt);
    
    return { validationRequest  }
  }

  private async _getRequestJwt(siopUri: string): Promise<string> {
    const urlParams = new URLSearchParams(siopUri);
    // return directly the SIOP Request JWT when passed by value in the URI
    if (urlParams.has('request')) {
      return urlParams.get('request')
    }
    // retrieve the SIOP Request JWT usint the request_uri parameter
    if (!urlParams.has('request_uri')) throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    const siopRequestJwt:SiopRequestJwt = await doGetCall(urlParams.get('request_uri'))
    if (!siopRequestJwt || !siopRequestJwt.jwt) throw new BadRequestException(DID_SIOP_ERRORS.SIOP_REQUEST_RETRIEVE_ERROR)
    return siopRequestJwt.jwt
  }
}
