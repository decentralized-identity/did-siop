import { Test, TestingModule } from '@nestjs/testing';
import { SiopController } from './siop.controller';

describe('Siop Controller', () => {
  let controller: SiopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiopController],
    }).compile();

    controller = module.get<SiopController>(SiopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('SIOP Request endpoint', () => {
    it('should return "first siop request"', () => {
      expect(controller.createSIOPRequest).toBe('first siop request');
    });

    it('should return "true" on request validation', () => {
      expect(controller.validateSIOPRequest).toBe(true);
    })
  });

  describe('SIOP Response endpoint', () => {
    it('should return "first siop response"', () => {
      expect(controller.createSIOPResponse).toBe('first siop response');
    });

    it('should return "true" on response validation', () => {
      expect(controller.validateSIOPResponse).toBe(true);
    })
  });
});
