import { Injectable } from '@nestjs/common';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { PaginationDto } from '../product/dto/pagination.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class LiveService {
  constructor(private prisma: PrismaService) { }

  create(createLiveDto: CreateLiveDto) {
    return 'This action adds a new live';
  }

  async findAll(dto: PaginationDto,) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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
        },
      });
      const page = dto?.page || 1
      const rowsPerPage = dto?.rowsPerPage || 1000
      const live = await prisma1.live.findMany({
        skip: (page - 1) * rowsPerPage,
        take: rowsPerPage,
        where: {
          isLive: true
        },
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          slug: true,
          isLive: true,
          product_ids: true,
          source: true,
          youtubeLink: true,
          facebookLink: true,
          hostId: true,
          hostname: true,
          roomId: true,
          streamId: true,
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              sellerProfile: {
                select: {
                  business_logo: true,
                  business_name: true,
                  business_tag: true
                }
              }
            }
          },
          created_at: true,
          updated_at: true
        }
      })
      const total = await this.prisma.live.count({
        where: {
          isLive: true
        },
      });

      if (live && live.length) {
        const enrichedLive = await Promise.all(
          live.map(async (live) => {
            const products = await prisma1.product.findMany({
              where: {
                id: { in: live.product_ids },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                mrp: true,
                average_rating: true,
                images: {
                  select: {
                    id: true,
                    name: true,
                    alt: true,
                    src: true,
                    main_image: true,
                    created_at: true
                  }
                }
              },
            });

            return {
              ...live,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: total, Live: enrichedLive };
      }
      return { Total: total, Live: live || [] };
    } catch (error) {
      throw error
    }
  }

  async findOne(slug: string) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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
        },
      });
      const live = await prisma1.live.findUnique({
        where: {
          slug
        },
        select: {
          id: true,
          slug: true,
          isLive: true,
          product_ids: true,
          source: true,
          youtubeLink: true,
          facebookLink: true,
          hostId: true,
          hostname: true,
          roomId: true,
          streamId: true,
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              sellerProfile: {
                select: {
                  business_logo: true,
                  business_name: true,
                  business_tag: true
                }
              }
            }
          },
          created_at: true,
          updated_at: true
        }
      })
      if (!live) return null;

      const productIds = live.product_ids || [];
      const products = await prisma1.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          mrp: true,
          average_rating: true,
          images: {
            select: {
              id: true,
              name: true,
              alt: true,
              src: true,
              main_image: true,
              created_at: true,
            },
          },
        },
      });

      return {
        Live: {
          ...live,
          products,
          product_ids: undefined,
        },
      };
    } catch (error) {
      throw error
    }
  }

  update(id: number, updateLiveDto: UpdateLiveDto) {
    return `This action updates a #${id} live`;
  }

  remove(id: number) {
    return `This action removes a #${id} live`;
  }
}
