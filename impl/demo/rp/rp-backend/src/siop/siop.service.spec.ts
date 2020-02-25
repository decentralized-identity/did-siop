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

  describe('SIOP Request', () => {
    it('should return "first siop request"', () => {
      expect(service.createSIOPRequest()).toBe('first siop request');
    });

    it('should return "true" on request validation', () => {
      expect(service.validateSIOPRequest()).toBe(true);
    })
  });

  describe('SIOP Response', () => {
    it('should return "first siop response"', () => {
      expect(service.createSIOPResponse()).toBe('first siop response');
    });

    it('should return "true" on response validation', () => {
      expect(service.validateSIOPResponse()).toBe(true);
    })
  });
});
