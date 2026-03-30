import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Res, BadRequestException, UseInterceptors, UploadedFile, Req, Put } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { GetAllCategoryDto } from './dto/get-all-category.dto';
import { GetCategoryDto } from './dto/get-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { isValidImage, upload } from '@/common/config/multer.config';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller({ path: 'category', version: '1' })

export class CategoryController {
  constructor(private readonly categoryService: CategoryService, private prisma: PrismaService) { }

  @Roles(Role.Admin, Role.Operator)
  @Post()
  @UseInterceptors(FileInterceptor('image', upload))
  async create(@Res() res: Response, @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: MulterFile, @Req() req: Request, @GetUser("email") user_email: string) {
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
          "category"
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
      const category = await this.categoryService.create(createCategoryDto, {
        filename: file?.filename,
        path: targetPath,
      });
      const imageFilename = category.image;
      if (imageFilename) {
        const tempImagePath = path.join(process.env.IMAGE_PATH!, process.env.IMAGE_TEMP_PATH!, "category", imageFilename!);

        if (fs.existsSync(tempImagePath)) {
          const finalDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.PRODUCT_CATEGORY_IMAGE_PATH!,
            category.id.toString()
          );
          const finalImagePath = path.join(finalDir, imageFilename!);

          if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
          }
          fs.renameSync(tempImagePath, finalImagePath);
        }
      }
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Category "${category.name}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @Body() getAllCategoryDto: GetAllCategoryDto) {
    try {
      const category = await this.categoryService.findAll(getAllCategoryDto);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Category"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put(':id')
  async findOne(@Res() res: Response, @Param('id') id: string, @Body() getCategoryDto: GetCategoryDto) {
    try {
      const category = await this.categoryService.findOne(BigInt(id), getCategoryDto);;
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category found successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Roles(Role.Admin, Role.Operator)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', upload))
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: MulterFile, @Req() req: Request, @GetUser("email") user_email: string) {
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
          process.env.PRODUCT_CATEGORY_IMAGE_PATH!,
          id.toString(),
        );
        targetPath = path.join(targetDir, file?.originalname);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const files = fs.readdirSync(targetDir);
          for (const f of files) {
            if (f !== file?.originalname) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);
      }
      const category = await this.categoryService.update(BigInt(id), updateCategoryDto, {
        filename: file?.originalname,
        path: targetPath,
      });
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Category "${category.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw error;
    }
  }

  @Roles(Role.Admin, Role.Operator)
  @Delete('image/:id')
  async removeImage(@Res() res: Response, @Param('id') category_id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const category = await this.categoryService.removeImage(BigInt(category_id));

      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Category image of "${category.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category image deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Roles(Role.Admin, Role.Operator)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const category = await this.categoryService.remove(BigInt(id));

      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Category "${category.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
