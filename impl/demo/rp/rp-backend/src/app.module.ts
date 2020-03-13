import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@lib/did-siop';
import { SiopController } from './siop/siop.controller';
import { SiopModule } from './siop/siop.module';


@Module({
  imports: [LibDidSiopModule, SiopModule],
  controllers: [AppController, SiopController],
  providers: [AppService],
})
export class AppModule {}
