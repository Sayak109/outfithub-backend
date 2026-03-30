import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Put, HttpStatus, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { Response } from 'express';
import { PaginationDto } from '../product/dto/pagination.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';
import { Request as ExpressRequest } from 'express';


interface AuthenticatedRequest extends ExpressRequest {
  cookies: { [key: string]: string };
}

@Controller({ path: 'customer/reels', version: '1' })
export class ReelsController {
  constructor(private readonly reelsService: ReelsService, private prisma: PrismaService) { }

  @Post("product-click-count/:id")
  async create(@Res() res: Response, @Param('id') id: string, @Body() createReelDto: CreateReelDto,) {
    try {
      const reel = await this.reelsService.create(BigInt(id), createReelDto);
      let result = JSON.stringify(reel, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Product click count increases"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get('tags')
  async topTags(@Res() res: Response) {
    try {
      const reel = await this.reelsService.topTags();
      let result = JSON.stringify(reel, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Top tags."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put('by-tags/:tag')
  async reelsbyTags(@Res() res: Response, @Req() req: AuthenticatedRequest, @Body() dto: PaginationDto, @Param('tag') tag: string,) {
    try {
      let user_id: bigint | undefined;
      const token = req.cookies?.token;
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            user_id = user.id;
          }
        } catch (err: any) {
          console.warn("JWT verification failed:", err.message || err);
        }
      }
      const reel = await this.reelsService.reelsbyTags(dto, tag, user_id);
      let result = JSON.stringify(reel, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reels by tags."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAllReels(
    @Res() res: Response,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PaginationDto,
  ) {
    try {
      let user_id: bigint | undefined;
      const token = req.cookies?.token;
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            user_id = user.id;
          }
        } catch (err: any) {
          console.warn("JWT verification failed:", err.message || err);
        }
      }

      const reels = await this.reelsService.findAllReels(dto, user_id);
      const result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), 'All Reels.'));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.response || error.message);
    }
  }


  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Res() res: Response, @Req() req: AuthenticatedRequest,) {
    try {
      let user_id: bigint | undefined;
      const token = req.cookies?.token;
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            user_id = user.id;
          }
        } catch (err: any) {
          console.warn("JWT verification failed:", err.message || err);
        }
      }
      const reel = await this.reelsService.findRellsBySlug(slug, user_id);
      let result = JSON.stringify(reel, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateReelDto: UpdateReelDto, @GetUser("id") user_id: string) {
    try {
      const reels = await this.reelsService.update(BigInt(id), BigInt(user_id), updateReelDto);
      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), ""));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reelsService.remove(+id);
  }
}
