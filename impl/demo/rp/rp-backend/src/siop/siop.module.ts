import { Module } from '@nestjs/common';
import { LibDidSiopModule } from '@app/lib-did-siop';
import { SiopController } from './siop.controller';
import { SiopService } from './siop.service';

@Module({
  imports: [LibDidSiopModule],
  controllers: [SiopController],
  providers: [SiopService],
})
export class SiopModule {}
