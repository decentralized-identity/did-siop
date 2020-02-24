import { Test, TestingModule } from '@nestjs/testing';
import { SiopService } from './siop.service';

describe('SiopService', () => {
  let service: SiopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiopService],
    }).compile();

    service = module.get<SiopService>(SiopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
