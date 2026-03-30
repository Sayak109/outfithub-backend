import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Put } from '@nestjs/common';
import { BlockedKeywordsService } from './blocked-keywords.service';
import { CreateBlockedKeywordDto } from './dto/create-blocked-keyword.dto';
import { UpdateBlockedKeywordDto } from './dto/update-blocked-keyword.dto';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { GetKeywordsDto } from './dto/get-keywords.dto';



@Controller({ path: 'blocked-keywords', version: '1' })
export class BlockedKeywordsController {
  constructor(private readonly blockedKeywordsService: BlockedKeywordsService) { }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post()
  async blockKeywords(@Res() res: Response, @Body() Dto: CreateBlockedKeywordDto) {
    try {
      const keywords = await this.blockedKeywordsService.create(Dto);
      let result = JSON.stringify(keywords, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Blocked keywords added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @Body() getKeywordsDto: GetKeywordsDto) {
    try {
      const user = await this.blockedKeywordsService.findAll(getKeywordsDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blockedKeywordsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlockedKeywordDto: UpdateBlockedKeywordDto) {
    return this.blockedKeywordsService.update(+id, updateBlockedKeywordDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post("delete")
  async remove(@Res() res: Response, @Body() updateBlockedKeywordDto: UpdateBlockedKeywordDto) {
    try {
      const user = await this.blockedKeywordsService.remove(updateBlockedKeywordDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
