import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopUriRedirect, SiopResponseJwt } from './dtos/SIOP';
import { DID_SIOP_ERRORS, LibDidSiopService } from '@lib/did-siop';
import { CLIENT_ID_URI } from 'src/Config';
import { loadNonce, getIssDid } from 'src/util/Util';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}

  @Post('user-sessions')
  async createUserSession(@Body() uriRedirect:SiopUriRedirect) {
    if (!uriRedirect || !uriRedirect.clientUriRedirect) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    await this.siopQueue.add('userRequest', { 
      client_id: CLIENT_ID_URI,
      clientUriRedirect: uriRedirect.clientUriRedirect
    });
  }

  @Post('responses')
  async validateSIOPResponse(@Body() siopResponseJwt: SiopResponseJwt) {
    if (!siopResponseJwt || !siopResponseJwt.jwt) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }

    const validationResult:boolean = LibDidSiopService.validateSIOPResponse(
      siopResponseJwt.jwt, 
      CLIENT_ID_URI, 
      loadNonce(siopResponseJwt.jwt));
    
    if (!validationResult) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_SIOP_RESPONSE)
    }

    await this.siopQueue.add('emitSiopResponse', 
     { jwt: siopResponseJwt.jwt, validationResult } );
  }
}
