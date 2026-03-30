// import { BadRequestException, Injectable } from '@nestjs/common';
// import { PrismaService } from '@/prisma/prisma.service';
// import { CreateFaqModule } from './dto/create-faq-module.dto';
// import { UpdateFaqModule } from './dto/update-faq-module.dto';
// import { FaqModuleDto } from './dto/faq-module.dto';
// import { CreateFaqDto } from './dto/create-faq.dto';
// import { UpdateFaqDto } from './dto/update-faq.dto';
// import { FaqDto } from './dto/faq.dto';

// @Injectable()
// export class FaqsService {
//   constructor(private prisma: PrismaService) { }

//   async createFaqModule(dto: CreateFaqModule) {
//     const lastModule = await this.prisma.fAQModule.findFirst({
//       orderBy: { rank: 'desc' },
//     });
//     const newRank = lastModule ? lastModule.rank + 1 : 1;

//     const res = await this.prisma.fAQModule.create({
//       data: {
//         name: dto.name,
//         rank: newRank,
//         status: dto?.status ?? "DRAFT"
//       },
//     });

//     return res;
//   }

//   async updateFAQModule(dto: UpdateFaqModule) {
//     try {
//       let { id, rank, ...updateFields } = dto;

//       const updatedData = { ...dto };

//       const currentModule = await this.prisma.fAQModule.findUnique({
//         where: { id },
//       });

//       if (!currentModule) {
//         throw new BadRequestException(`FAQ Module with ID ${id} not found.`)
//       }

//       const currentRank = currentModule.rank;

//       if (rank && currentRank !== rank) {
//         const highestRankModule = await this.prisma.fAQModule.findFirst({
//           orderBy: { rank: 'desc' },
//           select: { rank: true },
//         });

//         const highestRank = highestRankModule ? highestRankModule.rank : 0;

//         if (rank > highestRank) {
//           rank = highestRank;
//         }

//         if (currentRank < rank) {
//           await this.prisma.fAQModule.updateMany({
//             where: {
//               rank: {
//                 gt: currentRank,
//                 lte: rank,
//               },
//             },
//             data: {
//               rank: { decrement: 1 },
//             },
//           });
//         } else {
//           await this.prisma.fAQModule.updateMany({
//             where: {
//               rank: {
//                 gte: rank,
//                 lt: currentRank,
//               },
//             },
//             data: {
//               rank: { increment: 1 },
//             },
//           });
//         }

//         updatedData.rank = rank;
//       }

//       const updatedModule = await this.prisma.fAQModule.update({
//         where: { id },
//         data: updatedData,
//       });

//       return updatedModule;
//     } catch (error: any) {
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async faqModules(dto: FaqModuleDto) {
//     let conditions: any = {
//       // status: "ACCEPTED",
//     };

//     let searchWord = dto.search ? dto.search?.trim() : null;
//     if (searchWord) {
//       conditions.OR = [
//         {
//           name: {
//             contains: searchWord,
//             mode: "insensitive"
//           }
//         }
//       ];
//     }

//     const selectFields = {
//       id: true,
//       name: true,
//       rank: true,
//       status: true
//     };

//     let total_faq_modules = await this.prisma.fAQModule.count({ where: conditions });

//     const faq_modules = await this.prisma.fAQModule.findMany({
//       orderBy: {
//         rank: "asc"
//       },
//       where: conditions,
//       select: selectFields,
//       skip: dto.page && dto.row_per_page ? (dto.page - 1) * dto.row_per_page : undefined,
//       take: dto.page && dto.row_per_page ? dto.row_per_page : undefined,
//     });

//     return {
//       total_faq_modules,
//       details: faq_modules
//     };
//   }

//   async faqModulesById(module_id: number) {
//     try {
//       let isExist = await this.prisma.fAQModule.count({
//         where: {
//           id: module_id
//         }
//       });

//       if (!isExist) {
//         throw new BadRequestException('Module Id is not exist!')
//       } else {
//         const faq_modules = await this.prisma.fAQModule.findUnique({
//           where: {
//             id: module_id
//           },
//           select: {
//             id: true,
//             name: true,
//             rank: true,
//             status: true
//           }
//         });

//         return { ...faq_modules };
//       }
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async deleteFaqModules(module_id: number) {
//     try {
//       const modulesToDelete = await this.prisma.fAQModule.findFirst({
//         where: {
//           id: module_id
//         },
//         select: {
//           id: true,
//           rank: true,
//         },
//       });

//       if (!modulesToDelete?.id) {
//         throw new BadRequestException('No matching FAQ Modules found to delete.')
//       }

//       let isFaqAvailable = await this.prisma.fAQ.count({
//         where: {
//           module_id: module_id
//         }
//       });

//       if (isFaqAvailable) {
//         throw new BadRequestException('Please delete faqs of this module first!')
//       }

//       await this.prisma.fAQModule.delete({
//         where: {
//           id: module_id,
//         },
//       });

//       const lowestDeletedRank = modulesToDelete?.rank;

//       await this.prisma.fAQModule.updateMany({
//         where: {
//           rank: { gt: lowestDeletedRank },
//         },
//         data: {
//           rank: {
//             decrement: +1,
//           },
//         },
//       });

//       return true;
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message)
//     }
//   }

//   async faqCategory() {
//     const faq_categories = await this.prisma.fAQModule.findMany({
//       orderBy: {
//         rank: "asc"
//       },
//       where: {
//         status: "PUBLISHED"
//       },
//       select: {
//         id: true,
//         name: true
//       }
//     });

//     return faq_categories;
//   }

//   async createFaq(dto: CreateFaqDto) {
//     try {
//       let isModuleAvailable = await this.prisma.fAQModule.count({
//         where: {
//           id: dto.module_id
//         }
//       });

//       if (!isModuleAvailable) {
//         throw new BadRequestException(`Invalid module id`);
//       } else {
//         const lastFAQ = await this.prisma.fAQ.findFirst({
//           where: {
//             module_id: dto.module_id,
//           },
//           orderBy: {
//             rank: 'desc',
//           },
//         });

//         const newRank = lastFAQ ? lastFAQ.rank + 1 : 1;
//         const status = dto?.status ?? "DRAFT";

//         const res = await this.prisma.fAQ.create({
//           data: {
//             question: dto.question,
//             answer: dto.answer,
//             rank: newRank,
//             module_id: dto.module_id,
//             status: status,
//           },
//         });

//         return res;
//       }
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async updateFaq(dto: UpdateFaqDto) {
//     try {
//       const { id, rank, ...updateFields } = dto;

//       const currentFAQ = await this.prisma.fAQ.findUnique({
//         where: { id },
//       });

//       if (!currentFAQ) {
//         throw new BadRequestException(`FAQ with ID ${id} not found.`);
//       }

//       const currentRank = currentFAQ.rank;

//       if (rank && currentRank !== rank) {
//         if (currentRank < rank) {
//           await this.prisma.fAQ.updateMany({
//             where: {
//               module_id: currentFAQ.module_id,
//               rank: {
//                 gt: currentRank,
//                 lte: rank,
//               },
//             },
//             data: {
//               rank: { decrement: 1 },
//             },
//           });
//         } else {
//           await this.prisma.fAQ.updateMany({
//             where: {
//               module_id: currentFAQ.module_id,
//               rank: {
//                 gte: rank,
//                 lt: currentRank,
//               },
//             },
//             data: {
//               rank: { increment: 1 },
//             },
//           });
//         }
//       }

//       const updatedFAQ = await this.prisma.fAQ.update({
//         where: { id },
//         data: {
//           ...updateFields,
//           ...(rank && { rank: rank }),
//         },
//       });

//       return updatedFAQ
//     } catch (error) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async faqs(dto: FaqDto) {
//     let conditions: any = {
//       // status: "ACCEPTED",
//     };

//     let searchWord = dto.search ? dto.search?.trim() : null;

//     if (searchWord) {
//       conditions.OR = [
//         {
//           question: {
//             contains: searchWord,
//             mode: "insensitive"
//           }
//         },
//         {
//           answer: {
//             contains: searchWord,
//             mode: "insensitive"
//           }
//         }
//       ];
//     }

//     const selectFields = {
//       id: true,
//       question: true,
//       answer: true,
//       module: {
//         select: {
//           id: true,
//           name: true
//         }
//       },
//       rank: true
//     };

//     let total_faqs = await this.prisma.fAQ.count({ where: conditions });

//     const faqs = await this.prisma.fAQ.findMany({
//       orderBy: {
//         rank: "asc"
//       },
//       where: conditions,
//       select: selectFields,
//       skip: dto.page && dto.row_per_page ? (dto.page - 1) * dto.row_per_page : undefined,
//       take: dto.page && dto.row_per_page ? dto.row_per_page : undefined,
//     });

//     return {
//       total_faqs,
//       details: faqs
//     };
//   }

//   async faqsById(id: number) {
//     try {
//       let isExist = await this.prisma.fAQ.count({
//         where: {
//           id: id
//         }
//       });

//       if (!isExist) {
//         throw new BadRequestException('Id is not exist!')
//       } else {
//         const faqs = await this.prisma.fAQ.findUnique({
//           where: {
//             id: id
//           },
//           select: {
//             id: true,
//             question: true,
//             answer: true,
//             module: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             },
//             rank: true
//           }
//         });

//         return { ...faqs };
//       }
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message);
//     }
//   }

//   async deleteFaqs(id: number) {
//     try {
//       const modulesToDelete = await this.prisma.fAQ.findFirst({
//         where: {
//           id: id
//         },
//         select: {
//           id: true,
//           rank: true,
//         },
//       });

//       if (!modulesToDelete?.id) {
//         throw new BadRequestException('No matching FAQ found to delete.')
//       }

//       await this.prisma.fAQ.delete({
//         where: {
//           id: id,
//         },
//       });

//       const lowestDeletedRank = modulesToDelete?.rank;

//       await this.prisma.fAQ.updateMany({
//         where: {
//           rank: { gt: lowestDeletedRank },
//         },
//         data: {
//           rank: {
//             decrement: +1,
//           },
//         },
//       });

//       return true;
//     } catch (error: any) {
//       console.log('error: ', error);
//       throw new BadRequestException(error?.message)
//     }
//   }

//   async clientfaqs() {
//     const faqs = await this.prisma.fAQModule.findMany({
//       orderBy: {
//         rank: "asc"
//       },
//       where: {
//         status: "PUBLISHED"
//       },
//       select: {
//         id: true,
//         name: true,
//         rank: true,
//         faqs: {
//           select: {
//             id: true,
//             question: true,
//             answer: true,
//             rank: true
//           }
//         }
//       },
//     });

//     return faqs;
//   }
// }
