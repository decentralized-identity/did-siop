import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const port = 9001
  const app = await NestFactory.create(AppModule);
  Logger.log(`Wallet backend server started on http://localhost:${port}`, 'Wallet backend server')
  await app.listen(9001);
}
bootstrap();
