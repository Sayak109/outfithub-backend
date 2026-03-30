import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Response } from 'express';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { GetOrderDto } from './dto/get-order-dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AccountStatusGuard } from '@/auth/guard/status.guard';
import { AccountStatus } from '@/auth/decorators/status.decorator';
import { Account } from '@/auth/enums/account.enum';
import { GetReturnOrderDto } from './dto/get-return-order.dto';


@UseGuards(JwtGuard)
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get('status')
  async GetStatus(@Res() res: Response) {
    try {
      const status = await this.ordersService.getStatus();
      let result = JSON.stringify(status, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All order status."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') order_id: string) {
    try {
      const order = await this.ordersService.findOne(BigInt(order_id));
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order details."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Put()
  async findAll(@Res() res: Response, @Body() dto: GetOrderDto) {
    try {
      const order = await this.ordersService.findAll(dto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto, @GetUser("email") user_email: string) {
    try {
      const order = await this.ordersService.update(BigInt(id), updateOrderDto, user_email);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order status updated successfully."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }




  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator, Role.Seller)
  @Put("get-return-orders")
  async getAllReturnOrders(@Res() res: Response, @GetUser("id") id: string, @Body() dto: GetReturnOrderDto) {
    try {
      const order = await this.ordersService.getAllReturnOrder(BigInt(id), dto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Return Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("update-return-orders")
  async updateReturnOrderAdmin(@Res() res: Response, @Body() body: any) {
    // updateReturnOrder
    try {
      const orderUpdate = await this.ordersService.updateReturnOrder(BigInt(body.id), Number(body.status_id), body.note);
      let result = JSON.stringify(orderUpdate, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Return order updated successfully"));
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("get-seller-return-percentage")
  async getAllReturnPercentageSellerWise(@Res() res: Response, @Body() dto: GetOrderDto) {
    try {
      const result = await this.ordersService.getAllSellerOrderRerturnPercentage(dto);

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(result, "Return Order list."));
    } catch (error) {
      console.log(error, "getAllReturnPercentageSellerWise error");
      throw new BadRequestException(error.response);
    }
  }








  ///////////// Seller order management /////////////////

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Seller)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Put("seller")
  async findAllSellerOrders(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetOrderDto) {
    try {
      const order = await this.ordersService.findAllSellerOrders(BigInt(user_id), dto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }
  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Seller)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Get("seller/:id")
  async findAllSellerOrdersById(@Res() res: Response, @Param('id') order_item_id: string, @GetUser("id") user_id: string, @Body() dto: GetOrderDto) {
    try {
      const order = await this.ordersService.findAllSellerOrdersById(BigInt(user_id), BigInt(order_item_id));
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Seller)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Get("seller/cancel/:id")
  async CancelOrderCharges(@Res() res: Response, @Param('id') order_item_id: string,
    @GetUser("id") user_id: string,) {
    try {
      const order = await this.ordersService.CancelOrderCharges(BigInt(user_id), BigInt(order_item_id));
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order cancellation charges."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Seller)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Post("seller/cancel/:id")
  async SellerOrderCancel(@Res() res: Response, @Param('id') order_item_id: string,
    @GetUser("id") user_id: string, @Body() body: any,) {
    try {
      const order = await this.ordersService.CancelOrder(BigInt(user_id), BigInt(order_item_id), body.note);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order has been cancelled."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @UseGuards(RolesGuard, AccountStatusGuard)
  @Roles(Role.Seller)
  @AccountStatus(Account.Active, Account.Reactivated)
  @Put("seller/return/:id")
  async SellerOrderRetrurn(@Res() res: Response, @Param('id') order_item_id: string, @GetUser("id") user_id: string) {
    try {
      const returnResult = await this.ordersService.returnConfirmation(BigInt(user_id), BigInt(order_item_id));
      // return
      let result = JSON.stringify(returnResult, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order has been returned successfully."));
    } catch (error: any) {
      console.log(error)
      throw new BadRequestException(error.response);
    }
  }
}


