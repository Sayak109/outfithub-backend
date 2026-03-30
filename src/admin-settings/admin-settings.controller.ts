import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { CreateAdminSettingDto } from './dto/create-admin-setting.dto';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUser } from '@/auth/decorators/get-user.decorator';


@Controller({ path: 'admin-settings', version: '1' })
export class AdminSettingsController {

  constructor(private readonly adminSettingsService: AdminSettingsService, private prisma: PrismaService) { }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post()
  async create(@Res() res: Response, @Body() createAdminSettingDto: CreateAdminSettingDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const settings = await this.adminSettingsService.create(createAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Settings "${settings.title}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Settings created successfully"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response) {
    try {
      const settings = await this.adminSettingsService.findAll();
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Settings"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminSettingsService.findOne(+id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAdminSettingDto: UpdateAdminSettingDto,
    @Req() req: Request, @Res() res: Response, @GetUser("email") user_email: string) {
    try {
      const settings = await this.adminSettingsService.update(BigInt(id), updateAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Settings "${settings.title}" update by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Settings updated successfully"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminSettingsService.remove(+id);
  }
}
