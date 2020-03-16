import { Controller, Post, Body, HttpException, HttpStatus, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopUriRequest, SiopAckRequest } from './dtos/SIOP';
import { LibDidSiopService, DID_SIOP_ERRORS } from '@lib/did-siop';

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
    const urlParams = new URLSearchParams(siopUriRequest.siopUri);
    // validated siop Request
    const validationRequest:boolean = LibDidSiopService.validateSIOPRequest(urlParams.get('request'))
    if (!validationRequest) {
      this.logger.error(DID_SIOP_ERRORS.INVALID_SIOP_REQUEST)
      return { validationRequest  }
    }
    this.logger.debug('SIOP Request validation: ' + validationRequest)
    // queue request to create a SIOP Response
    await this.siopQueue.add('createSiopResponse', siopUriRequest);
    
    return { validationRequest  }
  }
}
