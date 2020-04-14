import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
  WsResponse,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger, BadRequestException } from '@nestjs/common';
import { SiopResponse, QRResponse, SiopUriRedirect } from 'src/siop/dtos/SIOP';
import { DID_SIOP_ERRORS } from '@lib/did-siop';
import { Observable, of } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CLIENT_ID_URI } from 'src/Config';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  
  @WebSocketServer() wss: Server;
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}
  private logger: Logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('Initialized!')
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected:     ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected:     ${client.id}`)
  }
  
  @SubscribeMessage('signIn')
  handleSignInEvent(
    @MessageBody() uriRedirect:SiopUriRedirect,
    @ConnectedSocket() client: Socket ): Observable<WsResponse<unknown>> {
      this.logger.debug(`SignIn Received from ${client.id}`);
      if (uriRedirect && uriRedirect.clientUriRedirect) {
        this.logger.debug(`Using URI redirect: ${uriRedirect.clientUriRedirect}`)
      }
      // queueing the request
      this.siopQueue.add('userRequest', { 
        clientId: CLIENT_ID_URI,
        sessionId: client.id,
        clientUriRedirect: uriRedirect && uriRedirect.clientUriRedirect ? uriRedirect.clientUriRedirect : undefined
      });

      return of({event: 'signIn', data: `SignIn request received and queued for:  ${client.id}`})
  }
  
  @SubscribeMessage('sendSIOPRequestJwtToFrontend')
  handlePrintQREvent(@MessageBody() qrResponse: QRResponse): void {
    this.logger.log(`SIOP Request SIOP URI:    ${qrResponse.siopUri}`)
    this.wss.emit('printQR', qrResponse);
  }

  @SubscribeMessage('sendSignInResponse')
  handleSignInResponseEvent(@MessageBody() message: SiopResponse): void {
    this.logger.log(`SIOP Response Validation:     ${JSON.stringify(message)}`)
    this.wss.emit('signInResponse', JSON.stringify(message));
  }
}