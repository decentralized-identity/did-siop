import { Controller, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}

  @Post('user-sessions')
  async createUserSession() {
    await this.siopQueue.add('user-request', { 
      client_id: 'http://localhost:9003/siop/responses',
      clientUriRedirect: 'http://localhost:9001/siop/request-urls'
    });
  }

  @Post('responses')
  async validateSIOPResponse() {
    // await this.siopQueue.add('validateSiopResponse');
  }
}
