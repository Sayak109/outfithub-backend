import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBlockedKeywordDto } from './dto/create-blocked-keyword.dto';
import { UpdateBlockedKeywordDto } from './dto/update-blocked-keyword.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetKeywordsDto } from './dto/get-keywords.dto';

@Injectable()
export class BlockedKeywordsService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(Dto: CreateBlockedKeywordDto) {
    try {
      const blockedKeywords: any[] = [];

      for (const val of Dto.keywords) {
        const keyword = val.toLowerCase();

        const isAvailable = await this.prisma.blockedKeywords.count({
          where: {
            keyword: {
              equals: keyword,
              mode: "insensitive",
            },
          },
        });

        if (isAvailable === 0) {
          blockedKeywords.push({
            keyword,
          });
        }
      }

      if (blockedKeywords.length === 0) {
        throw new BadRequestException('All keywords already exist')
      }

      const keywords = await this.prisma.blockedKeywords.createMany({
        data: blockedKeywords,
        skipDuplicates: true,
      });

      return keywords;
    } catch (error) {
      throw error
    }
  }


  async findAll(getKeywordsDto: GetKeywordsDto) {
    try {
      const skip = (getKeywordsDto.page - 1) * getKeywordsDto.rowsPerPage;
      const take = getKeywordsDto?.rowsPerPage

      let conditions: any = [];
      let searchWord: string = '';
      if (getKeywordsDto?.search) {
        var str = (getKeywordsDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { keyword: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      const keyword = await this.prisma.blockedKeywords.findMany({
        skip: skip,
        take: take,
        orderBy: {
          id: 'desc'
        },
        where: {
          AND: conditions
        },
        select: {
          id: true,
          keyword: true,
          created_at: true
        }
      });
      const totalCount = await this.prisma.blockedKeywords.count({
        where: {
          AND: conditions,
        },
      });
      return { Total: totalCount, Keywords: keyword };
    } catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} blockedKeyword`;
  }

  update(id: number, updateBlockedKeywordDto: UpdateBlockedKeywordDto) {
    return `This action updates a #${id} blockedKeyword`;
  }

  async remove(updateBlockedKeywordDto: UpdateBlockedKeywordDto) {
    try {
      const { ids } = updateBlockedKeywordDto;

      const deleted = await this.prisma.blockedKeywords.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return {
        count: deleted.count,
      };
    } catch (error) {
      throw new Error(`Failed to delete keywords: ${error.message}`);
    }
  }

}
