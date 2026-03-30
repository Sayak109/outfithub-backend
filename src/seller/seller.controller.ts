import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Res, BadRequestException, UseGuards, UseInterceptors, UploadedFile, Req, UploadedFiles, Put } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { isValidImage, upload } from '@/common/config/multer.config';
import { AccountStatus, ApprovalStatus } from '@/auth/decorators/status.decorator';
import { Account } from '@/auth/enums/account.enum';
import { Approval } from '@/auth/enums/approval.enum';
import { AccountStatusGuard, ApprovalStatusGuard } from '@/auth/guard/status.guard';
import { SociallinksDto } from './dto/social-links.dto';
import { PreferenceDto } from '../notification/dto/notification-preference.dto';
import { decryptData, encryptData } from '@/common/helper/common.helper';
import { StoreFrontDto } from './dto/store-front.dto';
import { SellerPickupLocationDto } from './dto/seller-pickup-location.dto';

@UseGuards(JwtGuard, RolesGuard, AccountStatusGuard, ApprovalStatusGuard)
@Roles(Role.Seller, Role.Buyer)
@AccountStatus(Account.Active, Account.Reactivated)
@Controller({ path: 'seller', version: '1' })
export class SellerController {
  constructor(private readonly sellerService: SellerService) { }

  @Post("profile")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
        { name: 'id_proof', maxCount: 1 },
      ],
      upload,
    ),
  )
  async create(
    @Res() res: Response,
    @GetUser('id') user_id: bigint,
    @Body() createSellerDto: CreateSellerDto,
    @UploadedFiles() files: { profile?: MulterFile[]; logo?: MulterFile[]; id_proof?: MulterFile[] }
  ) {
    try {
      const fileMap = {
        profile: files.profile?.[0],
        logo: files.logo?.[0],
        id_proof: files.id_proof?.[0],
      };
      const processedFiles: { [key: string]: { filename: string; path: string } } = {};

      for (const [key, file] of Object.entries(fileMap)) {
        if (!file) continue;

        await new Promise((resolve) => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);

        if (!isValid) {
          throw new BadRequestException(`Invalid image file: ${file?.originalname}`)
        }

        let targetDir = '';
        if (key === 'profile') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_PROFILE_IMAGE_PATH!,
            user_id.toString(),
          );
        } else if (key === 'logo') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_BUSINESS_IMAGE_PATH!,
            user_id.toString(),
          );
        }
        else if (key === 'id_proof') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_KYC_IMAGE_PATH!,
            user_id.toString(),
          );
        }
        const targetPath = path.join(targetDir, file.originalname);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const filesInDir = fs.readdirSync(targetDir);
          for (const f of filesInDir) {
            if (f !== file.originalname) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);

        processedFiles[key] = {
          filename: file.originalname,
          path: targetPath,
        };
      }

      const seller = await this.sellerService.create(user_id, createSellerDto, processedFiles);

      const result = JSON.stringify(seller, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), "Seller profile updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response || error.message);
    }
  }

  @Get("profile")
  async findOne(@Res() res: Response, @GetUser('id') user_id: bigint) {
    try {
      const seller = await this.sellerService.findOne(user_id);
      const encrypted = encryptData(seller);
      return res.status(HttpStatus.OK).json(new ApiResponse(encrypted, "Seller profile"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @ApprovalStatus(Approval.Approved)
  @Patch("profile")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
        { name: 'id_proof', maxCount: 1 },
      ],
      upload,
    ),
  )
  async update(
    @Res() res: Response,
    @GetUser('id') user_id: bigint,
    @Body() updateSellerDto: UpdateSellerDto,
    @UploadedFiles() files: { profile?: MulterFile[]; logo?: MulterFile[]; id_proof?: MulterFile[] }
  ) {
    try {
      const fileMap = {
        profile: files.profile?.[0],
        logo: files.logo?.[0],
        id_proof: files.id_proof?.[0],
      };
      const processedFiles: { [key: string]: { filename: string; path: string } } = {};

      for (const [key, file] of Object.entries(fileMap)) {
        if (!file) continue;

        await new Promise((resolve) => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);

        if (!isValid) {
          throw new BadRequestException(`Invalid image file: ${file?.originalname}`)
        }

        let targetDir = '';
        if (key === 'profile') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_PROFILE_IMAGE_PATH!,
            user_id.toString(),
          );
        }
        else if (key === 'logo') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_BUSINESS_IMAGE_PATH!,
            user_id.toString(),
          );
        }
        else if (key === 'id_proof') {
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_KYC_IMAGE_PATH!,
            user_id.toString(),
          );
        }
        const targetPath = path.join(targetDir, file.originalname);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const filesInDir = fs.readdirSync(targetDir);
          for (const f of filesInDir) {
            if (f !== file.originalname) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);

        processedFiles[key] = {
          filename: file.originalname,
          path: targetPath,
        };
      }

      const products = await this.sellerService.update(user_id, updateSellerDto, processedFiles);

      const result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), "Seller profile updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response || error.message);
    }
  }


  // @Get("seller-meta/:storelink")
  // async getMetaForSellerFront(@Res() res: Response, @Param('storelink') storelink: string) {
  //   try {
  //     const meta = await this.sellerService.getMetaForSellerFront(storelink);
  //     const result = JSON.stringify(meta, (key, value) =>
  //       typeof value === 'bigint' ? value.toString() : value,
  //     );
  //     return res.status(HttpStatus.OK).json(new ApiResponse(meta, "Meta data for seller front"));
  //   } catch (error: any) {
  //     if (error.response) {
  //       throw new BadRequestException(error.response);
  //     } else {
  //       throw new BadRequestException(error.message);
  //     }
  //   }
  // }

  @ApprovalStatus(Approval.Approved)
  @Post("social-links")
  async updateSocialLinks(@Res() res: Response, @GetUser('id') user_id: bigint, @Body() sociallinksDto: SociallinksDto) {
    try {
      const links = await this.sellerService.updateSocialLinks(user_id, sociallinksDto);
      let result = JSON.stringify(links, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller social links updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @ApprovalStatus(Approval.Approved)
  @Post("store-front")
  async updateStoreFront(@Res() res: Response, @GetUser('id') user_id: bigint, @Body() dto: StoreFrontDto) {
    try {
      const links = await this.sellerService.updateStoreFront(user_id, dto);
      let result = JSON.stringify(links, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller social links updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @ApprovalStatus(Approval.Approved)
  @Get("categories")
  async findCategory(@Res() res: Response) {
    try {
      const categories = await this.sellerService.findAllCategories();
      let result = JSON.stringify(categories, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Categories"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @ApprovalStatus(Approval.Approved)
  @Get("attributes")
  async findAttributes(@Res() res: Response) {
    try {
      const attributes = await this.sellerService.findAllAttributes();

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attributes"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Post("create-pickup-address")
  async createShippingAddress(@Res() res: Response, @GetUser('id') user_id: bigint, @Body() dto: SellerPickupLocationDto) {
    try {
      const address = await this.sellerService.createSellerPickupLocationService(user_id, dto);
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      console.log(result, "bffsdfjhsdfhjskdfh")

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Pickup address created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  // @Get("pickup-address")
  // async findPickupAddress(@Res() res: Response, @GetUser('id') user_id: bigint) {
  //   try {
  //     const address = await this.sellerService.getPickUpLocationService(user_id);
  //     let result = JSON.stringify(address, (key, value) =>
  //       typeof value === 'bigint' ? value.toString() : value,
  //     );

  //     return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Pickup address"));
  //   } catch (error: any) {
  //     console.log('error: ', error);
  //     throw new BadRequestException(error.response);
  //   }
  // }

  @Put("pickup-address")
  async findPickupAddress(
    @Res() res: Response,
    @GetUser('id') user_id: bigint,
    @Body('search') search?: string,
  ) {
    try {
      const address = await this.sellerService.getPickUpLocationService(user_id, search);
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), "Pickup address"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }





}
