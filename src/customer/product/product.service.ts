import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }

  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAllProducts(dto: PaginationDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, reel: true },
              compute(reels) {
                if (reels.reel) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/reel/${reels.reel}`;
                }
                else {
                  return ""
                }
              },
            },
            thumbnail: {
              needs: { seller_id: true, thumbnail: true },
              compute(reels) {
                if (reels.thumbnail) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/thumbnail/${reels.thumbnail}`;
                }
                else {
                  return ""
                }
              },
            },
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
          }
        },
      });
      let conditions: any[] = [];
      let searchWord = '';

      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (dto?.link) {
        const seller = await this.prisma.sellerStoreFront.findUnique({
          where: {
            link: dto?.link
          }
        })
        conditions.push({
          seller_id: seller?.user_id
        })
      }
      let product: any;
      if (dto && dto.page && dto.rowsPerPage) {
        product = await prisma1.product.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            approval_status_id: 2,
            AND: conditions
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
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
                sellerStoreFront: true
              }
            }
          }
        });
      } else {
        product = await prisma1.product.findMany({
          where: {
            approval_status_id: 2,
            AND: conditions
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
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
                sellerStoreFront: true
              }
            }
          }
        });
      }
      const totalProductCount = await this.prisma.product.count({
        where: {
          AND: conditions,
          approval_status_id: 2,
        },
      });
      return { Total: totalProductCount, Products: product || [] };
    } catch (error) {
      throw error
    }
  }

  async productDetials(product_id: bigint, user_id?: bigint) {
    try {

      const prisma1 = await this.prisma.$extends({
        result: {
          productImage: {
            src: {
              needs: { product_id: true, src: true },
              compute(src) {
                if (src.src != null && src.src != '' && src.src != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.product_id}/${src.src}`
                } else {
                  return ""
                }
              },
            },
          },
          productCategory: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_CATEGORY_IMAGE_PATH}/${image.id}/${image.image}`
                } else {
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
          customerFeedbackImage: {
            src: {
              needs: { id: true, src: true, feedback_id: true },
              compute(image) {
                return image.src
                  ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.CUSTOMER_FEEDBACK_IMAGE_PATH}/${image.feedback_id}/${image.src}`
                  : "";
              },
            },
          },
        },
      })

      const res = await prisma1.product.findUnique({
        where: {
          approval_status_id: 2,
          status_id: 1,
          id: product_id,
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
          customerFeedback: {
            where: {
              user_id
            },
            select: {
              id: true,
              ratings: true,
              description: true,
              anonymous: true,
              created_at: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
              userReviewImage: {
                select: {
                  id: true,
                  src: true,
                }
              }
            }
          },
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
          images: {
            orderBy: {
              id: "asc"
            },
            select: {
              id: true,
              src: true,
              alt: true,
              main_image: true,
              display_rank: true
            }
          },
          categories: {
            orderBy: {
              id: "asc"
            },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true
            }
          },
          attributes: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          seller: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              sellerProfile: {
                select: {
                  gender: true,
                  business_logo: true,
                  business_name: true,
                  business_tag: true,
                }
              }
            }
          },
          wishList: {
            where: {
              user_id: user_id
            }
          }
        }
      });

      const meta = await this.prisma.metaData.findFirst({
        where: {
          table_id: product_id,
          table_name: "product",
          key: "_product_meta",
        }
      })
      const ratingCount = await this.prisma.customerFeedback.count({
        where: {
          product_id: product_id,
          approval_status_id: 2,
        },
      });
      const reviewCount = await this.prisma.customerFeedback.count({
        where: {
          product_id: product_id,
          approval_status_id: 2,
          NOT: {
            description: null,
          },
          AND: {
            description: {
              not: '',
            }
          }
        },
      });
      (res as any).ratingCount = ratingCount;
      (res as any).reviewCount = reviewCount;
      (res as any).meta_data = meta?.value ? JSON.parse(meta?.value) : null

      if (res) {
        if (user_id && res?.wishList && res.wishList.length > 0) {
          const wishItem = res.wishList[0];
          res.wishList = {
            id: wishItem.id,
            list_type: wishItem.list_type
          } as any;
        } else {
          res.wishList = null as any;
        }

        if (user_id && res?.customerFeedback && res.customerFeedback.length > 0) {
          (res as any).canReview = true;

        } else if (user_id) {
          const findOrder = await this.prisma.order.findFirst({
            where: {
              customer_id: user_id,
              order_items: {
                some: {
                  product_id: res.id,
                  order_status_id: 5
                }
              }
            }
          });

          if (findOrder) {
            (res as any).canReview = true;
          } else {
            (res as any).canReview = false;
          }

        } else {
          (res as any).canReview = false;
        }

        if (res?.attributes) {
          let attributes = await Promise.all(res!.attributes.map(async (attr: any, j: any) => {
            let options = await this.prisma.productToProductTerm.findMany({
              where: {
                product_id: res!.id,
                attribute_id: attr.id
              },
              orderBy: {
                id: "asc"
              },
              select: {
                attributeTerms: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            });

            let customOptions: { id: bigint; name: string; slug: string }[] = [];
            options.map((op: any) => {
              customOptions.push({
                id: op.attributeTerms.id,
                name: op.attributeTerms.name,
                slug: op.attributeTerms.slug
              });
            })

            attr.terms = customOptions;
            return attr;
          }));
          res!.attributes = attributes;
        }
      }

      if (!res) {
        return []
      }

      return res;
    }
    catch (error) {
      throw error
    }
  }

  async findAllBySeller(link: string, dto: PaginationDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, reel: true },
              compute(reels) {
                if (reels.reel) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/reel/${reels.reel}`;
                }
                else {
                  return ""
                }
              },
            },
            thumbnail: {
              needs: { seller_id: true, thumbnail: true },
              compute(reels) {
                if (reels.thumbnail) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/thumbnail/${reels.thumbnail}`;
                }
                else {
                  return ""
                }
              },
            },
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
          }
        },
      });
      const findSeller = await this.prisma.sellerStoreFront.findUnique({
        where: {
          link: link
        }
      })
      if (!findSeller) {
        throw new BadRequestException("Seller page link not found.")
      }
      const seller = await prisma1.user.findUnique({
        where: {
          id: findSeller.id,
        },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
          sellerStoreFront: true
        }
      })
      let conditions: any[] = [];
      let searchWord = '';

      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      let product: any;
      let reels: any;
      if (dto && dto.page && dto.rowsPerPage) {
        product = await prisma1.product.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            seller_id: findSeller.id,
            approval_status_id: 2,
            AND: conditions
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
        reels = await prisma1.reels.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            seller_id: findSeller.id,
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            likes: true,
            views: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })

      } else {
        product = await prisma1.product.findMany({
          where: {
            seller_id: findSeller.id,
            approval_status_id: 2,
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
        reels = await prisma1.reels.findMany({
          where: {
            seller_id: findSeller.id,
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            likes: true,
            views: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true,
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      }
      const totalProductCount = await this.prisma.product.count({
        where: {
          seller_id: findSeller.id,
          approval_status_id: 2,
          AND: conditions
        },
      });

      let enrichedReels: any = ""
      if (reels && reels.length) {
        enrichedReels = await Promise.all(
          reels.map(async (reel) => {
            const products = await prisma1.product.findMany({
              where: {
                id: { in: reel.product_ids },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                mrp: true,
                images: true
              },
            });

            return {
              ...reel,
              products,
              product_ids: undefined,
            };
          })
        );
      }
      const totalReelsCount = await this.prisma.reels.count({
        where: {
          seller_id: findSeller.id,
          approval_status_id: 2,
          AND: conditions
        },
      });
      return { Seller: seller, TotalProducts: totalProductCount, Products: product || [], TotalReels: totalReelsCount, Reels: enrichedReels || [] };
    } catch (error) {
      throw error
    }
  }


  async findSellerData(sellerSlug: string) {
    try {
      const seller = await this.prisma.sellerStoreFront.findUnique({
        where: {
          link: sellerSlug
        },
        select: {
          font: true,
          link: true,
          primary_colour: true,
          secondary_colour: true,
        }
      });
      return seller
    } catch (error) {
      throw error;
    }
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
