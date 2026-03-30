import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, UseGuards, Put } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Response } from 'express';
import { Role } from '@/auth/enums/role.enum';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';

@Controller({ path: 'account', version: '1' })
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Post("delete")
  async deleteAccount(@Res() res: Response, @Body() accountDto: AccountDto) {
    try {
      const category = await this.accountService.deleteAccount(accountDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Your account has been deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Post("download-request")
  async downloadRequest(@Res() res: Response, @Body() accountDto: AccountDto) {
    try {
      const category = await this.accountService.downloadRequest(accountDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Account downlaod request send successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }




  /////////// Admin ///////////


  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("deleted-users")
  async findAllDelUsers(@Res() res: Response, @Body() paginationDto: PaginationDto) {
    try {
      const category = await this.accountService.findAllDelUsers(paginationDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All  downlaod requests."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("download-request")
  async findAll(@Res() res: Response, @Body() paginationDto: PaginationDto) {
    try {
      const category = await this.accountService.findAll(paginationDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All  downlaod requests."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch("download-request/:id")
  async updateDownloadRequest(@Res() res: Response, @Param('id') request_id: string, @Body() paginationDto: PaginationDto) {
    try {
      const category = await this.accountService.updateDownloadRequest(BigInt(request_id), paginationDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Downlaod requests status updated."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(+id);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(+id);
  }
}
