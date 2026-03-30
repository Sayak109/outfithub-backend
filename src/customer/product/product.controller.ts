import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Put, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { PaginationDto } from './dto/pagination.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Request as ExpressRequest } from 'express';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends ExpressRequest {
  cookies: { [key: string]: string };
}

@Controller({ path: 'customer', version: '1' })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private prisma: PrismaService
  ) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Put('products')
  async findAllProducts(@Res() res: Response, @Body() dto: PaginationDto) {
    try {
      const products = await this.productService.findAllProducts(dto);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Products."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get("product-details/:slug")
  async productDetials(@Res() res: Response, @Param('slug') slug: string, @Req() req: AuthenticatedRequest,
  ) {
    try {
      let user_id: bigint | undefined;
      const token = req.cookies?.token;
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            user_id = user.id;
          }
        } catch (err: any) {
          console.warn("JWT verification failed:", err.message || err);
        }
      }
      const productBySlug = await this.prisma.product.findUnique({
        where: {
          slug
        }
      })

      if (!productBySlug) {
        throw new BadRequestException("Product not found.")
      }
      const products = await this.productService.productDetials(productBySlug?.id, user_id);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product details"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("store-front/:link")
  async find(@Res() res: Response, @Param('link') link: string, @Body() dto: PaginationDto) {
    try {
      const products = await this.productService.findAllBySeller(link, dto);

      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Store fornt of seller."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Get('products/:slug')
  async getSellerDetails(@Res() res: Response, @Param('slug') slug: string) {
    // return this.productService.findSellerData(slug);

    try {
      const sellerDetails = await this.productService.findSellerData(slug);

      let result = JSON.stringify(sellerDetails, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Store fornt of seller."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
