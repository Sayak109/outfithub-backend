import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, Req, HttpStatus, BadRequestException } from '@nestjs/common';
import { LiveService } from './live.service';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { Response } from 'express';
import { PaginationDto } from '../product/dto/pagination.dto';
import { ApiResponse } from '@/common/dto/response.dto';

@Controller({ path: 'customer/live', version: '1' })
export class LiveController {
  constructor(private readonly liveService: LiveService) { }

  @Post()
  create(@Body() createLiveDto: CreateLiveDto) {
    return this.liveService.create(createLiveDto);
  }


  @Put()
  async findAllReels(
    @Res() res: Response,
    @Body() dto: PaginationDto,
  ) {
    try {
      const reels = await this.liveService.findAll(dto);
      const result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), 'All lives.'));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.response || error.message);
    }
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Res() res: Response,) {
    try {
      const reels = await this.liveService.findOne(slug);
      const result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), 'live'));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.response || error.message);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLiveDto: UpdateLiveDto) {
    return this.liveService.update(+id, updateLiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liveService.remove(+id);
  }
}
