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
import { Logger } from '@nestjs/common';
import { SiopResponse, QRResponse } from 'src/siop/dtos/SIOP';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  
  @WebSocketServer() wss: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: any) {
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
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket ): WsResponse<unknown> {
    this.logger.log(`SignIn Received:     ${message}`)
    return {event: 'signIn', data: `Processing SignIn request for:  ${client.id}`}
  }
  
  @SubscribeMessage('sendSIOPRequestJwtToFrontend')
  handlePrintQREvent(@MessageBody() qrResponse: QRResponse): void {
    this.logger.log(`SIOP Request terminal QR:\n${qrResponse.terminalQr}`)
    this.wss.emit('printQR', qrResponse);
  }

  @SubscribeMessage('sendSignInResponse')
  handleSignInResponseEvent(@MessageBody() message: SiopResponse): void {
    this.logger.log(`SIOP Response Validation:     ${JSON.stringify(message)}`)
    this.wss.emit('signInResponse', JSON.stringify(message));
  }
}