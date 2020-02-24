import { Controller, Post } from '@nestjs/common';
import { SiopService } from './siop.service'

@Controller('siop')
export class SiopController {
  constructor(private readonly siopService: SiopService) {}

  @Post('request')
  createSIOPRequest(): string {
    return this.siopService.createSIOPRequest();
  }

  @Post('request/validation')
  validateSIOPRequest(): boolean {
    return this.siopService.validateSIOPRequest();
  }

  @Post('response')
  createSIOPResponse(): string {
    return this.siopService.createSIOPResponse();
  }

  @Post('response/validation')
  validateSIOPResponse(): boolean {
    return this.siopService.validateSIOPResponse();
  }
}
