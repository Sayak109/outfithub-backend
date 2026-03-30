import { Injectable } from '@nestjs/common';
import { CreateSellerAggrementDto } from './dto/create-seller-aggrement.dto';
import { UpdateSellerAggrementDto } from './dto/update-seller-aggrement.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SellerAggrementService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createSellerAggrementDto: CreateSellerAggrementDto) {
    try {
      const aggrement = await this.prisma.sellerAggrement.create({
        data: createSellerAggrementDto,
      });

      return aggrement;
    } catch (error) {
      throw error
    }
  }

  async findAll() {
    try {
      const aggrement = await this.prisma.sellerAggrement.findMany({});

      return aggrement;
    } catch (error) {
      throw error
    }
  }

  async findOne(id: bigint) {
    try {
      const aggrement = await this.prisma.sellerAggrement.findUnique({
        where: {
          id,
        },
      });
      if (!aggrement) return []

      return aggrement;
    } catch (error) {
      throw error
    }
  }

  async update(id: number, updateSellerAggrementDto: UpdateSellerAggrementDto) {
    try {
      const aggrement = await this.prisma.sellerAggrement.update({
        where: {
          id,
        },
        data: updateSellerAggrementDto,
      });

      return aggrement;
    } catch (error) {
      throw error
    }
  }

  async remove(id: bigint) {
    try {
      const aggrement = await this.prisma.sellerAggrement.delete({
        where: {
          id,
        },
      });

      return aggrement;
    } catch (error) {
      throw error
    }
  }
}
