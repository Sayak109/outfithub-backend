import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, HttpStatus, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { ApiResponse } from '@/common/dto/response.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Response } from 'express';
import { AnyFilesInterceptor, FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { checkFileType, checkPDFFileType, isValidImage, storage, upload, uploadPDF } from '@/common/config/multer.config';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Express } from 'express';

@Controller({ path: 'support-ticket', version: '1' })
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) { }

  // @Post()
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'images', maxCount: 5 },
  // ], upload))
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'images', maxCount: 5 },
  // ], uploadPDF))
  // async create(@Res() res: Response, @GetUser("id") user_id: bigint, @UploadedFiles() files: { images?: MulterFile[]; pdf?: MulterFile[] },
  //   @Body() createSupportTicketDto: CreateSupportTicketDto) {
  //   try {
  //     const timestampPart = new Date().getTime().toString().slice(-4);
  //     const ticket_id = `YD${timestampPart}TKT${user_id}`;

  //     const imageDir = path.join(
  //       process.env.IMAGE_PATH!,
  //       process.env.SUPPROT_TICKET_PATH!,
  //       ticket_id,
  //     );
  //     if (!fs.existsSync(imageDir)) {
  //       fs.mkdirSync(imageDir, { recursive: true });
  //     }
  //     for (const file of files.images || []) {
  //       if (!file?.path) continue;

  //       await new Promise((resolve) => setTimeout(resolve, 100));
  //       const isValid = await isValidImage(file.path);
  //       if (!isValid) {
  //         throw new BadRequestException(`Invalid image file: ${file.originalname}`);
  //       }

  //       const targetPath = path.join(imageDir, file.filename);
  //       fs.renameSync(file.path, targetPath);
  //       const ticket = await this.supportTicketService.create(BigInt(user_id), ticket_id, createSupportTicketDto, {
  //         filename: file?.filename,
  //         path: targetPath,
  //       });
  //     }
  //     let result = JSON.stringify(ticket, (key, value) =>
  //       typeof value === 'bigint' ? value.toString() : value,
  //     );
  //     return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Support ticket created successfully."));

  //   } catch (error) {
  //     throw new BadRequestException(error?.response);
  //   }
  // }

  @Post()
  @UseInterceptors(AnyFilesInterceptor({ storage }))
  async create(
    @Res() res: Response,
    @UploadedFiles() files: MulterFile[],
    @Body() createSupportTicketDto: CreateSupportTicketDto
  ) {
    try {
      const ticket_id = `YDTKT${Date.now().toString().slice(-6)}`;
      const baseDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.SUPPROT_TICKET_PATH!,
        ticket_id,
      );

      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      const uploadedFiles: any = [];

      for (const file of files) {
        if (file.mimetype === 'application/pdf') {
          checkPDFFileType(file, (err) => { if (err) throw err; });
        } else {
          checkFileType(file, (err) => { if (err) throw err; });
          const isValid = await isValidImage(file.path);
          if (!isValid) {
            throw new BadRequestException(`Invalid image file: ${file.originalname}`);
          }
        }

        const targetPath = path.join(baseDir, file.filename);
        fs.renameSync(file.path, targetPath);

        uploadedFiles.push({
          type: file.mimetype === 'application/pdf' ? 'pdf' : 'image',
          filename: file.filename,
          path: targetPath,
        });
      }
      await this.supportTicketService.create(
        ticket_id,
        createSupportTicketDto,
        uploadedFiles
      );
      return res
        .status(HttpStatus.OK)
        .json(new ApiResponse({ ticket_id }, "Support ticket created successfully."));
    } catch (error) {
      throw new BadRequestException(error?.response || error.message);
    }
  }

  @Get()
  findAll() {
    return this.supportTicketService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportTicketService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupportTicketDto: UpdateSupportTicketDto) {
    return this.supportTicketService.update(+id, updateSupportTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportTicketService.remove(+id);
  }
}
