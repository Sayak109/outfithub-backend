import { Module } from '@nestjs/common';
import { SellerfrontService } from './sellerfront.service';
import { SellerfrontController } from './sellerfront.controller';

@Module({
  controllers: [SellerfrontController],
  providers: [SellerfrontService],
})
export class SellerfrontModule {}
