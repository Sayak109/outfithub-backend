import { Controller, Post, Body, Res, HttpStatus, BadRequestException, ForbiddenException, Req, Get, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/common/dto/response.dto';
import { Prisma } from 'generated/prisma';
import { loginDto } from './dto/login-auth.dto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GetUser } from './decorators/get-user.decorator';
import { JwtGuard } from './guard/jwt.guard';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { isValidImage, upload } from 'src/common/config/multer.config';
import { SidebarIconDto } from './dto/sidebar-icon.dto';
import * as path from 'path';
import * as fs from 'fs';
import { OtpService } from '@/otp/otp.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private config: ConfigService,
    private readonly otpService: OtpService
  ) { }

  @Post('signup')
  async create(@Req() req: Request, @Res() res: Response, @Body() dto: CreateAuthDto) {
    try {
      const expiresInMs = +(this.config.get('COOKIE_EXPIRATION_TIME'));
      const expiresAt = new Date(Date.now() + expiresInMs);
      const userAgent = req.headers['user-agent'] || '';
      const ip_address = req.ip;

      const payload = {
        credential: dto.email,
        otp: dto.otp
      }
      const verifyOtp = await this.otpService.verifyOtp(payload);
      if (verifyOtp) {
        const result = await this.authService.signup(dto, expiresAt, userAgent, ip_address);
        const token = result?.access_token || '';
        res.cookie('token', token, {
          domain: this.config.get('COOKIE_DOMAIN'),
          path: '/',
          httpOnly: true,
          secure: this.config.get('NODE_ENV') === 'production',
          maxAge: parseInt(this.config.get('COOKIE_EXPIRATION_TIME')!, 10),
          // sameSite: 'lax',
          sameSite: this.config.get('SAME_SITE'),
        });
      }
      return res.status(HttpStatus.CREATED).json(new ApiResponse(null, "Signup successful"));
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException({
            success: false,
            message: `A user with this ${error.meta?.target} already exists.`,
          });
        }
      }

      console.log('error: ', error);
      throw new BadRequestException(new ApiResponse(null, error?.message, false));
    }
  }

  @Post('signin')
  async signin(@Req() req: Request, @Res() res: Response, @Body() dto: loginDto) {
    try {
      const expiresInMs = +(this.config.get('COOKIE_EXPIRATION_TIME'));
      const expiresAt = new Date(Date.now() + expiresInMs);
      const userAgent = req.headers['user-agent'] || '';
      const ip_address = req.ip;
      const result = await this.authService.signin(dto, expiresAt, userAgent, ip_address);
      if (result) {
        const token = result?.access_token || '';

        res.cookie('token', token, {
          domain: this.config.get('COOKIE_DOMAIN'),
          path: '/',
          httpOnly: true,
          secure: this.config.get('NODE_ENV') === 'production',
          maxAge: parseInt(this.config.get('COOKIE_EXPIRATION_TIME')!, 10),
          // sameSite: 'lax',
          sameSite: this.config.get('SAME_SITE'),
        });

        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Signin successful"));
      }
      else {
        return res.status(HttpStatus.BAD_REQUEST).json(new ApiResponse(null, "Your account is temporarily suspended."));
      }
      // return res.status(HttpStatus.OK).json(new ApiResponse(result, ""));
    } catch (error: any) {
      console.log('error: ', error);

      if (error.response?.status === 403) {
        throw new ForbiddenException({
          message: error.response?.message,
          error: 'Forbidden',
        });
      } else {
        throw new BadRequestException(error.response);
      }
    }
  }

  @Post('guest')
  async createGuest(@Req() req: Request, @Res() res: Response) {
    try {
      const expiresInMs = +(this.config.get('COOKIE_EXPIRATION_TIME'));
      const expiresAt = new Date(Date.now() + expiresInMs);
      const userAgent = req.headers['user-agent'] || '';
      const ip_address = req.ip;

      const guestUser = await this.authService.createGuestUser(expiresAt, userAgent, ip_address);

      const token = guestUser?.access_token || '';
      res.cookie('token', token, {
        domain: this.config.get('COOKIE_DOMAIN'),
        path: '/',
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        maxAge: parseInt(this.config.get('COOKIE_EXPIRATION_TIME')!, 10),
        sameSite: this.config.get('SAME_SITE'),
      });

      return res.status(HttpStatus.CREATED).json(
        new ApiResponse(null, "Guest user created successfully")
      );
    } catch (error: any) {
      throw new BadRequestException(new ApiResponse(null, error?.message, false));
    }
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response, @GetUser('id') user_id: bigint) {
    try {
      let result = await this.authService.logout(user_id, req.cookies?.token, req, res);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Logged out from current device"));
      } else {
        throw new BadRequestException(new ApiResponse(null, '', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: Request, @Res() res: Response, @GetUser('id') user_id: bigint,) {
    try {
      let result = await this.authService.logoutAll(user_id, req, res);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Logged out from all devices"));
      } else {
        throw new BadRequestException(new ApiResponse(null, '', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request, @Res() res: Response) {
    try {
      let result = await this.authService.forgotPassword(dto);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Password reset request accepted. Email will be sent if the user exists."));
      } else {
        throw new BadRequestException(new ApiResponse(null, 'User not found.', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request, @Res() res: Response) {
    try {
      let result = await this.authService.resetPassword(dto);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "Your password has been reset successfully."));
      } else {
        throw new BadRequestException(new ApiResponse(null, 'Invalid or expired token', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
