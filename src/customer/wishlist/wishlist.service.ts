import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { GetWishlistDto } from './dto/get-wishlist.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(user_id: bigint, createWishlistDto: CreateWishlistDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })
      if (user?.is_temporary) {
        throw new UnauthorizedException("Unauthorized.")
      }
      const foundProduct = await this.prisma.product.findUnique({
        where: {
          id: createWishlistDto.product_id
        }
      })
      if (!foundProduct) {
        throw new BadRequestException("Product not found.");
      }
      let res: any = null;
      if (user_id && createWishlistDto?.product_id && createWishlistDto?.list_type) {
        if (createWishlistDto?.list_type === "WISHLIST" ||
          createWishlistDto?.list_type === "SAVEFORLATER" ||
          createWishlistDto?.list_type === "RECENTLYVIEWEDPRODUCTS") {
          let checkProduct = 0;
          let listType = "";
          if (createWishlistDto?.list_type === "WISHLIST") {
            listType = "WISHLIST"
          } else if (createWishlistDto?.list_type === "SAVEFORLATER") {
            listType = "SAVEFORLATER"
          } else if (createWishlistDto?.list_type === "RECENTLYVIEWEDPRODUCTS") {
            listType = "RECENTLYVIEWEDPRODUCTS"
          }

          if (listType === "WISHLIST" || listType === "SAVEFORLATER" || listType === "RECENTLYVIEWEDPRODUCTS") {
            checkProduct = await this.prisma.wishList.count({
              where: {
                AND: [
                  {
                    user_id: user_id
                  },
                  {
                    product_id: createWishlistDto?.product_id
                  },
                  {
                    list_type: listType
                  }
                ]
              }
            });

            if (checkProduct) {
              if (createWishlistDto?.list_type === "WISHLIST" || createWishlistDto?.list_type === "SAVEFORLATER") {
                let message = '';
                if (createWishlistDto.list_type === "WISHLIST") {
                  message = "Product already in wishlist.";
                } else if (createWishlistDto.list_type === "SAVEFORLATER") {
                  message = "Product already saved for later.";
                }
                throw new BadRequestException(message);
              }
            } else {
              res = await this.prisma.wishList.create({
                data: {
                  user_id: user_id,
                  product_id: createWishlistDto?.product_id,
                  list_type: createWishlistDto?.list_type

                }
              });
            }
          }
          return res;
        }
      }
    } catch (error) {
      throw error
    }
  }

  async findAll(user_id: bigint, dto: GetWishlistDto) {
    try {
      const page = dto.page || 1
      const rowsPerPage = dto.rowsPerPage || 1000
      if (dto?.list_type === "WISHLIST" || dto?.list_type === "SAVEFORLATER" || dto?.list_type === "RECENTLYVIEWEDPRODUCTS") {
        const prisma1 = this.prisma.$extends({
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
          },
        })

        const res = await prisma1.wishList.findMany({
          skip: (page - 1) * rowsPerPage,
          take: rowsPerPage,
          orderBy: {
            id: "desc"
          },
          where: {
            AND: [
              {
                user_id: user_id
              },
              {
                list_type: dto?.list_type
              },
              {
                product: {
                  status_id: 1
                }
              }
            ]
          },
          select: {
            id: true,
            list_type: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                sku: true,
                mrp: true,
                average_rating: true,
                images: {
                  select: {
                    src: true,
                  },
                },
                shipping: true,
                out_of_stock: true,
                new_collection: true
              },
            }
          }
        });

        const total_count = await prisma1.wishList.count({
          where: {
            AND: [
              {
                user_id: user_id
              },
              {
                list_type: dto?.list_type
              }
            ]
          }
        });

        return ({ Total: total_count, List: res });
      }

    }
    catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} wishlist`;
  }

  // update(id: number, updateWishlistDto: UpdateWishlistDto) {
  //   return `This action updates a #${id} wishlist`;
  // }

  async remove(list_id: bigint, user_id: bigint) {
    try {
      const found = await this.prisma.wishList.count({
        where: {
          id: list_id,
          user_id
        }
      })
      if (!found) {
        throw new BadRequestException("List not found.")
      }
      const res = await this.prisma.wishList.delete({
        where: {
          id: list_id,
          user_id
        }
      })
      return res;
    } catch (error) {
      throw error
    }
  }
}
