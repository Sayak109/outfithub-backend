import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductService } from '../product/product.service';

@Module({
  controllers: [CartController],
  providers: [CartService, ProductService],
  exports: [CartService],
})
export class CartModule { }
