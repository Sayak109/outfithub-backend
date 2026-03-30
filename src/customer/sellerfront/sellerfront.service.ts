import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSellerfrontDto } from './dto/create-sellerfront.dto';
import { UpdateSellerfrontDto } from './dto/update-sellerfront.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SellerfrontService {
  constructor(private readonly prisma: PrismaService) { }

  async getMetaForSellerFront(storelink: string) {

    try {
      const sellerFront = await this.prisma.sellerStoreFront.findFirst({
        where: {
          link: storelink
        }
      });

      if (sellerFront) {
        const meta = await this.prisma.metaData.findFirst({
          where: {
            table_id: sellerFront.user_id,
            table_name: "sellerfront",
            key: "_sellerfront_meta",
          }
        });
        // console.log(sellerFront, "hsdfuirweryuruwetgruiyriu8234")
        if (meta) {
          // console.log(JSON.parse(meta.value), "ghsdfghhgdsghdsfhg")
          return JSON.parse(meta.value)
        }
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || "Failed to get meta data for seller front");
    }
  }
}
