import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { CartHoldingDto } from './dto/cart-holding.dto';
import { CheckoutDto } from '../order/dto/checkout.dto';


@UseGuards(JwtGuard)
@Controller({ path: 'customer', version: '1' })
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post("cart")
  async create(@Res() res: Response, @Body() createCartDto: CreateCartDto, @GetUser("id") user_id: string) {
    try {
      const cart = await this.cartService.create(BigInt(user_id), createCartDto);
      let result = JSON.stringify(cart, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Item added to your cart."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post("cart/holding-items")
  async cartHolding(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: CartHoldingDto) {
    try {
      const cart = await this.cartService.cartHolding(BigInt(user_id), dto);
      let result = JSON.stringify(cart, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Manage cart holding."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("cart")
  async findAll(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: CheckoutDto) {
    try {
      const cart = await this.cartService.findAll(BigInt(user_id), dto);
      let result = JSON.stringify(cart, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Cart items."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get('coupons')
  async coupons(@Res() res: Response) {
    try {
      const coupon = await this.cartService.coupons();
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo codes."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('cart/:id')
  async update(@Res() res: Response, @Param('id') cart_id: string, @Body() updateCartDto: UpdateCartDto, @GetUser("id") user_id: string) {
    try {
      const cart = await this.cartService.update(BigInt(cart_id), BigInt(user_id), updateCartDto);
      let result = JSON.stringify(cart, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Cart updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete('cart/:id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const cart = await this.cartService.remove(BigInt(id));
      let result = JSON.stringify(cart, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Cart deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
