import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, Req, Put, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { CreateFaqModuleDto } from './dto/create-faq_module.dto';
import { UpdateFaqModuleDto } from './dto/update-faq_module.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { FaqPaginationDto } from './dto/faq-pagination.dto';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { Role } from '@/auth/enums/role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';


@Controller({ path: 'faq', version: '1' })
export class FaqController {
  constructor(
    private readonly faqService: FaqService,
    private prisma: PrismaService
  ) { }

  //////////////// Client side FAQs //////////////////
  @Get('client')
  async clientFaq(@Res() res: Response) {
    try {
      const faq = await this.faqService.clientFaq();
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faqs."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  /////////////////FAQ Module////////////////////
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post("module")
  async createModule(@Res() res: Response, @Body() createFaqModuleDto: CreateFaqModuleDto,
    @Req() req: Request, @GetUser("email") user_email: string

  ) {
    try {
      const faqModule = await this.faqService.createModule(createFaqModuleDto);
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `FAQ category "${faqModule.name}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq category created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put("module")
  async findAllModule(@Res() res: Response, @Body() dto: FaqPaginationDto) {
    try {
      const faqModule = await this.faqService.findAllModule(dto)
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Faq categories."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get('module/:id')
  async findOneModule(@Res() res: Response, @Param('id') id: string) {
    try {
      const faqModule = await this.faqService.findOneModule(BigInt(id))
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq category."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch('module/:id')
  async updateModule(@Res() res: Response, @Param('id') id: string, @Body() updateFaqModuleDto: UpdateFaqModuleDto,
    @Req() req: Request, @GetUser("email") user_email: string
  ) {
    try {
      const faqModule = await this.faqService.updateModule(BigInt(id), updateFaqModuleDto);
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `FAQ category "${faqModule.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq category updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Delete('module/:id')
  async removeModule(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string
  ) {
    try {
      const faqModule = await this.faqService.removeModule(BigInt(id));

      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `FAQ category "${faqModule.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq category deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  /////////////////FAQ////////////////////
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Post()
  async create(@Res() res: Response, @Body() createFaqDto: CreateFaqDto,
    @Req() req: Request, @GetUser("email") user_email: string
  ) {
    try {
      const faq = await this.faqService.create(createFaqDto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `FAQ "${faq.question}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Put(":id")
  async findAll(@Res() res: Response, @Param('id') module_id: string, @Body() dto: FaqPaginationDto) {
    try {
      const faq = await this.faqService.findAll(BigInt(module_id), dto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Faqs."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const faq = await this.faqService.findOne(BigInt(id));
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto,
    @Req() req: Request, @GetUser("email") user_email: string
  ) {
    try {
      const faq = await this.faqService.update(BigInt(id), updateFaqDto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `FAQ "${faq.question}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq updated successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Operator)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const faq = await this.faqService.remove(BigInt(id));

      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `FAQ "${faq.question}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faq deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
