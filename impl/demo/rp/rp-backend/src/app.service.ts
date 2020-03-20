import { Injectable } from '@nestjs/common';
import io from 'socket.io-client';

@Injectable()
export class AppService {
  getHello(): string {
    const socket = io('http://localhost:9003');
    socket.emit('message', 'hello from a client on the backend');
    /*
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = function() {
      console.log('Connected');
      // socket.emit('events', { name: 'Nest' });
      socket.send(
        JSON.stringify({
          event: 'message',
          data: 'Hello World! (via Event)',
        }),
      );
      // socket.on('events', data => console.log(data));
      socket.addEventListener('broadcast', function(event) {
        console.log('Message from server ', event);
      })
    }*/
    return 'Hello World!';
  }
}
