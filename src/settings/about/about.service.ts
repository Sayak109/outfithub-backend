// import { BadRequestException, Injectable } from '@nestjs/common';
// import { CreateAboutDto } from './dto/create-about.dto';
// import { PrismaService } from '@/prisma/prisma.service';

// @Injectable()
// export class AboutService {
//   constructor(private prisma: PrismaService) { }

//   async manageAbout(dto: CreateAboutDto) {
//     try {
//       let res: any = null;

//       let isAboutAvailable = await this.prisma.about.findFirst();

//       if (!isAboutAvailable) {
//         res = await this.prisma.about.create({
//           data: {
//             title: dto.title,
//             description: dto.description
//           }
//         });
//       } else {
//         if (isAboutAvailable?.id) {
//           res = await this.prisma.about.update({
//             where: {
//               id: isAboutAvailable.id
//             },
//             data: {
//               title: dto.title,
//               description: dto.description
//             }
//           })
//         }
//         return res;
//       }
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async about() {
//     const about = await this.prisma.about.findMany({
//       select: {
//         id: true,
//         title: true,
//         description: true,
//         created_at: true,
//         updated_at: true
//       },
//     });

//     return about;
//   }

//   async clientAbout() {
//     const about = await this.prisma.about.findMany({
//       select: {
//         id: true,
//         title: true,
//         description: true,
//       },
//     });

//     return about;
//   }
// }
