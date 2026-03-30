import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Headers, Req, Put, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentDto } from './dto/payment-dto';
import { GetOrderDto } from '@/orders/dto/get-order-dto';
import { isValidImage, upload } from '@/common/config/multer.config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@UseGuards(JwtGuard)
@Controller({ path: 'customer', version: '1' })
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post("checkout")
  async checkout(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: CheckoutDto) {
    try {
      const checkout = await this.orderService.checkout(BigInt(user_id), dto)
      let result = JSON.stringify(checkout, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Checkout"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post("order")
  async create(@Res() res: Response, @GetUser("id") user_id: string, @Body() createOrderDto: CreateOrderDto) {
    try {
      const order = await this.orderService.create(BigInt(user_id), createOrderDto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post("payment/:id")
  async payment(@Param('id') order_id: string, @Res() res: Response, @GetUser("id") user_id: string, @Body() paymentDto: PaymentDto) {
    try {
      const order = await this.orderService.payment(BigInt(order_id), BigInt(user_id), paymentDto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order payments."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Get('order/:id')
  async findOne(@Res() res: Response, @Param('id') order_id: string, @GetUser("id") user_id: string,) {
    try {
      const order = await this.orderService.orderData(BigInt(order_id), BigInt(user_id));
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order details."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Put("order")
  async findAll(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetOrderDto) {
    try {
      const order = await this.orderService.findAll(BigInt(user_id), dto);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Get("cancel-order/:id")
  async GetCancelOrder(@Res() res: Response, @GetUser("id") user_id: string, @Param('id') order_item_id: string, @Body() body: any) {
    try {
      const order = await this.orderService.GetCancelOrder(BigInt(user_id), BigInt(order_item_id));
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order cancelled."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Post("cancel-order/:id")
  async CancelOrder(@Res() res: Response, @GetUser("id") user_id: string,
    @Param('id') order_item_id: string, @Body() body: any,) {
    try {
      const order = await this.orderService.CancelOrder(BigInt(user_id), BigInt(order_item_id), body.note);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order has been cancelled."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Post("return-order/:id")
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 }
  ], upload))
  async ReturnOrder(@Res() res: Response, @GetUser("id") user_id: string,
    @UploadedFiles() files: { images?: MulterFile[] },
    @Param('id') order_item_id: string, @Body() body: any) {
    try {
      const order = await this.orderService.ReturnOrder(BigInt(user_id), BigInt(order_item_id), body.note);
      let result = JSON.stringify(order, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const targetDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.ORDER_RETURN_IMAGE_PATH!,
        order_item_id.toString(),
      );
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const file of files.images || []) {
        if (!file?.path) continue;

        await new Promise((resolve) => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);
        if (!isValid) {
          throw new BadRequestException(`Invalid image file: ${file.originalname}`);
        }

        const targetPath = path.join(targetDir, file.filename);
        fs.renameSync(file.path, targetPath);

        const ReturnOrderImage = await this.orderService.ReturnOrderImage(BigInt(order.orderCancel.id), {
          filename: file?.filename,
          path: targetPath,
        });

        // const result = JSON.stringify(order, (key, value) =>
        //   typeof value === 'bigint' ? value.toString() : value,
        // );
        // return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order returned."));
      }

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order returned."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Post('test-encryption')
  async Test(@Res() res: Response, @Body() body: any) {
    try {
      const test = await this.orderService.Test(body);
      let result = JSON.stringify(test, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('order/pdf/:id')
  async update(@Res() res: Response, @Param('id') order_item_id: string, @GetUser("id") user_id: string,) {
    try {
      const pdfBuffer = await this.orderService.createPDF(BigInt(order_item_id), BigInt(user_id));

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${order_item_id}.pdf`,
        "Content-Length": pdfBuffer.length,
      });

      return res.end(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }
  @Post('order/send/:id')
  async sendOrderUpdateEmail(@Res() res: Response, @Param('id') order_item_id: string, @GetUser("id") user_id: string,) {
    try {
      const test = await this.orderService.sendOrderUpdateEmail(BigInt(order_item_id), BigInt(user_id));
      let result = JSON.stringify(test, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Order list."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.orderService.remove(+id);
  // }
}
