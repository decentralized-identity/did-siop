import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { LibDidSiopModule } from '@lib/did-siop';
import { SiopController } from './siop.controller';
import { SiopProcessor } from './siop.processor';

@Module({
  imports: [
    LibDidSiopModule,
    BullModule.registerQueue({
      name: 'siop',
    }, {
      name: 'siopError',
    })
  ],
  controllers: [SiopController],
  providers: [SiopProcessor],
})
export class SiopModule {}
