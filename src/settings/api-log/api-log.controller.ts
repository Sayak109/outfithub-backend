// import { BadRequestException, Controller, Get, HttpStatus, Res } from '@nestjs/common';
// import { ApiLogService } from './api-log.service';
// import { ApiResponse } from '@/common/dto/response.dto';
// import { Response } from 'express';

// @Controller({ path: 'api-log', version: '1' })
// export class ApiLogController {
//   constructor(private readonly apiLogService: ApiLogService) { }

//   @Get('logs')
//   async getRecentLogs(@Res() res: Response) {
//     try {
//       let details = await this.apiLogService.getRecentLogs();

//       return res.status(HttpStatus.OK).json(new ApiResponse(details , "Data fetched!"));

//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(new ApiResponse(null, error?.message, false));
//     }
//   }
// }


