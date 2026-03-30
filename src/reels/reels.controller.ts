import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, HttpStatus, BadRequestException, Res, HttpException, Req, Put, UploadedFiles } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Account } from '@/auth/enums/account.enum';
import { AccountStatus, ApprovalStatus } from '@/auth/decorators/status.decorator';
import { Approval } from '@/auth/enums/approval.enum';
import { AccountStatusGuard, ApprovalStatusGuard } from '@/auth/guard/status.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { isValidImage, isValidVideoDuration, upload } from '@/common/config/multer.config';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { GetReelsDto } from './dto/get-reels.dto';
import { updateStatusDto } from './dto/update-reel-status.dto';
import { PrismaService } from '@/prisma/prisma.service';

@UseGuards(JwtGuard, AccountStatusGuard, ApprovalStatusGuard)
@AccountStatus(Account.Active, Account.Reactivated)
// @ApprovalStatus(Approval.Approved)
@Controller({ path: 'reels', version: '1' })
export class ReelsController {
  constructor(private readonly reelsService: ReelsService, private prisma: PrismaService) { }

  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'thumbnail', maxCount: 1 },
  //       { name: 'reel', maxCount: 1 },
  //     ],
  //     upload,
  //   ),
  // )
  // @Post()
  // async create(@Res() res: Response,
  //   @UploadedFiles() files: { thumbnail?: MulterFile[]; reel?: MulterFile[] },
  //   @Body() createReelDto: CreateReelDto, @GetUser("id") user_id: bigint) {
  //   try {
  //     const fileMap = {
  //       thumbnail: files.thumbnail?.[0],
  //       reel: files.reel?.[0],
  //     };
  //     const processedFiles: { [key: string]: { filename: string; path: string } } = {};

  //     for (const [key, file] of Object.entries(fileMap)) {
  //       if (!file) continue;

  //       let targetDir = '';
  //       if (key === 'thumbnail') {
  //         const isValid = await isValidImage(file.path);
  //         if (!isValid) {
  //           throw new BadRequestException(`Invalid image file: ${file?.originalname}`)
  //         }
  //         targetDir = path.join(
  //           process.env.IMAGE_PATH!,
  //           process.env.USER_REELS_PATH!,
  //           user_id.toString(),
  //           "thumbnail",
  //         );
  //       }
  //       else if (key === 'reel') {
  //         const isValid = await isValidVideoDuration(file.path, 60);
  //         if (!isValid) {
  //           fs.unlinkSync(file.path);
  //           throw new BadRequestException('Video must be 60 seconds or less.');
  //         }
  //         targetDir = path.join(
  //           process.env.IMAGE_PATH!,
  //           process.env.USER_REELS_PATH!,
  //           user_id.toString(),
  //           "reel",
  //         );
  //       }

  //       const targetPath = path.join(targetDir, file.filename);

  //       if (!fs.existsSync(targetDir)) {
  //         fs.mkdirSync(targetDir, { recursive: true });
  //       } else {
  //         const filesInDir = fs.readdirSync(targetDir);
  //         for (const f of filesInDir) {
  //           if (f !== file.filename) {
  //             const filePath = path.join(targetDir, f);
  //             if (fs.existsSync(filePath)) {
  //               fs.unlinkSync(filePath);
  //             }
  //           }
  //         }
  //       }
  //       fs.renameSync(file.path, targetPath);

  //       processedFiles[key] = {
  //         filename: file.filename,
  //         path: targetPath,
  //       };
  //     }
  //     const reels = await this.reelsService.create(user_id, createReelDto, processedFiles);
  //     let result = JSON.stringify(reels, (key, value) =>
  //       typeof value === 'bigint' ? value.toString() : value,
  //     );
  //     return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reels added successfully."));
  //   } catch (error: any) {
  //     console.log('error: ', error);
  //     throw new BadRequestException(error.response);
  //   }
  // }

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'reel', maxCount: 1 },
      ],
      upload,
    ),
  )
  @Post()
  async create(
    @Res() res: Response,
    @UploadedFiles() files: { thumbnail?: MulterFile[]; reel?: MulterFile[] },
    @Body() createReelDto: CreateReelDto,
    @GetUser("id") user_id: bigint,
  ) {
    try {
      console.log("createReelDto", createReelDto);

      const fileMap = {
        thumbnail: files.thumbnail?.[0],
        reel: files.reel?.[0],
      };

      if (fileMap.thumbnail) {
        const isValid = await isValidImage(fileMap.thumbnail.path);
        if (!isValid) {
          fs.unlinkSync(fileMap.thumbnail.path);
          throw new BadRequestException(`Invalid image file: ${fileMap.thumbnail.originalname}`);
        }
      }

      if (fileMap.reel) {
        const isValid = await isValidVideoDuration(fileMap.reel.path, 60);
        if (!isValid) {
          fs.unlinkSync(fileMap.reel.path);
          throw new BadRequestException('Video must be 60 seconds or less.');
        }
      }

      const reels = await this.reelsService.create(user_id, createReelDto, {
        thumbnail: fileMap.thumbnail ? { filename: fileMap.thumbnail.filename, path: fileMap.thumbnail.path } : undefined,
        reel: fileMap.reel ? { filename: fileMap.reel.filename, path: fileMap.reel.path } : undefined,
      });

      const result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse(JSON.parse(result), "Reels added successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response || error.message);
    }
  }


  @Put()
  async findAllBySeller(@Res() res: Response, @GetUser("id") user_id: bigint, @Body() getReelsDto: GetReelsDto) {
    try {
      const reels = await this.reelsService.findAllBySeller(user_id, getReelsDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All reels"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get(":id")
  async findOneBySeller(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: bigint) {
    try {
      const reels = await this.reelsService.findOneBySeller(BigInt(id), user_id);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reels found"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'reel', maxCount: 1 },
      ],
      upload,
    ),
  )
  async update(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: bigint,
    @UploadedFiles() files: { thumbnail?: MulterFile[]; reel?: MulterFile[] },
    @Body() updateReelDto: UpdateReelDto) {
    try {
      const fileMap = {
        thumbnail: files.thumbnail?.[0],
        reel: files.reel?.[0],
      };
      const processedFiles: { [key: string]: { filename: string; path: string } } = {};

      for (const [key, file] of Object.entries(fileMap)) {
        if (!file) continue;

        let targetDir = '';
        if (key === 'thumbnail') {
          const isValid = await isValidImage(file.path);
          if (!isValid) {
            throw new BadRequestException(`Invalid image file: ${file?.originalname}`)
          }
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_REELS_PATH!,
            user_id.toString(),
            id.toString(),
            "thumbnail",
          );
        }
        else if (key === 'reel') {
          const isValid = await isValidVideoDuration(file.path, 60);
          if (!isValid) {
            fs.unlinkSync(file.path);
            throw new BadRequestException('Video must be 60 seconds or less.');
          }
          targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.USER_REELS_PATH!,
            user_id.toString(),
            id.toString(),
            "reel",
          );
        }

        const targetPath = path.join(targetDir, file.filename);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const filesInDir = fs.readdirSync(targetDir);
          for (const f of filesInDir) {
            if (f !== file.filename) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);

        processedFiles[key] = {
          filename: file.filename,
          path: targetPath,
        };
      }
      const reels = await this.reelsService.update(BigInt(id), user_id, updateReelDto, processedFiles);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reel updated successfully."));
    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: bigint) {
    try {
      const reels = await this.reelsService.remove(BigInt(id), user_id);
      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reel deleted successfully."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Get('stream/:id/:fileName')
  async streamReel(
    @Param('id') seller_id: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const filePath = path.join(
      process.env.IMAGE_PATH!,
      process.env.USER_REELS_PATH!,
      seller_id,
      "reel",
      fileName
    );

    if (!fs.existsSync(filePath)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = res.req.headers.range;

    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Partial content stream
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    }
  }

  // Admin part
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("seller")
  async findAllReels(@Res() res: Response, @Body() getReelsDto: GetReelsDto) {
    try {
      const reels = await this.reelsService.findAll(getReelsDto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All reels"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get("seller/:id")
  async findReels(@Res() res: Response, @Param('id') id: string,) {
    try {
      const reels = await this.reelsService.findReels(BigInt(id));

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reels found"));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch('seller/:id')
  async updateStatus(@Res() res: Response, @Param('id') id: string, @Body() dto: updateStatusDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const reels = await this.reelsService.updateStatus(BigInt(id), dto);

      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Reel status of "${reels.seller.first_name} ${reels.seller.last_name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reel status updated successfully."));
    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

  @Delete('seller/:id')
  async removeReel(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const reels = await this.reelsService.removeReel(BigInt(id));
      let result = JSON.stringify(reels, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Reel of "${reels.seller.first_name} ${reels.seller.last_name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Reel deleted successfully."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }

}
