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
  handlePrintQREvent(@MessageBody() message: string): void {
    this.logger.log(`SIOP Request URI:     ${message}`)
    this.wss.emit('printQR', message);
  }

  @SubscribeMessage('sendSignInResponse')
  handleSignInResponseEvent(@MessageBody() message: string): void {
    this.logger.log(`SIOP Response Validation:     ${message}`)
    this.wss.emit('signInResponse', message);
  }
/*
  @SubscribeMessage('events')
  handleEvent(@ConnectedSocket() client: Socket): WsResponse<unknown> {
    client.emit('test of emission')
    const event = 'events';
    return { event, data };
  }

  @SubscribeMessage('open')
  onOpen(@MessageBody() input: unknown): WsResponse<unknown> {
    console.log(input);
    const event = 'open';
    const data = 'Received'
    return { event, data };
  }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
    const event = 'events';
    const response = [1, 2, 3];
    
    console.log("Data Received:" + data);

    return from(response).pipe(
      map(data => ({ event, data })),
    );
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() input: unknown): WsResponse<unknown> {
    console.log("Input Received:" + input);
    const event = 'message';
    const data = 'Hello client from Server!'
    return { event, data };
  }
  */
  /*
  onEvent(client: any, data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
  }
  */
  
}