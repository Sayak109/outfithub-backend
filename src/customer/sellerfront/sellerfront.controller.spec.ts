import { Test, TestingModule } from '@nestjs/testing';
import { SellerfrontController } from './sellerfront.controller';
import { SellerfrontService } from './sellerfront.service';

describe('SellerfrontController', () => {
  let controller: SellerfrontController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerfrontController],
      providers: [SellerfrontService],
    }).compile();

    controller = module.get<SellerfrontController>(SellerfrontController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
