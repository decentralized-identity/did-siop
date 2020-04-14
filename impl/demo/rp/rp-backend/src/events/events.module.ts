import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'siop',
    }, {
      name: 'siopError',
    })
  ],
  providers: [EventsGateway],
})
export class EventsModule {}