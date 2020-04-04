import { Controller, Post, Body, BadRequestException, Logger, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopResponseJwt, SiopAckResponse, SiopResponse, SiopRequestJwt } from './dtos/SIOP';
import { DID_SIOP_ERRORS, LibDidSiopService } from '@lib/did-siop';
import { CLIENT_ID_URI, BASE_URL } from 'src/Config';
import { getUserDid, getJwtNonce } from 'src/util/Util';
import io from 'socket.io-client';
import Redis from 'ioredis';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}
  private readonly logger = new Logger(SiopController.name);
  private readonly nonceRedis = new Redis({ keyPrefix: "nonce:" });
  private readonly jwtRedis = new Redis({ keyPrefix: "jwt:" });
  private readonly socket = io(BASE_URL);

  @Post('responses')
  async validateSIOPResponse(@Body() siopResponseJwt: SiopResponseJwt): Promise<SiopAckResponse> {
    this.logger.log('[RP Backend] Received POST SIOP Response from SIOP client')
    if (!siopResponseJwt || !siopResponseJwt.jwt) {
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    this.logger.log(`[RP Backend] Received SIOP Response JWT: ${siopResponseJwt.jwt}`)
    // validate siop response
    const validationResult:boolean = LibDidSiopService.validateSIOPResponse(
      siopResponseJwt.jwt, 
      CLIENT_ID_URI, 
      await this._getValidNonce(siopResponseJwt.jwt)
    );
    this.logger.debug(`[RP Backend] SIOP Response validation: ${validationResult}`)
    if (!validationResult) {
      this.logger.error(DID_SIOP_ERRORS.INVALID_SIOP_RESPONSE)
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_SIOP_RESPONSE)
    }
    // prepare siop response struct to return
    const siopResponse:SiopResponse = { 
      validationResult,
      did: getUserDid(siopResponseJwt.jwt),
      jwt: siopResponseJwt.jwt
    }
    // send a message to server so it can communicate with front end io client
    // and send the validation response
    this.socket.emit('sendSignInResponse', siopResponse);
    // also send the response to the siop client
    return { validationResult }
  }

  @Get('jwts/:clientId')
  async getSIOPRequestJwt(@Param('clientId') clientId: string): Promise<SiopRequestJwt> {
    // retrieve jwt value stored in the DB with a key cliendId
    const jwt = await this.jwtRedis.get(clientId)
    this.logger.debug(`Received request from ${clientId} to get the JWT`);
    return { jwt }
  }

  private async _getValidNonce(jwt: string): Promise<string> {
    const nonce = getJwtNonce(jwt);
    // loads nonce from Redis as a stored key or throws error if not found
    try {
      await this.nonceRedis.get(getJwtNonce(jwt));  
    } catch (error) {
      this.logger.error(DID_SIOP_ERRORS.INVALID_PARAMS)
      throw new BadRequestException(DID_SIOP_ERRORS.INVALID_PARAMS)
    }
    return nonce;
  }
}
