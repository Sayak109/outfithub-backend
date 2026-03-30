// import { Controller, Post, Body, Res, HttpStatus, BadRequestException, UseInterceptors, UseGuards, Req, Delete, Param, ParseIntPipe, Get } from '@nestjs/common';
// import { FaqsService } from './faqs.service';
// import { CreateFaqModule } from './dto/create-faq-module.dto';
// import { Response } from 'express';
// import { ApiResponse } from '@/common/dto/response.dto';
// import { JwtGuard } from '@/auth/guard/jwt.guard';
// import { RolesGuard } from '@/auth/guard/roles.guard';
// import { Roles } from '@/auth/decorators/roles.decorator';
// import { Role } from '@/auth/enums/role.enum';
// import { UpdateFaqModule } from './dto/update-faq-module.dto';
// import { FaqModuleDto } from './dto/faq-module.dto';
// import { CreateFaqDto } from './dto/create-faq.dto';
// import { UpdateFaqDto } from './dto/update-faq.dto';

// @Controller({ path: 'faqs', version: '1' })
// export class FaqsController {
//   constructor(private readonly faqsService: FaqsService) { }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post('create-faq-module')
//   async createFaqModule(@Body() dto: CreateFaqModule, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.createFaqModule(dto);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ Module is created successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post('update-faq-module')
//   async updateFAQModule(@Body() dto: UpdateFaqModule, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.updateFAQModule(dto);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ Module is updated successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post("faq-modules")
//   async faqModules(@Body() dto: FaqModuleDto, @Res() res: Response) {
//     try {
//       const user = await this.faqsService.faqModules(dto);

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ Module list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Get("faq-modules/:id")
//   async faqModulesById(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
//     try {
//       const user = await this.faqsService.faqModulesById(+id);

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ Module list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Delete("delete-faq-module/:id")
//   async deleteFaqModules(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.deleteFaqModules(+id);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ Module is deleted successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Get("faq-category")
//   async faqCategories(@Res() res: Response) {
//     try {
//       const user = await this.faqsService.faqCategory();

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ Category list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post('create-faq')
//   async createFaq(@Body() dto: CreateFaqDto, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.createFaq(dto);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ is created successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post('update-faq')
//   async updateFaq(@Body() dto: UpdateFaqDto, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.updateFaq(dto);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ is updated successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post()
//   async faqs(@Body() dto: FaqModuleDto, @Res() res: Response) {
//     try {
//       const user = await this.faqsService.faqs(dto);

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Get(":id")
//   async faqsById(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
//     try {
//       const user = await this.faqsService.faqsById(+id);

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Delete("delete-faq/:id")
//   async deleteFaqs(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
//     try {
//       const serviceRes = await this.faqsService.deleteFaqs(+id);

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "FAQ is deleted successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   // client
//   @Get("client/faqs")
//   async clientfaqs(@Res() res: Response) {
//     try {
//       const user = await this.faqsService.clientfaqs();

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "FAQ list"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }
// }
