import { Controller, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}

  @Post('user-sessions')
  async createUserSession() {
    await this.siopQueue.add('user-request');
  }

  @Post('responses')
  async validateSIOPResponse() {
    // await this.siopQueue.add('validateSiopResponse');
  }
}
