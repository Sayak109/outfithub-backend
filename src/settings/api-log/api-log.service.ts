
// import { PrismaService } from '@/prisma/prisma.service';
// import { BadRequestException, Injectable } from '@nestjs/common';

// @Injectable()
// export class ApiLogService {
//     constructor(private prisma: PrismaService) { }

//     async getRecentLogs() {
//         try {
//             let details = await this.prisma.apiLog.findMany({
//                 orderBy: { created_at: 'desc' },
//                 take: 50,
//             });

//             return details;
//         } catch (error: any) {
//             console.error('Failed to get recent logs:', error);
//             throw new BadRequestException(error?.message || 'An error occurred while recent logs.');
//         }
//     }

//     async log(data: {
//         method: string;
//         route: string;
//         status_code: number;
//         durationMs: number;
//         ip_address?: string;
//         user_agent?: string;
//     }) {
//         await this.prisma.apiLog.create({ data });
//     }
// }
