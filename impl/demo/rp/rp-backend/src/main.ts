import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const port = 9003
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableCors();
  await app.listen(port);
  Logger.log(`RP Backend server started on http://localhost:${port}`, 'RP Backend server')
}
bootstrap();
