import { Test, TestingModule } from '@nestjs/testing';
import { SellerfrontService } from './sellerfront.service';

describe('SellerfrontService', () => {
  let service: SellerfrontService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SellerfrontService],
    }).compile();

    service = module.get<SellerfrontService>(SellerfrontService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
