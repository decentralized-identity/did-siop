import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@app/lib-did-siop';


@Module({
  imports: [LibDidSiopModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
