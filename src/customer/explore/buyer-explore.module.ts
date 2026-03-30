import { Module } from '@nestjs/common';
import { BuyerExploreService } from './buyer-explore.service';
import { BuyerExploreController } from './buyer-explore.controller';

@Module({
  controllers: [BuyerExploreController],
  providers: [BuyerExploreService],
})
export class CustomerExploreModule { }
