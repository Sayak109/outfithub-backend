import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Req, Put } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { GetProductDto } from './dto/get-product.dto';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { isValidImage, upload } from '@/common/config/multer.config';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';


@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator)
@Controller({ path: 'product', version: '1' })
export class ProductController {
  constructor(private readonly productService: ProductService, private prisma: PrismaService) { }

  @Post()
  async create(@Res() res: Response, @Body() createProductDto: CreateProductDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const products = await this.productService.create(createProductDto);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Product "${products.name}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @Body() getProductDto: GetProductDto) {
    try {
      const products = await this.productService.findAll(getProductDto);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Products"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const products = await this.productService.findOne(BigInt(id));
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const products = await this.productService.update(BigInt(id), updateProductDto);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Product "${products.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('status/:id')
  async updateStatus(@Res() res: Response, @Param('id') id: string, @Body() updateProductStatusDto: UpdateProductStatusDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const products = await this.productService.updateStatus(BigInt(id), updateProductStatusDto);
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Product status of "${products.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product status updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  // @Patch('image/:id')
  // @UseInterceptors(FilesInterceptor('images', 10, upload))
  // async updateImages(
  //   @Res() res: Response,
  //   @Param('id') product_id: string,
  //   @UploadedFiles() files: MulterFile[],
  //   @Req() req: Request, @GetUser("email") user_email: string
  // ) {
  //   try {
  //     const savedImages: any = [];

  //     const targetDir = path.join(
  //       process.env.IMAGE_PATH!,
  //       process.env.PRODUCT_IMAGE_PATH!,
  //       product_id.toString(),
  //     );

  //     if (!fs.existsSync(targetDir)) {
  //       fs.mkdirSync(targetDir, { recursive: true });
  //     }

  //     for (const file of files) {
  //       if (!file?.path) continue;

  //       await new Promise((resolve) => setTimeout(resolve, 100));

  //       const isValid = await isValidImage(file.path);
  //       if (!isValid) {
  //         throw new BadRequestException(`Invalid image file: ${file?.originalname}`);
  //       }

  //       const ext = path.extname(file.originalname);
  //       const baseName = path.basename(file.originalname, ext);
  //       let uniqueName = file.originalname;
  //       let counter = 1;

  //       while (fs.existsSync(path.join(targetDir, uniqueName))) {
  //         uniqueName = `${baseName}-${counter}${ext}`;
  //         counter++;
  //       }

  //       const targetPath = path.join(targetDir, uniqueName);
  //       fs.renameSync(file.path, targetPath);

  //       const updatedProduct = await this.productService.updateImage(BigInt(product_id), {
  //         filename: uniqueName,
  //         path: targetPath,
  //       }, counter);

  //       const result = JSON.stringify(updatedProduct, (key, value) =>
  //         typeof value === 'bigint' ? value.toString() : value,
  //       );
  //       savedImages.push(JSON.parse(result));
  //     }
  //     await this.prisma.adminActivityLog.create({
  //       data: {
  //         action: 'UPDATE',
  //         description: `Product image of "ID: ${product_id}" updated by "${user_email}".`,
  //         ip: req.ip,
  //         userAgent: req.headers['user-agent'] || '',
  //       },
  //     });
  //     return res
  //       .status(HttpStatus.OK)
  //       .json(new ApiResponse(savedImages, 'Product images uploaded successfully.'));

  //   } catch (error: any) {
  //     console.log('error: ', error);
  //     throw new BadRequestException(error?.response || 'Image upload failed');
  //   }
  // }

  @Patch('image/:id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 },
    { name: 'cover_image', maxCount: 1 },
  ], upload))
  async updateImages(
    @Res() res: Response,
    @Param('id') product_id: string,
    @UploadedFiles() files: { images?: MulterFile[], cover_image?: MulterFile[] },
    @Req() req: Request,
    @GetUser("email") user_email: string
  ) {
    try {
      const savedImages: any = [];

      const targetDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.PRODUCT_IMAGE_PATH!,
        product_id.toString(),
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

        const updatedProduct = await this.productService.updateImage(BigInt(product_id), {
          filename: file.filename,
          path: targetPath,
        });

        const result = JSON.stringify(updatedProduct, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        );
        savedImages.push(JSON.parse(result));
      }

      if (files.cover_image && files.cover_image[0]) {
        const file = files.cover_image[0];
        const isValid = await isValidImage(file.path);
        if (!isValid) {
          throw new BadRequestException(`Invalid cover image file: ${file.originalname}`);
        }

        const targetPath = path.join(targetDir, file.filename);
        fs.renameSync(file.path, targetPath);

        await this.productService.updateCoverImage(BigInt(product_id), {
          filename: file.filename,
          path: targetPath,
        });
      }
      const product = await this.prisma.product.findUnique({
        where: { id: BigInt(product_id) }
      })
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Product image of "${product?.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(savedImages, 'Product images uploaded successfully.'));

    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.response || 'Image upload failed');
    }
  }


  @Delete('image/:id')
  async removeImage(@Res() res: Response, @Param('id') image_id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const productData = await this.prisma.productImage.findUnique({
        where: { id: BigInt(image_id) }, select: {
          product: {
            select: {
              name: true,
            }
          }
        }
      })
      const product = await this.productService.removeImage(BigInt(image_id));

      let result = JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Product image of "${productData?.product.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product image deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') product_id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const product = await this.productService.remove(BigInt(product_id));

      let result = JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Product "${product.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
