import { Module } from '@nestjs/common';
import { SellerAggrementService } from './seller-aggrement.service';
import { SellerAggrementController } from './seller-aggrement.controller';

@Module({
  controllers: [SellerAggrementController],
  providers: [SellerAggrementService],
})
export class SellerAggrementModule {}
