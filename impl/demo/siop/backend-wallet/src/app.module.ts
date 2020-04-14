import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@lib/did-siop';
import { SiopModule } from './siop/siop.module';

@Module({
  imports: [LibDidSiopModule, SiopModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
