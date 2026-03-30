import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { createMetaData, generateSlug } from '@/common/helper/common.helper';
import { GetAllCategoryDto } from './dto/get-all-category.dto';
import { GetCategoryDto } from './dto/get-category.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createCategoryDto: CreateCategoryDto, file) {
    try {
      const imageFileName = file?.filename ?? '';
      let category_image: any;
      if (imageFileName === "null") {
        category_image = null;
      } else if (imageFileName !== '') {
        category_image = `${imageFileName}`;
      }
      const categorySlug = await generateSlug(
        createCategoryDto.name,
        this.prisma.productCategory,
        'slug'
      );

      let parent_category: bigint | null = null;
      if (createCategoryDto.parent_id !== undefined && createCategoryDto.parent_id !== null) {
        parent_category = BigInt(createCategoryDto.parent_id);
        const existingSub = await this.prisma.productCategory.findFirst({
          where: {
            name: createCategoryDto.name,
            parent_category: parent_category,
          },
        });

        if (existingSub) {
          throw new BadRequestException(`Subcategory with name "${createCategoryDto.name}" already exists.`);
        }

      } else {
        const existingParent = await this.prisma.productCategory.findFirst({
          where: {
            name: createCategoryDto.name,
            parent_category: null,
          },
        });

        if (existingParent) {
          throw new BadRequestException(`Category with name "${createCategoryDto.name}" already exists.`);
        }
      }
      const category = await this.prisma.productCategory.create({
        data: {
          name: createCategoryDto.name,
          slug: categorySlug,
          description: createCategoryDto.desc,
          show_home_page: createCategoryDto.show_home_page ?? false,
          parent_category: parent_category,
          image: category_image,
          status_id: 1,
        },
      });

      if (category) {
        let metaDetails = {
          meta_title: createCategoryDto?.meta_title,
          meta_description: createCategoryDto?.meta_description,
          meta_keyword: createCategoryDto?.meta_keyword,
          other_meta: createCategoryDto.other_meta
        }
        await createMetaData(
          category.id,
          "productCategory",
          "_category_meta",
          JSON.stringify(metaDetails)
        )
      }

      return category;
    } catch (error: any) {
      throw error
    }
  }

  async findAll(getAllCategoryDto: GetAllCategoryDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          productCategory: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_CATEGORY_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return ""
                }
              },
            },
          }
        },
      })

      let conditions: any[] = [];
      let searchWord = '';

      if (getAllCategoryDto?.search) {
        let str = (getAllCategoryDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (getAllCategoryDto?.status_id) {
        conditions.push({
          status_id: getAllCategoryDto?.status_id
        });
      }
      // if (getAllCategoryDto?.subcat_status_id) {
      //   conditions.push({
      //     sub_categories: {
      //       some: {
      //         status_id: getAllCategoryDto?.subcat_status_id
      //       }
      //     }
      //   });
      // }
      if (getAllCategoryDto?.parent) {
        conditions.push({
          parent_category: null
        });
      }


      let res: any;
      if (getAllCategoryDto && getAllCategoryDto?.page && getAllCategoryDto?.rowsPerPage) {
        res = await prisma1.productCategory.findMany({
          skip: (getAllCategoryDto?.page - 1) * getAllCategoryDto?.rowsPerPage,
          take: getAllCategoryDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            image: true,
            description: true,
            display_rank: true,
            sub_categories: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                description: true,
                parent_category: true,
                display_rank: true,
                _count: {
                  select: {
                    products: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });
      } else {
        res = await prisma1.productCategory.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            description: true,
            display_rank: true,
            sub_categories: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                description: true,
                display_rank: true,
                parent_category: true,
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });
      }

      const metadata = await this.prisma.metaData.findMany({
        where: {
          table_name: "productCategory",
          key: "_category_meta"
        }
      });

      const metaMap = metadata.reduce((acc, item) => {
        try {
          const parsed = JSON.parse(item.value);

          // If other_meta is a stringified JSON, parse it too
          if (parsed.other_meta && typeof parsed.other_meta === "string") {
            try {
              parsed.other_meta = JSON.parse(parsed.other_meta);
            } catch (e) {
              // leave as string if parsing fails
            }
          }

          acc[Number(item.table_id)] = parsed;
        } catch (e) {
          acc[Number(item.table_id)] = {}; // fallback if invalid JSON
        }
        return acc;
      }, {} as Record<string | number, any>);

      // Merge into categories
      const mergedCategories = res.map((cat: any) => {
        return {
          ...cat,
          meta_data: metaMap[cat.id] || null
        };
      });

      const totalCount = await this.prisma.productCategory.count({
        where: {
          AND: conditions,
        },
      });

      return { Total: totalCount, Categories: mergedCategories };
    } catch (error) {
      return error
    }
  }

  async findOne(parent_id: bigint, getCategoryDto: GetCategoryDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          productCategory: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_CATEGORY_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return ""
                }
              },
            },
          }
        },
      })

      let conditions: any[] = [];
      let searchWord = '';

      if (getCategoryDto?.search) {
        let str = (getCategoryDto?.search).trim();
        let newStr = str.split(" ");
        searchWord = newStr.join(' & ');
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (getCategoryDto?.status_id) {
        conditions.push({
          status_id: getCategoryDto?.status_id
        });
      }
      const mainCategory = await prisma1.productCategory.findFirst({
        where: {
          id: BigInt(parent_id),
        },
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          // parent: true,
          description: true,
          display_rank: true,
          image: true,
          show_home_page: true,
          status_id: true,
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      let res: any;
      if (getCategoryDto && getCategoryDto?.page && getCategoryDto?.rowsPerPage) {
        res = await prisma1.productCategory.findMany({
          skip: (getCategoryDto?.page - 1) * getCategoryDto?.rowsPerPage,
          take: getCategoryDto?.rowsPerPage,
          orderBy: {
            id: 'desc'
          },
          where: {
            parent_category: parent_id,
            AND: conditions
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            image: true,
            description: true,
            display_rank: true,
            sub_categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                description: true,
                parent_category: true,
                display_rank: true,
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });
      }
      else {
        res = await prisma1.productCategory.findMany({
          where: {
            parent_category: parent_id,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: {
              select: {
                id: true,
                title: true
              }
            },
            image: true,
            description: true,
            display_rank: true,
            sub_categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                description: true,
                parent_category: true,
                display_rank: true,
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });
      }

      const metadata = await this.prisma.metaData.findMany({
        where: {
          table_name: "productCategory",
          key: "_category_meta"
        }
      });

      console.log(metadata, "metadatacategoryMeta");
      const metaMap = metadata.reduce((acc, item) => {
        try {
          const parsed = JSON.parse(item.value);

          // If other_meta is a stringified JSON, parse it too
          if (parsed.other_meta && typeof parsed.other_meta === "string") {
            try {
              parsed.other_meta = JSON.parse(parsed.other_meta);
            } catch (e) {
              // leave as string if parsing fails
            }
          }

          acc[Number(item.table_id)] = parsed;
        } catch (e) {
          acc[Number(item.table_id)] = {}; // fallback if invalid JSON
        }
        return acc;
      }, {} as Record<string | number, any>);

      // Merge into categories
      const mergedCategories = res.map((cat: any) => {
        return {
          ...cat,
          meta_data: metaMap[cat.id] || null
        };
      });
      const totalCount = await this.prisma.productCategory.count({
        where: {
          parent_category: parent_id,
          AND: conditions,
        },
      });
      return { Total: totalCount, Category: mainCategory, SubCategories: mergedCategories };
    } catch (error) {
      return error
    }
  }

  async update(category_id: bigint, updateCategoryDto: UpdateCategoryDto, file) {
    try {
      const imageFileName = file?.filename ?? '';
      let category_image: any;
      if (imageFileName === "null") {
        category_image = null;
      } else if (imageFileName !== '') {
        category_image = `${imageFileName}`;
      }
      if (updateCategoryDto.name === "") {
        throw new BadRequestException("Category name should not be empty")
      }
      const existingCategory = await this.prisma.productCategory.findUnique({
        where: { id: category_id },
      });

      if (
        updateCategoryDto.name &&
        updateCategoryDto.name.toLowerCase() !== existingCategory?.name.toLowerCase()
      ) {
        if (existingCategory?.parent_category === null) {
          const duplicateParent = await this.prisma.productCategory.findFirst({
            where: {
              name: updateCategoryDto.name,
              parent_category: null,
              NOT: { id: category_id },
            },
          });

          if (duplicateParent) {
            throw new BadRequestException(
              `Category with name "${updateCategoryDto.name}" already exists.`
            );
          }
        } else {
          const duplicateSub = await this.prisma.productCategory.findFirst({
            where: {
              name: updateCategoryDto.name,
              parent_category: existingCategory?.parent_category,
              NOT: { id: category_id },
            },
          });

          if (duplicateSub) {
            throw new BadRequestException(
              `Subcategory with name "${updateCategoryDto.name}" already exists.`
            );
          }
        }
      }


      let newSlug = existingCategory?.slug;
      if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory?.name) {
        newSlug = await generateSlug(
          updateCategoryDto.name,
          this.prisma.productCategory,
          'slug'
        );
      }
      const updateData: any = {};

      if (updateCategoryDto.name !== undefined) {
        updateData.name = updateCategoryDto.name;
      }

      if (newSlug !== undefined) {
        updateData.slug = newSlug;
      }

      if (updateCategoryDto.desc !== undefined) {
        updateData.description = updateCategoryDto.desc;
      }

      if (updateCategoryDto.show_home_page !== undefined) {
        updateData.show_home_page = updateCategoryDto.show_home_page;
      }

      if (category_image !== undefined) {
        updateData.image = category_image;
      }

      if (updateCategoryDto.status_id !== undefined) {
        updateData.status_id = BigInt(updateCategoryDto.status_id);
      }

      const category = await this.prisma.productCategory.update({
        where: { id: category_id },
        data: updateData,
      });

      if (category) {
        let isProductAvailable = await this.prisma.metaData.findFirst({
          where: {
            table_id: category?.id,
            table_name: "productCategory",
            key: "_category_meta",
          }
        });
        let metaDetails = {
          meta_title: updateCategoryDto?.meta_title,
          meta_description: updateCategoryDto?.meta_description,
          meta_keyword: updateCategoryDto?.meta_keyword,
          other_meta: updateCategoryDto.other_meta
        }
        if (isProductAvailable) {
          await this.prisma.metaData.update({
            where: {
              id: isProductAvailable?.id
            },
            data: {
              table_id: category.id,
              table_name: "productCategory",
              key: "_category_meta",
              value: JSON.stringify(metaDetails)
            }
          });
        } else {
          await createMetaData(
            category.id,
            "productCategory",
            "_category_meta",
            JSON.stringify(metaDetails)
          )
        }
      }


      return category;
    } catch (error: any) {
      throw error;
    }
  }

  async removeImage(category_id: bigint) {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: category_id },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
      const imagePath = path.join(
        process.env.IMAGE_PATH!,
        process.env.PRODUCT_CATEGORY_IMAGE_PATH!,
        category.id.toString(),
        category.name!
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      const deleted = await this.prisma.productCategory.update({
        where: { id: category_id },
        data: {
          image: null
        }
      });
      return deleted;

    } catch (error: any) {
      throw error;
    }
  }


  async remove(category_id: bigint) {
    try {
      let checkProduct = await this.prisma.productCategory.findFirst({
        where: {
          id: category_id
        },
        select: {
          products: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      if (checkProduct?.products?.length) {
        throw new BadRequestException('Delete failed: Category is assigned to products.');
      } else {
        const deleteImages = await this.removeImage(category_id)
        const category = await this.prisma.productCategory.delete({
          where: {
            id: category_id
          }
        });
        return category;
      }
    } catch (error: any) {
      throw error;
    }
  }
}
