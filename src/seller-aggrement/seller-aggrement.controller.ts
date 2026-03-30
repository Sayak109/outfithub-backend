import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { SellerAggrementService } from './seller-aggrement.service';
import { CreateSellerAggrementDto } from './dto/create-seller-aggrement.dto';
import { UpdateSellerAggrementDto } from './dto/update-seller-aggrement.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { Role } from '@/auth/enums/role.enum';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';


@Controller({ path: 'seller-aggrement', version: '1' })
export class SellerAggrementController {
  constructor(private readonly sellerAggrementService: SellerAggrementService) { }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post()
  async create(@Res() res: Response, @Body() createSellerAggrementDto: CreateSellerAggrementDto) {
    try {
      const keywords = await this.sellerAggrementService.create(createSellerAggrementDto);
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller aggrement added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  async findAll(@Res() res: Response,) {
    try {
      const keywords = await this.sellerAggrementService.findAll();
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Seller aggrement"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const keywords = await this.sellerAggrementService.findOne(BigInt(id));
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller aggrement"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateSellerAggrementDto: UpdateSellerAggrementDto) {
    try {
      const keywords = await this.sellerAggrementService.update(+id, updateSellerAggrementDto);
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller aggrement updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const keywords = await this.sellerAggrementService.remove(BigInt(id));
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller aggrement deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
