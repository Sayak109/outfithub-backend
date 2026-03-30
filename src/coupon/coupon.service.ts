import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { DiscountType } from '@generated/prisma';
import { FindCouponDto } from './dto/find-coupon.sto';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    private prisma: PrismaService,
  ) { }

  private async checkDiscount(type: string, amount: number, min_order_value?: number) {
    const discount_type = DiscountType[type as keyof typeof DiscountType]
    const commission_charges = await this.prisma.adminSettings.findFirst({
      where: {
        title: "app-settings",
      }
    })
    const {
      adminCommissionCharges,
    } = commission_charges?.metadata as Record<string, any> || {};

    if (discount_type === 'percentage' && amount > adminCommissionCharges) {
      throw new BadRequestException(`Discount should not be greater than ${adminCommissionCharges}%`)
    } else if (discount_type === "fixed") {
      if (!min_order_value || min_order_value <= 0) {
        throw new BadRequestException('Minimum order value is required for fixed discount coupons');
      }
      const minOrderRequired = amount / (adminCommissionCharges / 100);

      if (min_order_value < minOrderRequired) {
        throw new BadRequestException(
          `Minimum order value should be at least ₹${minOrderRequired.toFixed(2)}`
        );
      }
    }
  }

  async create(couponDto: CreateCouponDto) {
    try {
      const get = await this.prisma.coupon.findUnique({
        where: {
          code: couponDto.code
        }
      })
      const discount_type = DiscountType[couponDto.type as keyof typeof DiscountType]
      if (get) {
        throw new BadRequestException("Promo code already exists.")
      }
      await this.checkDiscount(couponDto.type, couponDto.amount, couponDto?.min_order_value)
      const coupon = await this.prisma.coupon.create({
        data: {
          code: couponDto.code,
          desc: couponDto.desc,
          amount: couponDto.amount,
          type: discount_type,
          min_order_value: couponDto.min_order_value,
          expire_at: couponDto.expire_at
        }
      })

      return coupon;
    } catch (error) {
      throw error
    }
  }

  async findAll(findCouponDto: FindCouponDto) {
    try {
      let conditions: any[] = [];
      let searchWord = '';

      if (findCouponDto?.search) {
        let str = (findCouponDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { code: { contains: searchWord, mode: "insensitive" } },
            { desc: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (findCouponDto?.status_id) {
        conditions.push({
          status_id: findCouponDto?.status_id
        });
      }
      let coupon: any;
      if (findCouponDto && findCouponDto?.page && findCouponDto?.rowsPerPage) {
        coupon = await this.prisma.coupon.findMany({
          skip: (findCouponDto?.page - 1) * findCouponDto?.rowsPerPage,
          take: findCouponDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            code: true,
            desc: true,
            amount: true,
            type: true,
            min_order_value: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            expire_at: true,
            updated_at: true
          }
        })
      } else {
        coupon = await this.prisma.coupon.findMany({
          select: {
            id: true,
            code: true,
            desc: true,
            amount: true,
            type: true,
            min_order_value: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            expire_at: true,
            updated_at: true
          }
        })
      }
      const totalCount = await this.prisma.coupon.count({
        where: {
          AND: conditions,
        },
      });

      return { Total: totalCount, Coupons: coupon }
    } catch (error) {
      throw error
    }
  }

  async findOne(coupon_id: bigint) {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: {
          id: coupon_id
        },
        select: {
          id: true,
          code: true,
          desc: true,
          amount: true,
          type: true,
          min_order_value: true,
          status: {
            select: {
              id: true,
              title: true
            }
          },
          created_at: true,
          expire_at: true,
          updated_at: true
        }
      })
      if (!coupon) {
        throw new BadRequestException("No Data found.")
      }
      return coupon;
    } catch (error) {
      throw error
    }
  }

  async update(coupon_id: bigint, updateCouponDto: UpdateCouponDto) {
    try {
      if (updateCouponDto.code) {
        const get = await this.prisma.coupon.findUnique({
          where: {
            code: updateCouponDto.code
          }
        })
        if (get) {
          throw new BadRequestException("Promo code already exists.")
        }
      }
      await this.checkDiscount(updateCouponDto.type, updateCouponDto.amount, updateCouponDto?.min_order_value)
      const coupon = await this.prisma.coupon.update({
        where: {
          id: coupon_id
        },
        data: {
          code: updateCouponDto.code,
          desc: updateCouponDto.desc,
          amount: updateCouponDto.amount,
          status_id: updateCouponDto.status_id,
          type: DiscountType[updateCouponDto.type as keyof typeof DiscountType],
          min_order_value: updateCouponDto.min_order_value,
          expire_at: updateCouponDto.expire_at
        }
      })
      return coupon;
    } catch (error) {
      throw error
    }
  }

  async remove(id: bigint) {
    try {
      const coupon = await this.prisma.coupon.delete({
        where: {
          id
        }
      })
      return coupon;
    }
    catch (error) {
      throw error
    }
  }
}
