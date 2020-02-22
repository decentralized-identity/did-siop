import { Module } from '@nestjs/common';
import { LibDidSiopService } from './lib-did-siop.service';

@Module({
  providers: [LibDidSiopService],
  exports: [LibDidSiopService],
})
export class LibDidSiopModule {}
