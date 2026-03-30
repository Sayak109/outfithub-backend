// import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException } from '@nestjs/common';
// import { AboutService } from './about.service';
// import { CreateAboutDto } from './dto/create-about.dto';
// import { UpdateAboutDto } from './dto/update-about.dto';
// import { JwtGuard } from '@/auth/guard/jwt.guard';
// import { RolesGuard } from '@/auth/guard/roles.guard';
// import { Roles } from '@/auth/decorators/roles.decorator';
// import { Role } from '@/auth/enums/role.enum';
// import { Response } from 'express';
// import { ApiResponse } from '@/common/dto/response.dto';

// @Controller({ path: 'about', version: '1' })
// export class AboutController {
//   constructor(private readonly aboutService: AboutService) { }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Post('manage')
//   async manageAbout(@Body() dto: CreateAboutDto, @Res() res: Response) {
//     try {
//       const serviceRes = await this.aboutService.manageAbout(dto);

//       if (!serviceRes) {
//         throw new BadRequestException(new ApiResponse(null, "Process is unsuccessfull!"));
//       }

//       const updatedData = JSON.stringify(serviceRes, (_key, value) => {
//         return typeof value === 'bigint' ? value = value.toString() : value
//       })

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(updatedData), "Process is done successfully"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.Admin)
//   @Get()
//   async about(@Res() res: Response) {
//     try {
//       const user = await this.aboutService.about();

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "About details"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   // client
//   @Get("client")
//   async clientAbout(@Res() res: Response) {
//     try {
//       const user = await this.aboutService.clientAbout();

//       let result = JSON.stringify(user, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "About details"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }
// }
