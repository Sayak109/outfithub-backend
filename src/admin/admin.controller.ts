import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, Put, Req, UseGuards, UploadedFile, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUsersDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/common/dto/response.dto';
import { GetUsersDto } from './dto/get-admin.dto';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CreateSellerDto } from '@/seller/dto/create-seller.dto';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { isValidImage, upload } from '@/common/config/multer.config';
import { CreateUsersProfileDto } from './dto/create-userprofile.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { LogReportDto } from './dto/admin-log.dto';
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private config: ConfigService,
    private prisma: PrismaService
  ) { }

  @Post("user")
  async create(@Res() res: Response, @Body() createUsersDto: CreateUsersDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const user = await this.adminService.create(createUsersDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `User (email: "${user.email}") created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("user-profile/:id")
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
  async createProfile(@Res() res: Response, @Param('id') user_id: string, @Body() createUsersProfileDto: CreateUsersProfileDto,
    @UploadedFiles() files: { profile?: MulterFile[]; logo?: MulterFile[]; id_proof?: MulterFile[] },
    @Req() req: Request, @GetUser("email") user_email: string) {
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
      const users = await this.adminService.createProfile(BigInt(user_id), createUsersProfileDto, processedFiles);
      let result = JSON.stringify(users, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const sel = await this.prisma.user.findUnique({
        where: {
          id: BigInt(user_id)
        }
      })
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Seller profile with "${sel?.email!}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller profile added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('user/:id')
  async update(@Res() res: Response, @Param('id') user_id: string, @Body() updateAdminDto: UpdateAdminDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const user = await this.adminService.update(BigInt(user_id), updateAdminDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `User (email: "${user.email}") updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("users")
  async findAll(@Res() res: Response, @Body() getUseresDto: GetUsersDto) {
    try {
      const user = await this.adminService.findAll(getUseresDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get("sellers")
  async findAllSellers(@Res() res: Response) {
    try {
      const user = await this.adminService.findAllSellers();

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get('user/:id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const user = await this.adminService.findOne(BigInt(id));

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(new ApiResponse(null, '', false));
    }
  }

  @Delete('user/:id')
  async remove(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const user = await this.adminService.remove(BigInt(id));

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `User (email: "${user.email}") deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "User deleted."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("log-report")
  async getAllReport(@Res() res: Response, @Body() logDto: LogReportDto) {
    try {
      const user = await this.adminService.findAllReport(logDto);

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
