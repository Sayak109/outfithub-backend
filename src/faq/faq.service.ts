import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFaqModuleDto } from './dto/create-faq_module.dto';
import { UpdateFaqModuleDto } from './dto/update-faq_module.dto';
import { FaqPaginationDto } from './dto/faq-pagination.dto';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) { }

  async createModule(dto: CreateFaqModuleDto) {
    try {
      const lastModule = await this.prisma.fAQModule.findFirst({
        orderBy: { rank: 'desc' },
      });
      const newRank = lastModule ? lastModule.rank + BigInt(1) : BigInt(1);
      const res = await this.prisma.fAQModule.create({
        data: {
          name: dto.name,
          desc: dto.desc,
          rank: newRank,
          status_id: 1
        },
      });
      return res;
    } catch (error) {
      throw error
    }
  }

  async findAllModule(dto: FaqPaginationDto) {
    try {
      let conditions: any[] = [];
      let searchWord = '';
      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (dto?.status_id) {
        conditions.push({
          OR: [
            { status_id: dto.status_id },
          ]
        });
      }
      const page = dto?.page || 1
      const rowsPerPage = dto?.rowsPerPage || 1000
      let faqModule: any;
      if (dto && dto.page && dto.rowsPerPage) {
        faqModule = await this.prisma.fAQModule.findMany({
          skip: (page - 1) * rowsPerPage,
          take: rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            name: true,
            desc: true,
            rank: true,
            status: {
              select: {
                id: true,
                title: true,
              }
            },
            _count: {
              select: {
                FAQ: true,
              }
            },
            created_at: true,
          }
        })
      } else {
        faqModule = await this.prisma.fAQModule.findMany({
          where: {
            AND: conditions,
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            name: true,
            desc: true,
            rank: true,
            status: {
              select: {
                id: true,
                title: true,
              }
            },
            _count: {
              select: {
                FAQ: true,
              }
            },
            created_at: true,
          }
        })
      }
      const total = await this.prisma.fAQModule.count({
        where: {
          AND: conditions
        },
      });
      return { Total: total, FaqModules: faqModule };
    } catch (error) {
      throw error
    }
  }

  async findOneModule(module_id: bigint) {
    try {
      const faqModule = await this.prisma.fAQModule.findUnique({
        where: {
          id: module_id,
        },
        select: {
          id: true,
          name: true,
          desc: true,
          rank: true,
          status: {
            select: {
              id: true,
              title: true,
            }
          },
          created_at: true,
        }
      })
      return faqModule;
    } catch (error) {
      throw error
    }
  }

  async updateModule(module_id: bigint, updateFaqDto: UpdateFaqModuleDto) {
    try {
      let { name, desc, status_id, rank } = updateFaqDto;

      const currentModule = await this.prisma.fAQModule.findUnique({
        where: { id: module_id },
      });

      if (!currentModule) {
        throw new BadRequestException(`FAQ Module not found.`);
      }

      const currentRank = currentModule.rank;
      const updatedData: any = {
        ...(name && { name }),
        ...(desc && { desc }),
        ...(status_id && { status_id }),
      };

      if (rank && currentRank !== BigInt(rank)) {
        const highestRankModule = await this.prisma.fAQModule.findFirst({
          orderBy: { rank: 'desc' },
          select: { rank: true },
        });

        const highestRank = highestRankModule ? highestRankModule.rank : BigInt(0);

        if (rank > highestRank) {
          rank = Number(highestRank);
        }

        if (currentRank < rank) {
          await this.prisma.fAQModule.updateMany({
            where: {
              rank: {
                gt: currentRank,
                lte: rank,
              },
            },
            data: {
              rank: { decrement: BigInt(1) },
            },
          });
        } else {
          await this.prisma.fAQModule.updateMany({
            where: {
              rank: {
                gte: rank,
                lt: currentRank,
              },
            },
            data: {
              rank: { increment: BigInt(1) },
            },
          });
        }
        updatedData.rank = rank;
      }

      const updatedModule = await this.prisma.fAQModule.update({
        where: { id: module_id },
        data: updatedData,
      });

      return updatedModule;
    }
    catch (error) {
      throw error
    }
  }

  async removeModule(module_id: bigint) {
    try {
      if (!module_id) {
        throw new BadRequestException("No module ID provided for deletion.");
      }

      const moduleToDelete = await this.prisma.fAQModule.findUnique({
        where: { id: module_id },
        select: { rank: true },
      });

      if (!moduleToDelete) {
        throw new BadRequestException("FAQ Module not found.");
      }
      const deletedRank = moduleToDelete.rank;

      const delModule = await this.prisma.fAQModule.delete({
        where: { id: module_id },
      });

      await this.prisma.fAQModule.updateMany({
        where: {
          rank: { gt: deletedRank },
        },
        data: {
          rank: {
            decrement: BigInt(1),
          },
        },
      });
      return delModule;
    } catch (error) {
      throw error;
    }
  }


  async create(dto: CreateFaqDto) {
    try {
      if (!dto.module_id) {
        throw new BadRequestException("Select a FAQ category.")
      }
      const lastFAQ = await this.prisma.fAQ.findFirst({
        where: {
          module_id: dto.module_id,
        },
        orderBy: {
          rank: 'desc',
        },
      });
      const newRank = lastFAQ ? lastFAQ.rank + BigInt(1) : BigInt(1);

      const res = await this.prisma.fAQ.create({
        data: {
          question: dto.question,
          answer: dto.answer,
          rank: newRank,
          module_id: dto.module_id,
          status_id: 1,
        },
      });

      return res
    } catch (error) {
      throw error
    }
  }

  async findAll(module_id: bigint, dto: FaqPaginationDto) {
    try {
      let conditions: any[] = [];
      let searchWord = '';
      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { question: { contains: searchWord, mode: "insensitive" } },
            { answer: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (dto?.status_id) {
        conditions.push({
          OR: [
            { status_id: dto.status_id },
          ]
        });
      }
      const page = dto?.page || 1
      const rowsPerPage = dto?.rowsPerPage || 1000
      let faq: any;
      if (dto && dto.page && dto.rowsPerPage) {
        faq = await this.prisma.fAQ.findMany({
          skip: (page - 1) * rowsPerPage,
          take: rowsPerPage,
          where: {
            module_id,
            AND: conditions
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            question: true,
            answer: true,
            rank: true,
            status: {
              select: {
                id: true,
                title: true,
              }
            },
            created_at: true,
          }
        })
      } else {
        faq = await this.prisma.fAQ.findMany({
          where: {
            module_id,
            AND: conditions,
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            question: true,
            answer: true,
            rank: true,
            status: {
              select: {
                id: true,
                title: true,
              }
            },
            created_at: true,
          }
        })
      }
      const module = await this.prisma.fAQModule.findUnique({
        where: {
          id: module_id,
        },
      });
      const total = await this.prisma.fAQ.count({
        where: {
          module_id,
          AND: conditions
        },
      });
      return { Total: total, FAQ: faq, Module: module };
    } catch (error) {
      throw error
    }
  }

  async findOne(faq_id: bigint) {
    try {
      const faq = await this.prisma.fAQ.findUnique({
        where: {
          id: faq_id,
        },
        select: {
          id: true,
          question: true,
          answer: true,
          rank: true,
          status: {
            select: {
              id: true,
              title: true,
            }
          },
          created_at: true,
        }
      })
      return faq;
    } catch (error) {
      throw error
    }
  }

  async update(id: bigint, updateFaqDto: UpdateFaqDto) {
    try {
      const { rank, ...updateFields } = updateFaqDto;

      const currentFAQ = await this.prisma.fAQ.findUnique({
        where: { id },
      });

      if (!currentFAQ) {
        throw new BadRequestException(`FAQ not found.`);
      }

      const currentRank = currentFAQ.rank;
      if (rank && currentRank !== BigInt(rank)) {
        if (currentRank < rank) {
          await this.prisma.fAQ.updateMany({
            where: {
              module_id: currentFAQ.module_id,
              rank: {
                gt: currentRank,
                lte: rank,
              },
            },
            data: {
              rank: { decrement: BigInt(1) },
            },
          });
        } else {
          await this.prisma.fAQ.updateMany({
            where: {
              module_id: currentFAQ.module_id,
              rank: {
                gte: rank,
                lt: currentRank,
              },
            },
            data: {
              rank: { increment: BigInt(1) },
            },
          });
        }
      }

      const updatedFAQ = await this.prisma.fAQ.update({
        where: { id },
        data: {
          ...updateFields,
          ...(rank && { rank: rank }),
        },
      });

      return updatedFAQ
    } catch (error) {
      throw error
    }
  }

  async remove(faq_id: bigint) {
    try {
      if (!faq_id) {
        throw new BadRequestException("No FAQ ID provided for deletion.");
      }

      const faqToDelete = await this.prisma.fAQ.findUnique({
        where: {
          id: faq_id,
        },
        select: {
          rank: true,
        },
      });

      if (!faqToDelete) {
        throw new BadRequestException("FAQ not found.");
      }

      const deletedFaq = await this.prisma.fAQ.delete({
        where: {
          id: faq_id,
        },
      });

      await this.prisma.fAQ.updateMany({
        where: {
          rank: {
            gt: faqToDelete.rank,
          },
        },
        data: {
          rank: {
            decrement: BigInt(1),
          },
        },
      });

      return deletedFaq;
    } catch (error) {
      throw error;
    }
  }

  async clientFaq() {
    try {
      const allFaqs = await this.prisma.fAQModule.findMany({
        where: {
          status_id: 1,
        },
        orderBy: {
          rank: 'asc'
        },
        select: {
          id: true,
          name: true,
          desc: true,
          rank: true,
          status: {
            select: {
              id: true,
              title: true,
            }
          },
          _count: {
            select: {
              FAQ: true,
            }
          },
          FAQ: {
            where: {
              status_id: 1,
            },
            orderBy: {
              rank: 'asc'
            },
            select: {
              id: true,
              question: true,
              answer: true,
              rank: true,
              status: {
                select: {
                  id: true,
                  title: true,
                }
              },
            }
          }
        }
      })
      return allFaqs;
    } catch (error) {
      throw error
    }
  }

}

