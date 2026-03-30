import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, UseGuards, Req, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from 'src/common/dto/response.dto';
import { Request, Response } from 'express';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EditUserDto } from './dto/edit-user.dto';
import { isValidImage, upload } from 'src/common/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { FindUserDto } from './dto/find-user.dto';


@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response) {
    try {
      let result = JSON.stringify(req.user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(new ApiResponse(null, '', false));
    }
  }

  @UseGuards(JwtGuard)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('image', upload))
  async editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto, @Res() res: Response, @UploadedFile() file: MulterFile) {
    try {
      let targetPath = ""
      if (file?.path) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);

        if (!isValid) {
          throw new BadRequestException(
            new ApiResponse(null, `Invalid image file: ${file?.originalname}`, false)
          );
        }

        const targetDir = path.join(process.env.IMAGE_PATH!, process.env.USER_PROFILE_IMAGE_PATH!, userId.toString());
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

      const user = await this.userService.edit(userId, dto, {
        filename: file?.originalname,
        path: targetPath,
      });

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Profile updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard)
  @Post("change-password")
  async changePasswod(@GetUser('id') userId: number, @Body() dto: ChangePasswordDto, @Res() res: Response) {
    try {
      let result = await this.userService.changePassword(userId, dto);

      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Password updated successfully"));
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json(new ApiResponse(null, "Something went wrong. Please try again!"));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(new ApiResponse(null, error?.message, false));
    }
  }

  @Put('check-user')
  async checkUser(@Res() res: Response, @Body() findUser: FindUserDto) {
    try {
      const attributes = await this.userService.checkUser(findUser);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
