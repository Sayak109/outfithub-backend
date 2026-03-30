// // import { ApiLogService } from "@/settings/api-log/api-log.service";
// import { Injectable, NestMiddleware } from "@nestjs/common";
// import { NextFunction, Request, Response } from "express";

// @Injectable()
// export class ApiLoggerMiddleware implements NestMiddleware {
//     constructor(private apiLogService: ApiLogService) {}

//     use(req: Request, res: Response, next: NextFunction) {
//         const start = Date.now();

//         res.on('finish', async () => {
//             const duration = Date.now() - start;
//             console.log(
//                 `[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
//             );

//             await this.apiLogService.log({
//                 method: req.method,
//                 route: req.originalUrl,
//                 status_code: res.statusCode,
//                 durationMs: duration,
//                 ip_address: req.ip,
//                 user_agent: req.headers['user-agent'] || '',
//             });
//         });

//         next();
//     }
// }
