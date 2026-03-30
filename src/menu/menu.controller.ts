import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Role } from '@/auth/enums/role.enum';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { Request, Response } from 'express';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { CreateMenuTypeDto } from './dto/create-menutype.dto';
import { GetAllMenuTypeDto } from './dto/get-all-menu-type.dto';
import { UpdateMenuTypeDto } from './dto/update-menutype.dto';



@Controller({ path: 'menu', version: '1' })
export class MenuController {
  constructor(private readonly menuService: MenuService, private prisma: PrismaService) { }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post()
  async create(@Res() res: Response, @Body() createMenuDto: CreateMenuDto,
    @Req() req: Request, @GetUser("email") user_email: string,) {
    try {
      const menu = await this.menuService.create(createMenuDto);

      let result = JSON.stringify(menu, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `A Menu created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Menu created successfully"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const menuType = await this.menuService.findAll();
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Menus"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Body() updateMenuDto: UpdateMenuDto,
    @Req() req: Request, @GetUser("email") user_email: string, @Param('id') id: string,) {
    try {
      const menu_id = id === "undefined" ? undefined : BigInt(id);
      const menu = await this.menuService.update(updateMenuDto, menu_id);

      let result = JSON.stringify(menu, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `A Menu created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Menu created successfully"));
    } catch (error) {
      console.log("error", error);
      throw new BadRequestException(error.response);
    }
  }


  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const menuType = await this.menuService.remove(BigInt(id),);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Menus"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  ///////////////////////////////////////////////////////

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post("type")
  async createMenuType(@Res() res: Response, @Body() createMenuTypeDto: CreateMenuTypeDto,
    @Req() req: Request, @GetUser("email") user_email: string,) {
    try {
      const menuTypes = await this.menuService.createMenuType(createMenuTypeDto);

      let result = JSON.stringify(menuTypes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Menu Type "${menuTypes.name}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Menu Type created successfully"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("type")
  async findAllMenuType(@Res() res: Response, @Body() getAllMenuTypeDto: GetAllMenuTypeDto) {
    try {
      const menuType = await this.menuService.findAllMenuType(getAllMenuTypeDto);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All menu types"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get('type/:id')
  async findOneMenuType(@Res() res: Response, @Param('id') menu_type_id: string) {
    try {
      const menuType = await this.menuService.findOneMenuType(BigInt(menu_type_id));
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Menu type"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get('type-by-slug/:slug')
  async findOneMenuTypeBySlug(@Res() res: Response, @Param('slug') menu_type: string) {
    try {
      const menuType = await this.menuService.findOneMenuTypeBySlug(menu_type);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Menu type"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch('type/:id')
  async updateType(@Res() res: Response, @Param('id') id: string, @Body() updateMenuTypeDto: UpdateMenuTypeDto) {
    try {
      const menuType = await this.menuService.updateType(BigInt(id), updateMenuTypeDto);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Menus"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Delete('type/:id')
  async removeType(@Res() res: Response, @Param('id') id: string) {
    try {
      const menuType = await this.menuService.removeType(BigInt(id),);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Menus"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
