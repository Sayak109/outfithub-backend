import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto } from '../product/dto/pagination.dto';

@Injectable()
export class AllsellerService {
  constructor(private prisma: PrismaService) { }


  async findAll() {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          sellerProfile: {
            business_logo: {
              needs: { user_id: true, business_logo: true },
              compute(id_proof) {
                if (id_proof.business_logo) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${id_proof.user_id}/${id_proof.business_logo}`;
                } else {
                  return "";
                }
              }
            }
          },
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          },
        },
      });
      const topSellers = await this.prisma.orderItems.groupBy({
        by: ['seller_id'],
        where: {
          order_status_id: {
            in: [5],
          },
        },
        _sum: {
          item_quantity: true,
        },
        orderBy: {
          _sum: {
            item_quantity: 'desc',
          },
        },
        take: 5,
      });

      const topSellerIds = topSellers.map((seller) => seller.seller_id);

      // 3. Fetch seller user info
      const sellers = await prisma1.user.findMany({
        where: {
          id: {
            in: topSellerIds,
          },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          _count: {
            select: {
              Product: {
                where: {
                  approval_status_id: 2
                }
              }
            }
          },
          sellerProfile: {
            select: {
              slug: true,
              business_name: true,
              business_logo: true,
              business_tag: true,
            },
          },
          sellerStoreFront: {
            select: {
              id: true,
              font: true,
              primary_colour: true,
              secondary_colour: true,
              link: true
            }
          }
        },
      });

      const topSellerList = topSellers.map((top) => {
        const seller = sellers.find((s) => s.id === top.seller_id);

        return {
          sellerId: seller?.id,
          name: `${seller?.first_name || ''} ${seller?.last_name || ''}`.trim(),
          email: seller?.email,
          sellerProfile: seller?.sellerProfile,
          sellerStoreFront: seller?.sellerStoreFront,
          totalProducts: seller?._count.Product || 0,
          totalItemsSold: top._sum.item_quantity || 0,
        };
      });
      return { TopSeller: topSellerList }
    } catch (error) {
      throw error
    }
  }

  async findAllSellerProduct(id: bigint, dto: PaginationDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          },
          sellerProfile: {
            business_logo: {
              needs: { user_id: true, business_logo: true },
              compute(id_proof) {
                if (id_proof.business_logo) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${id_proof.user_id}/${id_proof.business_logo}`;
                } else {
                  return "";
                }
              }
            }
          },
          productImage: {
            src: {
              needs: { product_id: true, src: true },
              compute(image) {
                if (image.src) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${image.product_id}/${image.src}`;
                }
                else {
                  return ""
                }
              },
            },
          },
        },
      });
      const seller = await prisma1.sellerProfile.findUnique({
        where: {
          user_id: id
        },
      })

      if (!seller) {
        throw new BadRequestException(`Seller not found`);
      }

      const User = await prisma1.user.findUnique({
        where: {
          id: seller?.user_id
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          image: true,
          sellerProfile: {
            select: {
              slug: true,
              business_name: true,
              business_logo: true,
              business_tag: true,
            },
          },
        }
      })

      let product: any;
      if (dto && dto.page && dto.rowsPerPage) {
        product = await prisma1.product.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            approval_status_id: 2,
            seller_id: seller?.user_id
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            sku: true,
            mrp: true,
            sales_price: true,
            shipping: true,
            tax: true,
            stock_quantity: true,
            average_rating: true,
            new_collection: true,
            out_of_stock: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            images: true,
            categories: {
              orderBy: {
                id: "asc"
              },
              select: {
                id: true,
                name: true,
              }
            },
          }
        });
      } else {
        product = await prisma1.product.findMany({
          where: {
            approval_status_id: 2,
            seller_id: seller?.user_id
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            sku: true,
            mrp: true,
            sales_price: true,
            shipping: true,
            tax: true,
            stock_quantity: true,
            average_rating: true,
            new_collection: true,
            out_of_stock: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            images: true,
            categories: {
              orderBy: {
                id: "asc"
              },
              select: {
                id: true,
                name: true,
              }
            },
          }
        });
      }
      const totalProductCount = await this.prisma.product.count({
        where: {
          seller_id: seller?.user_id,
          approval_status_id: 2,
        },
      });
      return { Total: totalProductCount, Seller: User, Products: product || [] };

    } catch (error) {
      throw error
    }
  }

}
