// import { Controller, Post, Body, Req, BadRequestException, Res, HttpStatus, Get, UseGuards } from '@nestjs/common';
// // import { LogsService } from './logs.service';
// import { CreateLogDto, LogType } from './dto/create-log.dto';
// import { Request, Response } from 'express';
// import { ApiResponse } from '@/common/dto/response.dto';
// import { JwtGuard } from '@/auth/guard/jwt.guard';
// import { RolesGuard } from '@/auth/guard/roles.guard';
// import { Roles } from '@/auth/decorators/roles.decorator';
// import { Role } from '@/auth/enums/role.enum';
// import { filterLogDto } from './dto/filter-log.dto';

// @UseGuards(JwtGuard)
// @Controller({ path: "logs", version: "1" })
// export class LogsController {
//   constructor(private readonly logsService: LogsService) { }

//   @UseGuards(RolesGuard)
//   @Roles(Role.Admin)
//   @Get()
//   async getLogs(@Body() dto: filterLogDto, @Res() res: Response) {
//     try {
//       const logs = await this.logsService.getLogs(dto);

//       let result = JSON.stringify(logs, (key, value) =>
//         typeof value === 'bigint' ? value.toString() : value,
//       );

//       return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "fetched logs"));
//     } catch (error: any) {
//       console.log('error: ', error)
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }

//   @Post('user-issue')
//   async reportUserIssue(@Body() body: CreateLogDto, @Req() req: any, @Res() res: Response) {
//     try {
//       let result = await this.logsService.createLog({
//         type: LogType.USER_ISSUE,
//         message: body.message,
//         metadata: body.metadata,
//         user_id: req.user?.id ?? null,
//         source: 'user',
//       });

//       return res.status(HttpStatus.OK).json(new ApiResponse({ ...result }, "Issue logged!"));
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }
// }
