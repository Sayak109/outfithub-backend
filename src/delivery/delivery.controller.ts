import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, Res, HttpStatus } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { CreateShipRocketOrderDto } from './dto/create-shiprocket-order.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Response } from 'express';

@UseGuards(JwtGuard)
@Controller({ path: 'delivery', version: '1' })
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  // @Get("login")
  // async loginToShiprocket() {
  //   return this.deliveryService.login();
  // }


  @Post("shiprocket-order")
  async createShiprocketOrder(@GetUser("id") userId: bigint, @Body() orderCreateDto: CreateShipRocketOrderDto, @Res() res: Response) {
    try {
      const response = await this.deliveryService.createShiprocketOrder(userId, orderCreateDto);;
      let result = JSON.stringify(response, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
    // return this.deliveryService.createShiprocketOrder(userId, orderCreateDto);
  }


  @Get("order-tracking/:orderItemsId")
  async getorderTrackingDetails(@Param("orderItemsId") orderItemsId: bigint, @Res() res: Response) {
    try {
      const response = await this.deliveryService.getorderTrackingDetails(orderItemsId);
      let result = JSON.stringify(response, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
