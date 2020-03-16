import { Controller, Post, Body, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopUriRequest } from './dtos/SIOP';
import { LibDidSiopService, DID_SIOP_ERRORS } from '@lib/did-siop';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}

  @Post('request-urls')
  async validateSIOPRequest(@Body() siopUriRequest: SiopUriRequest)  {
    if (!siopUriRequest || !siopUriRequest.siopUri) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    // get siop uri
    console.log('Received body:' + JSON.stringify(siopUriRequest))
    const urlParams = new URLSearchParams(siopUriRequest.siopUri);
    // validated siop Request
    if (!LibDidSiopService.validateSIOPRequest(urlParams.get('request'))) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_SIOP_REQUEST)
    }
    // queue request to create a SIOP Response
    await this.siopQueue.add('createSiopResponse', siopUriRequest);
  }
}
