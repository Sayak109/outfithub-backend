import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, HttpStatus, UseGuards, UseInterceptors, UploadedFile, Put, UploadedFiles } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { PreferenceDto } from './dto/notification-preference.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendNotificationToAllDto } from './dto/send-notification-to-all.dto';
import { isValidImage, upload } from '@/common/config/multer.config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { post } from 'node_modules/axios/index.cjs';

@Controller({ path: 'notification', version: '1' })
@UseGuards(JwtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post("preference")
  async notificationPreference(@Res() res: Response, @GetUser('id') user_id: bigint, @Body() dto: PreferenceDto) {
    try {
      const preference = await this.notificationService.notificationPreferenceService(user_id, dto);
      let result = JSON.stringify(preference, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Notification preference updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get("preference")
  async getnotificationPreference(@Res() res: Response, @GetUser('id') user_id: bigint) {
    try {
      const preference = await this.notificationService.getNotificationPreferenceService(user_id);
      let result = JSON.stringify(preference, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Notification preferences"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get("in-app")
  async findAll(@Res() res: Response, @GetUser('id') user_id: bigint) {
    try {
      const preference = await this.notificationService.findAll(user_id);
      let result = JSON.stringify(preference, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Notification preferences"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Post('add-fcm')
  async AddFCMToken(@Res() res: Response, @GetUser('id') user_id: bigint, @Body() body: any) {
    try {
      const { token } = body;
      const notification = await this.notificationService.AddFCMToken(BigInt(user_id), token);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FCM token added."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Post('send')
  async sendNotification(@Res() res: Response, @Body() sendNotificationDto: SendNotificationDto,
  ) {
    try {
      const notification = await this.notificationService.sendNotification(sendNotificationDto);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Send firbase notification"));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Post('order-place/:id')
  async sendOrderPlaceNotification(@Res() res: Response, @Param('id') order_id: string, @GetUser('id') user_id: bigint,) {
    try {
      const notification = await this.notificationService.sendOrderPlaceNotification(BigInt(order_id), BigInt(user_id));
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Send order place firbase notification"));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Post('push/send-all')
  @UseInterceptors(FileInterceptor('image', upload))
  async sendNotificationToAll(@Res() res: Response, @Body() notificationDto: SendNotificationToAllDto,
    @UploadedFile() file: MulterFile,
  ) {
    try {
      let targetPath = '';
      if (file?.path) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);

        if (!isValid) {
          throw new BadRequestException(`Invalid image file: ${file?.originalname}`);
        }

        const targetDir = path.join(
          process.env.IMAGE_PATH!,
          process.env.IMAGE_TEMP_PATH!,
          process.env.NOTIFICATION_IMAGE_PATH!,
        );
        targetPath = path.join(targetDir, file?.filename);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const files = fs.readdirSync(targetDir);
          for (const f of files) {
            if (f !== file?.filename) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);
      }
      const notification = await this.notificationService.sendNotificationToAll(notificationDto, {
        filename: file?.filename,
        path: targetPath,
      });

      const imageFilename = notification.image.src;
      if (imageFilename) {
        const tempImagePath = path.join(
          process.env.IMAGE_PATH!,
          process.env.IMAGE_TEMP_PATH!,
          process.env.NOTIFICATION_IMAGE_PATH!,
          imageFilename!);

        if (fs.existsSync(tempImagePath)) {
          const finalDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.NOTIFICATION_IMAGE_PATH!,
            notification.notification.id.toString()
          );
          const finalImagePath = path.join(finalDir, imageFilename!);

          if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
          }
          fs.renameSync(tempImagePath, finalImagePath);
        }
      }
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Send firbase notification"));
    } catch (error) {
      console.log("error", error);

      throw new BadRequestException(error.response);
    }
  }


  @Post('email/send-all')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 },
  ], upload))
  async sendEmailNotificationToAll(
    @Res() res: Response,
    @UploadedFiles() files: { images?: MulterFile[] },
    @Body() notificationDto: SendNotificationToAllDto,
  ) {
    try {
      const notification = await this.notificationService.sendEmailNotificationToAll(notificationDto);

      const savedImages: any = [];
      const targetDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.NOTIFICATION_IMAGE_PATH!,
        notification.id.toString()
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

        const updatedProduct = await this.notificationService.updateImage(BigInt(notification.id), {
          filename: file.filename,
          path: targetPath,
        });

        const result = JSON.stringify(updatedProduct, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        );
        savedImages.push(JSON.parse(result));
      }

      const sendEmail = await this.notificationService.sendEmail(notification.id, notificationDto);
      return res.status(HttpStatus.OK).json(new ApiResponse("Send email notification"));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Put('list')
  async notificationList(@Res() res: Response, @Body() dto: PaginationDto) {
    try {
      const notification = await this.notificationService.notificationList(dto);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All notification list"));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
