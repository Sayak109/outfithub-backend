import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { FindCouponDto } from './dto/find-coupon.sto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';


@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator)
@Controller({ path: 'coupon', version: '1' })
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private prisma: PrismaService
  ) { }

  @Post()
  async create(@Res() res: Response, @Body() createCouponDto: CreateCouponDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const coupon = await this.couponService.create(createCouponDto);
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Promo code "${coupon.code}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo code created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @Body() findCouponDto: FindCouponDto) {
    try {
      const coupon = await this.couponService.findAll(findCouponDto);
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo codes."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const coupon = await this.couponService.findOne(BigInt(id));
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo code found successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const coupon = await this.couponService.update(BigInt(id), updateCouponDto);
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Promo code "${coupon.code}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo code updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const coupon = await this.couponService.remove(BigInt(id));
      let result = JSON.stringify(coupon, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Promo code "${coupon.code}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Promo code deleted successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
