// import { LogType } from "@/settings/logs/dto/create-log.dto";
// // import { LogsService } from "@/settings/logs/logs.service";
// import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
// import { Request, Response } from "express";

// @Catch()
// export class AllExceptionsFilter implements ExceptionFilter {
//     constructor(private readonly logsService: LogsService) { }

//     async catch(exception: any, host: ArgumentsHost) {
//         const ctx = host.switchToHttp();
//         const response = ctx.getResponse();
//         const request = ctx.getRequest();

//         // const response = ctx.getResponse<Response>();
//         // const request = ctx.getRequest<Request>();

//         console.log('ExTExt:::::::: ', exception);

//         const status = exception instanceof HttpException
//             ? exception.getStatus()
//             : 500;

//         const message = exception.message || 'Internal server error';
//         // const message =
//         // exception instanceof HttpException
//         //   ? exception.getResponse()
//         //   : exception.message;

//         await this.logsService.createLog({
//             type: LogType.ERROR,
//             message,
//             metadata: {
//                 path: request.url,
//                 method: request.method,
//                 stack: exception.stack,
//             },
//             user_id: request.user?.id ?? null,
//             source: 'UI/API',
//         });

//         response.status(status).json({
//             ...exception?.response
//             // statusCode: status,
//             // error: exception,
//             // message,
//         });
//     }
// }