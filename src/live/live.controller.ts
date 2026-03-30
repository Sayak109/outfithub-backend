import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Put } from '@nestjs/common';
import { LiveService } from './live.service';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { Approval } from '@/auth/enums/approval.enum';
import { AccountStatus, ApprovalStatus } from '@/auth/decorators/status.decorator';
import { Account } from '@/auth/enums/account.enum';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { GetLivesDto } from './dto/get-lives.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { AccountStatusGuard, ApprovalStatusGuard } from '@/auth/guard/status.guard';

@UseGuards(JwtGuard, AccountStatusGuard, ApprovalStatusGuard)
@AccountStatus(Account.Active, Account.Reactivated)
@Controller({ path: 'live', version: '1' })
export class LiveController {
  constructor(private readonly liveService: LiveService) { }

  @Post()
  async create(@Res() res: Response, @Body() createLiveDto: CreateLiveDto, @GetUser("id") user_id: bigint) {
    try {
      const lives = await this.liveService.create(user_id, createLiveDto);

      let result = JSON.stringify(lives, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Lives added successfully."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @GetUser("id") user_id: bigint, @Body() getLivesDto: GetLivesDto) {
    try {
      const reels = await this.liveService.findAllBySeller(BigInt(user_id), getLivesDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All lives"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get(':id')
  async findOneBySeller(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: bigint) {
    try {
      const reels = await this.liveService.findOneBySeller(BigInt(id), user_id);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Live"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: bigint, @Body() updateLiveDto: UpdateLiveDto) {
    try {
      const reels = await this.liveService.update(BigInt(id), BigInt(user_id), updateLiveDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Live updated."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liveService.remove(+id);
  }


  // For admin part

  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("seller")
  async findAllReels(@Res() res: Response, @Body() getLivesDto: GetLivesDto) {
    try {
      const reels = await this.liveService.findAll(getLivesDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All lives"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get('seller/:id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const reels = await this.liveService.findOne(BigInt(id));

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All lives"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }
}
