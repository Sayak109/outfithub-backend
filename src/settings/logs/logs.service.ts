// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '@/prisma/prisma.service';
// import { CreateLogDto } from './dto/create-log.dto';
// import { filterLogDto } from './dto/filter-log.dto';

// @Injectable()
// export class LogsService {
//   constructor(private readonly prisma: PrismaService) { }

//   async createLog(dto: CreateLogDto) {
//     return await this.prisma.logs.create({
//       data: {
//         type: dto.type,
//         message: dto.message,
//         metadata: dto.metadata,
//         source: dto.source,
//         user_id: dto.user_id
//       },
//     });
//   }

//   async getLogs(dto: filterLogDto) {
//     // let conditions: any = {
//     //   // status: "ACCEPTED",
//     // };

//     // let searchWord = dto.search?.trim();
//     // if (searchWord) {
//     //   conditions.OR = [
//     //     {
//     //       first_name: {
//     //         contains: searchWord,
//     //         mode: "insensitive"
//     //       }
//     //     }, {
//     //       last_name: {
//     //         contains: searchWord,
//     //         mode: "insensitive"
//     //       },
//     //     }, {
//     //       email: {
//     //         contains: searchWord,
//     //         mode: "insensitive"
//     //       }
//     //     }
//     //   ];
//     // }

//     let total_logs = await this.prisma.logs.count();

//     const logs = await this.prisma.logs.findMany({
//       orderBy: {
//         created_at: "desc"
//       },
//       select: {
//         id: true,
//         type: true,
//         message: true,
//         metadata: true,
//         source: true,
//         created_at: true,
//         user_id: true
//       },
//       skip: dto.page && dto.row_per_page ? (dto.page - 1) * dto.row_per_page : undefined,
//       take: dto.page && dto.row_per_page ? dto.row_per_page : undefined,
//     });

//     return {
//       total_logs,
//       details: logs
//     };
//   }
// }