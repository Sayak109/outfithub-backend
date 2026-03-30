import { Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Controller, Put } from '@nestjs/common';
import { DynamicPagesService } from './dynamic-pages.service';
import { CreateDynamicPageDto } from './dto/create-dynamic-page.dto';
import { UpdateDynamicPageDto } from './dto/update-dynamic-page.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Request, Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { GetDynamicPageDTO } from './dto/get-dynamic-page.dto';


@Controller({ path: 'page', version: '1' })
export class DynamicPagesController {
  constructor(private readonly dynamicPagesService: DynamicPagesService, private prisma: PrismaService) { }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post()
  async create(@Res() res: Response, @Req() req: Request, @GetUser("email") user_email: string, @Body() createDynamicPageDto: CreateDynamicPageDto) {
    try {
      const page = await this.dynamicPagesService.create(createDynamicPageDto);

      let result = JSON.stringify(page, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Page "${page.data.title}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Page added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put()
  async getAllDynamicPages(@Res() res: Response, @Body() dto: GetDynamicPageDTO) {
    try {
      const dynamicPages = await this.dynamicPagesService.getAllDynamicPages(dto);

      let result = JSON.stringify(dynamicPages, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Pages."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };


  @Get(':slug')
  async getDynamicPage(@Res() res: Response, @Param('slug') id: string) {
    try {
      const dynamicPage = await this.dynamicPagesService.getDynamicPage(id);

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Page found successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch(':id')
  async updateDynamicPage(@Res() res: Response, @Param('id') id: string, @Body() updateDynamicPageDto: UpdateDynamicPageDto) {
    try {
      const dynamicPage = await this.dynamicPagesService.updateDynamicPage(BigInt(id), updateDynamicPageDto);

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Page updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };


  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Delete(':id')
  async removeDynamicPage(@Res() res: Response, @Param('id') id: string) {
    try {
      const dynamicPage = await this.dynamicPagesService.removeDynamicPage(BigInt(id));

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Page deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };
}
