import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { createMetaData, generateSlug } from '@/common/helper/common.helper';
import { GetProductDto } from './dto/get-product.dto';
import * as path from 'path';
import * as fs from 'fs';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createProductDto: CreateProductDto) {
    try {
      const productSlug = await generateSlug(
        createProductDto.name,
        this.prisma.product,
        'slug'
      );
      const product = await this.prisma.product.create({
        data: {
          seller_id: createProductDto.seller_id,
          name: createProductDto.name,
          slug: productSlug,
          description: createProductDto.desc,
          sku: createProductDto?.sku,
          mrp: createProductDto?.mrp,
          sales_price: createProductDto?.sales_price,
          shipping: createProductDto.shipping,
          tax: createProductDto.tax,
          stock_quantity: createProductDto.stock_quantity,
          out_of_stock: createProductDto.out_of_stock || false,
          new_collection: createProductDto.new_collection || true,
          approval_status_id: 2,
          status_id: createProductDto.status_id ?? 1,
        },
      });
      if (createProductDto?.category_ids) {
        const res = await this.prisma.product.update({
          where: {
            id: product.id
          },
          data: {
            categories: {
              connect: createProductDto.category_ids.map(id => ({ id })),
            },
          }
        });
      }
      if (createProductDto?.attribute?.length) {
        const attributeInsertData: any = [];
        for (const attr of createProductDto.attribute) {
          const res = await this.prisma.product.update({
            where: {
              id: product.id
            },
            data: {
              attributes: {
                connect: { id: attr.id },
              },
            }
          });
          for (const valueId of attr.values) {
            attributeInsertData.push({
              product_id: product.id,
              attribute_id: attr.id,
              attribute_term_id: valueId,
            });
          }
        }
        await this.prisma.productToProductTerm.createMany({
          data: attributeInsertData,
        });
      }

      if (product) {
        let metaDetails = {
          meta_title: createProductDto?.meta_title,
          meta_description: createProductDto?.meta_description,
          meta_keyword: createProductDto?.meta_keyword,
          other_meta: createProductDto?.other_meta
        }
        await createMetaData(
          product.id,
          "product",
          "_product_meta",
          JSON.stringify(metaDetails)
        )
      }

      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async findAll(getProductDto: GetProductDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          productImage: {
            src: {
              needs: { id: true, src: true, product_id: true, },
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

      let conditions: any[] = [];
      let searchWord = '';

      if (getProductDto?.search) {
        let str = (getProductDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (getProductDto?.status_id) {
        conditions.push({
          status_id: getProductDto?.status_id
        });
      }

      if (getProductDto?.approval_status_id) {
        conditions.push({
          approval_status_id: getProductDto?.approval_status_id
        });
      }

      let product: any;
      if (getProductDto && getProductDto.page && getProductDto.rowsPerPage) {
        product = await prisma1.product.findMany({
          skip: (getProductDto?.page - 1) * getProductDto?.rowsPerPage,
          take: getProductDto?.rowsPerPage,
          where: {
            seller: {
              approval_status_id: 2,
              account_status_id: {
                in: [1, 4]
              }
            },
            AND: conditions
          },
          orderBy: {
            id: "desc"
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
            created_at: true,
          }
        });
      } else {
        product = await prisma1.product.findMany({
          where: {
            seller: {
              approval_status_id: 2,
              account_status_id: {
                in: [1, 4]
              }
            },
            AND: conditions
          },
          orderBy: {
            id: "desc"
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
            created_at: true,
          }
        });
      }

      const totalCount = await this.prisma.product.count({
        where: {
          seller: {
            approval_status_id: 2,
            account_status_id: {
              in: [1, 4]
            }
          },
          AND: conditions,
        },
      });
      return { Total: totalCount, Product: product };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async findOne(product_id: bigint) {
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
          }
        },
      })

      const res = await prisma1.product.findFirst({
        where: {
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
            select: {
              id: true,
              name: true,
              src: true,
              alt: true,
              main_image: true,
              display_rank: true
            }
          },
          categories: {
            orderBy: {
              id: 'asc'
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
              id: true,
              first_name: true,
              last_name: true,
              email: true
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
      if (res && res?.attributes) {
        let attributes = await Promise.all(res!.attributes.map(async (attr: any, j: any) => {

          let options = await this.prisma.productToProductTerm.findMany({
            where: {
              product_id: res!.id,
              attribute_id: attr.id
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
      (res as any).meta_data = meta?.value ? JSON.parse(meta?.value) : null

      if (!res) {
        return []
      }

      return res;
    } catch (error) {
      return error
    }
  }

  async update(product_id: bigint, updateDto: UpdateProductDto) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: product_id },
        include: {
          categories: true,
          attributes: true,
        },
      });

      if (!existingProduct) {
        throw new BadRequestException('Product not found');
      }

      let updatedSlug = existingProduct.slug;
      if (updateDto.name && updateDto.name !== existingProduct.name) {
        updatedSlug = await generateSlug(updateDto.name, this.prisma.product, 'slug');
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id: product_id },
        data: {
          name: updateDto.name,
          slug: updatedSlug,
          description: updateDto.desc,
          sku: updateDto.sku,
          mrp: updateDto.mrp,
          sales_price: updateDto.sales_price,
          shipping: updateDto.shipping,
          tax: updateDto.tax,
          stock_quantity: updateDto.stock_quantity,
          out_of_stock: updateDto.out_of_stock,
          new_collection: updateDto.new_collection,
          status_id: updateDto.status_id ?? existingProduct.status_id,
        },
      });

      // ---- CATEGORY UPDATE ----
      if (updateDto.category_ids) {
        await this.prisma.product.update({
          where: { id: product_id },
          data: {
            categories: {
              set: [],
            },
          },
        });

        if (updateDto.category_ids.length > 0) {
          await this.prisma.product.update({
            where: { id: product_id },
            data: {
              categories: {
                connect: updateDto.category_ids.map(id => ({ id })),
              },
            },
          });
        }
      }

      // ---- ATTRIBUTE UPDATE ----
      if (updateDto.attribute) {
        await this.prisma.productToProductTerm.deleteMany({
          where: {
            product_id: product_id,
          },
        });

        await this.prisma.product.update({
          where: { id: product_id },
          data: {
            attributes: {
              set: [],
            },
          },
        });

        const attributeInsertData: any[] = [];

        for (const attr of updateDto.attribute) {
          await this.prisma.product.update({
            where: { id: product_id },
            data: {
              attributes: {
                connect: { id: attr.id },
              },
            },
          });

          for (const valueId of attr.values) {
            attributeInsertData.push({
              product_id: product_id,
              attribute_id: attr.id,
              attribute_term_id: valueId,
            });
          }
        }

        if (attributeInsertData.length > 0) {
          await this.prisma.productToProductTerm.createMany({
            data: attributeInsertData,
          });
        }
      }
      if (updatedProduct) {
        let isProductAvailable = await this.prisma.metaData.findFirst({
          where: {
            table_id: updatedProduct?.id,
            table_name: 'product',
            key: '_product_meta'
          }
        });
        let metaDetails = {
          meta_title: updateDto?.meta_title,
          meta_description: updateDto?.meta_description,
          meta_keyword: updateDto?.meta_keyword,
          other_meta: updateDto?.other_meta
        }
        if (isProductAvailable) {
          await this.prisma.metaData.update({
            where: {
              id: isProductAvailable?.id
            },
            data: {
              table_id: updatedProduct.id,
              table_name: "product",
              key: "_product_meta",
              value: JSON.stringify(metaDetails)
            }
          });
        } else {
          await createMetaData(
            updatedProduct.id,
            "product",
            "_product_meta",
            JSON.stringify(metaDetails)
          )
        }
      }

      return updatedProduct;
    } catch (error) {
      throw error
    }
  }

  async updateStatus(product_id: bigint, dto: UpdateProductStatusDto) {
    try {
      const update = await this.prisma.product.update({
        where: {
          id: product_id
        },
        data: {
          status_id: dto.status_id,
          approval_status_id: dto.approval_status_id
        }
      })
      return update;
    } catch (error) {
      throw error;
    }
  }

  async updateImage(product_id: bigint, file) {
    try {
      const imageFileName = file?.filename ?? '';

      let dataToUpdate: any = {}
      if (imageFileName === "null") {
        dataToUpdate.images = null;
      } else if (imageFileName !== '') {
        dataToUpdate.images = `${imageFileName}`;
      }

      const product = await this.prisma.productImage.create({
        data: {
          name: imageFileName,
          src: imageFileName,
          alt: imageFileName,
          product_id: product_id,
        }
      });

      return product;
    } catch (error: any) {
      throw error;
    }
  }

  async updateCoverImage(product_id: bigint, file: { filename: string, path: string }) {
    try {
      const find_cover_image = await this.prisma.productImage.findMany({
        where: { main_image: true, product_id: product_id },
      })
      if (find_cover_image) {
        for (const cover_img of find_cover_image) {
          const remove_cover_img = this.removeImage(cover_img?.id)
        }
      }

      const imageFileName = file?.filename ?? '';
      if (!imageFileName) {
        throw new BadRequestException('Please add a product cover image.');
      }

      const image = await this.prisma.productImage.create({
        data: {
          name: imageFileName,
          src: imageFileName,
          alt: imageFileName,
          product_id: product_id,
          main_image: true
        }
      });

      return image;
    } catch (error: any) {
      throw error;
    }
  }


  async removeImage(image_id: bigint) {
    try {
      const image = await this.prisma.productImage.findUnique({
        where: { id: image_id },
      });

      if (!image) {
        throw new Error('Image not found');
      }
      const imagePath = path.join(
        process.env.IMAGE_PATH!,
        process.env.PRODUCT_IMAGE_PATH!,
        image.product_id.toString(),
        image.name!
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      const deleted = await this.prisma.productImage.delete({
        where: { id: image_id },
      });
      return deleted;

    } catch (error: any) {
      throw error;
    }
  }

  // async remove(product_id: bigint) {
  //   try {
  //     const productImages = await this.prisma.productImage.findMany({
  //       where: {
  //         id: product_id
  //       }
  //     });
  //     for (const image of productImages) {
  //       const deleteImages = await this.removeImage(image.id)
  //     }
  //     await this.prisma.productImage.deleteMany({ where: { product_id } })
  //     await this.prisma.cart.deleteMany({ where: { product_id } })
  //     const product = await this.prisma.product.delete({
  //       where: {
  //         id: product_id
  //       }
  //     });

  //     return product;
  //   } catch (error: any) {
  //     throw new Error(`Failed to deleted product: ${error.message}`);
  //   }
  // }
  async remove(product_id: bigint) {
    try {
      const cartsToDelete = await this.prisma.cart.findMany({
        where: { product_id },
        select: { id: true },
      });
      const cartIds = cartsToDelete.map(cart => cart.id);
      if (cartIds.length > 0) {
        await this.prisma.cartAttributeTerm.deleteMany({
          where: { cart_id: { in: cartIds } }
        });
      }
      await this.prisma.cart.deleteMany({
        where: { id: { in: cartIds } }
      });
      await this.prisma.wishList.deleteMany({
        where: { product_id }
      });
      const productImages = await this.prisma.productImage.findMany({
        where: {
          product_id: product_id,
        }
      });
      for (const image of productImages) {
        await this.removeImage(image.id)
      }
      await this.prisma.productImage.deleteMany({
        where: {
          product_id: product_id
        }
      });

      const product = await this.prisma.product.delete({
        where: {
          id: product_id
        }
      });

      return product;
    } catch (error: any) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
