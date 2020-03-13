import { Processor, OnQueueCompleted, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { SiopUriRequest, SiopAckRequest } from './dtos/SIOP';
import { doPostCall } from 'src/util/Util';

@Processor('siop')
export class SiopConsumer {
  private readonly logger = new Logger(SiopConsumer.name);
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}

  @OnQueueCompleted()
  @Process('createSiopRequest')
  async onCompleted(job: Job) {
    this.logger.debug('SIOP Request event completed.')
    const siopUriRequest:SiopUriRequest = job.data
    const response:SiopAckRequest = await doPostCall(siopUriRequest, siopUriRequest.clientUriRedirect)
    // sends error to Front-end
    if (!response || !response.validationRequest) {
      this.logger.debug('Error on SIOP Request Validation.')
      await this.siopErrorQueue.add('errorSiopRequestValidation');
    }
  }
}