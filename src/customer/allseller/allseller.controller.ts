import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { AllsellerService } from './allseller.service';
import { CreateAllsellerDto } from './dto/create-allseller.dto';
import { UpdateAllsellerDto } from './dto/update-allseller.dto';
import { Response } from 'express';
import { GetUsersDto } from './dto/get-user.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { PaginationDto } from '../product/dto/pagination.dto';

@Controller({ path: "", version: "1" })
export class AllsellerController {
  constructor(private readonly allsellerService: AllsellerService) { }

  @Put("allsellers")
  async findAll(@Res() res: Response) {
    try {
      const user = await this.allsellerService.findAll();

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("seller/products/:id")
  async findAllSellerProduct(@Param('id') id: string, @Res() res: Response, @Body() paginationDto: PaginationDto) {
    try {
      const user = await this.allsellerService.findAllSellerProduct(BigInt(id), paginationDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All seller products."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
