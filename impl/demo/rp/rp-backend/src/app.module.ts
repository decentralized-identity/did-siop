import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@app/lib-did-siop';
import { SiopController } from './siop/siop.controller';
import { SiopService } from './siop/siop.service';
import { SiopModule } from './siop/siop.module';


@Module({
  imports: [LibDidSiopModule, SiopModule],
  controllers: [AppController, SiopController],
  providers: [AppService, SiopService],
})
export class AppModule {}
