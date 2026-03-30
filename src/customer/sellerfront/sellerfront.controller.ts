import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { SellerfrontService } from './sellerfront.service';
import { CreateSellerfrontDto } from './dto/create-sellerfront.dto';
import { UpdateSellerfrontDto } from './dto/update-sellerfront.dto';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';

@Controller({ version: '1' })
export class SellerfrontController {
  constructor(private readonly sellerfrontService: SellerfrontService) { }

  @Get("seller-meta/:storelink")
  async getMetaForSellerFront(@Res() res: Response, @Param('storelink') storelink: string) {

    try {
      const meta = await this.sellerfrontService.getMetaForSellerFront(storelink);
      const result = JSON.stringify(meta, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(meta, "Meta data for seller front"));
    } catch (error: any) {
      if (error.response) {
        throw new BadRequestException(error.response);
      } else {
        throw new BadRequestException(error.message);
      }
    }
  }

}
