import { Module } from '@nestjs/common';
import { SellerProductService } from './seller-product.service';
import { SellerProductController } from './seller-product.controller';

@Module({
  controllers: [SellerProductController],
  providers: [SellerProductService],
})
export class SellerProductModule {}
