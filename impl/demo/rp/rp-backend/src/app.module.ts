import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@lib/did-siop';
import { SiopModule } from './siop/siop.module';
import { EventsModule } from './events/events.module';


@Module({
  imports: [LibDidSiopModule, SiopModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
