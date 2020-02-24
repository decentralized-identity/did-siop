import { Injectable } from '@nestjs/common';

@Injectable()
export class SiopService {
  createSIOPRequest(): string {
    return 'first siop request';
  }

  validateSIOPRequest(): boolean {
    return true;
  }

  createSIOPResponse(): string {
    return 'first siop response';
  }

  validateSIOPResponse(): boolean {
    return true;
  }

}
