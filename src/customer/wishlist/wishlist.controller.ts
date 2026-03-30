import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Res, BadRequestException, UseGuards, Put } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { GetWishlistDto } from './dto/get-wishlist.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Response } from 'express';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';


@Controller({ path: 'wishlist', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator, Role.Seller, Role.Buyer)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Post()
  async create(@Res() res: Response, @GetUser("id") user_id: string, @Body() createWishlistDto: CreateWishlistDto) {
    try {
      const wishlist = await this.wishlistService.create(BigInt(user_id), createWishlistDto);
      let result = JSON.stringify(wishlist, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Wishlist created successfully."));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetWishlistDto) {
    try {
      const wishlist = await this.wishlistService.findAll(BigInt(user_id), dto);
      let result = JSON.stringify(wishlist, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateWishlistDto: UpdateWishlistDto) {
  //   return this.wishlistService.update(+id, updateWishlistDto);
  // }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: string,) {
    try {
      const wishlist = await this.wishlistService.remove(BigInt(id), BigInt(user_id));
      let result = JSON.stringify(wishlist, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Wishlist deleted successfully."));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }
}
