import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, BadRequestException, HttpStatus, UseInterceptors, UploadedFiles, Put, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { isValidImage, upload } from '@/common/config/multer.config';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { GetLivesDto } from '@/live/dto/get-lives.dto';

@UseGuards(JwtGuard)
@Controller({ path: 'feedback', version: '1' })
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 }
  ], upload))
  async create(@Res() res: Response, @GetUser("id") user_id: string, @Body() createFeedbackDto: CreateFeedbackDto,
    @UploadedFiles() files: { images?: MulterFile[] },
  ) {
    try {
      console.log("createFeedbackDto", createFeedbackDto);
      const feedback = await this.feedbackService.create(BigInt(user_id), createFeedbackDto);
      let result = JSON.stringify(feedback, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const targetDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.CUSTOMER_FEEDBACK_IMAGE_PATH!,
        feedback.id.toString(),
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

        const FeedbackImage = await this.feedbackService.FeedbackImage(BigInt(feedback.id), {
          filename: file?.filename,
          path: targetPath,
        });
      }
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Feedback posted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("product/:id")
  async findAllReview(@Res() res: Response, @Param('id') product_id: string, @Body() feedbackDto: GetLivesDto) {
    try {
      const reels = await this.feedbackService.findAllReview(BigInt(product_id), feedbackDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All customer feedbacks."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  ////////////Admin Work///////////////
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put()
  async findAll(@Res() res: Response, @Body() feedbackDto: GetLivesDto) {
    try {
      const reels = await this.feedbackService.findAll(feedbackDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All customer feedbacks."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }


  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get(":id")
  async GetOne(@Res() res: Response, @Param('id') feedback_id: string,) {
    try {
      const reels = await this.feedbackService.findOne(BigInt(feedback_id));

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "customer feedback."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch(':id')
  async update(@Res() res: Response, @Param('id') feedback_id: string, @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const reels = await this.feedbackService.update(BigInt(feedback_id), updateFeedbackDto, req, user_email);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Feedback updated successfully."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') feedback_id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const reels = await this.feedbackService.remove(BigInt(feedback_id), req, user_email);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Feedback deleted successfully."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }
}
