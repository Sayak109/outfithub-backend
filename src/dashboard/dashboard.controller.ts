import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { GraphDto } from './dto/users-graph.dto';

@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Post()
  async create(@Res() res: Response, @Body() createDashboardDto: CreateDashboardDto) {
    try {
      const dashboard = await this.dashboardService.create(createDashboardDto);

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get("total")
  async findTotal(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.findTotal();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get("top")
  async findTop(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.findTop();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get("product-list")
  async productList(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.productList();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get("recent-orders")
  async recentOrders(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.recentOrders();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard recent orders."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Put("users-graph")
  async usersGraph(@Res() res: Response, @Body() usersGraphDto: GraphDto) {
    try {
      const dashboard = await this.dashboardService.usersGraph(usersGraphDto);

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard onboard users graph."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get("orders-graph")
  async ordersGraph(@Res() res: Response, @Body() usersGraphDto: GraphDto) {
    try {
      const dashboard = await this.dashboardService.ordersGraph(usersGraphDto);

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard onboard users graph."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDashboardDto: UpdateDashboardDto) {
    return this.dashboardService.update(+id, updateDashboardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(+id);
  }
}
