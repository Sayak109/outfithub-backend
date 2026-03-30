import { BadRequestException, Injectable } from '@nestjs/common';
import { GetBuyerExploreDto } from './dto/get-buyer-explore.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetProductBySubCategoryDto } from './dto/get-product-by-subcategory.dto';

@Injectable()
export class BuyerExploreService {


  constructor(private prisma: PrismaService) { }

  private async getRelatedSearches(searchQueryId: bigint, searchTerm: string) {
    let relatedSearches: {
      id: bigint;
      query: string;
      image: string | null;
      count: number;
    }[] = [];

    // Step 1: Get users who searched for this query
    const usersWhoSearched = await this.prisma.recentSearch.findMany({
      where: {
        searchQuery_id: searchQueryId,
      },
      select: {
        user_id: true,
      },
    });

    const userIds = usersWhoSearched.map(u => u.user_id);

    if (userIds.length > 0) {
      // Step 2: Get other searches by those users (excluding current)
      const relatedSearchEntries = await this.prisma.recentSearch.findMany({
        where: {
          user_id: { in: userIds },
          searchQuery_id: { not: searchQueryId },
        },
        select: {
          searchQuery: {
            select: {
              id: true,
              query: true,
              image: true,
            },
          },
        },
      });

      // Step 3: Count frequency of each related query
      const frequencyMap = new Map<
        string,
        { id: bigint; query: string; image: string | null; count: number }
      >();

      for (const entry of relatedSearchEntries) {
        const { id, query, image } = entry.searchQuery;
        const key = String(id);

        if (frequencyMap.has(key)) {
          frequencyMap.get(key)!.count += 1;
        } else {
          frequencyMap.set(key, { id, query, image, count: 1 });
        }
      }

      relatedSearches = Array.from(frequencyMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Limit to top 5
    }

    // Step 4: Fallback - keyword-based similar queries
    if (relatedSearches.length === 0) {
      const similarQueries = await this.prisma.searchQuery.findMany({
        where: {
          query: {
            contains: searchTerm,
            mode: 'insensitive',
          },
          NOT: {
            query: searchTerm,
          },
        },
        orderBy: {
          count: 'desc',
        },
        take: 5,
        select: {
          id: true,
          query: true,
          image: true,
        },
      });

      relatedSearches = similarQueries.map(sq => ({
        ...sq,
        count: 0,
      }));
    }

    return relatedSearches;
  }


  async search(getBuyerExploreDto: GetBuyerExploreDto, userId?: bigint) {
    const prisma1 = await this.prisma.$extends({
      result: {
        productImage: {
          src: {
            needs: { id: true, src: true, product_id: true },
            compute(image) {
              return image.src
                ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${image.product_id}/${image.src}`
                : "";
            },
          },
        },
      },
    });

    const search: string = getBuyerExploreDto?.search?.trim();
    const page = parseInt(getBuyerExploreDto.page || '1', 10);
    const rowsPerPage = parseInt(getBuyerExploreDto.rowsPerPage || '20', 10);
    const skip = (page - 1) * rowsPerPage;

    const {
      categoryIds,
      attributeIds,
      isNewCollection,
      start_price,
      end_price,
      sortBy,
    } = getBuyerExploreDto;

    // const searchQuery = await this.prisma.searchQuery.upsert({
    //   where: { query: search },
    //   update: { count: { increment: 1 } },
    //   create: { query: search, image: "" },
    // });




    // 🔁 Expand category IDs to include subcategories
    let filters: any = {};
    let expandedCategoryIds: bigint[] = [];
    if (categoryIds?.length) {
      const subCats = await this.prisma.productCategory.findMany({
        where: {
          OR: categoryIds.map(id => ({
            parent_category: id,
          })),
        },
        select: { id: true },
      });

      expandedCategoryIds = [...categoryIds, ...subCats.map(c => c.id)];
    }

    const whereClause: any = {
      status_id: 1,
    };
    const conditions: any = {
      status_id: 1,
    };


    if (search) {
      let searchWord = search.trim();
      whereClause.OR = [
        { name: { contains: searchWord, mode: 'insensitive' } },
        {
          categories: {
            some: {
              name: { contains: searchWord, mode: 'insensitive' },
            },
          },
        },
        { description: { contains: searchWord, mode: 'insensitive' } },
      ];
      conditions.OR = [
        { name: { contains: searchWord, mode: 'insensitive' } },
        {
          categories: {
            some: {
              name: { contains: searchWord, mode: 'insensitive' },
            },
          },
        },
        { description: { contains: searchWord, mode: 'insensitive' } },
      ];
    }

    if (expandedCategoryIds.length) {
      whereClause.categories = {
        some: {
          id: { in: expandedCategoryIds },
        },
      };
    }

    if (attributeIds?.length) {
      whereClause.productToProductTerms = {
        some: {
          attribute_term_id: { in: attributeIds.map(id => BigInt(id)) },
        },
      };
    }

    if (typeof isNewCollection === 'boolean') {
      whereClause.new_collection = isNewCollection;
    }

    if (start_price !== undefined || end_price !== undefined) {
      whereClause.mrp = {};

      if (start_price !== undefined) {
        whereClause.mrp.gte = start_price;
      }

      if (end_price !== undefined) {
        whereClause.mrp.lte = end_price;
      }
    }

    let orderBy: any = { created_at: 'desc' };
    switch (sortBy) {
      case 'price_low_to_high':
        orderBy = { mrp: 'asc' };
        break;
      case 'price_high_to_low':
        orderBy = { mrp: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { created_at: 'desc' };
    }

    console.log(getBuyerExploreDto, "getBuyerExploreDto")

    const [products, totalCount] = await Promise.all([
      prisma1.product.findMany({
        where: whereClause,
        skip,
        take: rowsPerPage,
        orderBy: orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          sales_price: true,
          mrp: true,
          images: true,
          new_collection: true,
          average_rating: true,
          attributes: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              parent_category: true,
              parent_relation: {
                select: { id: true, name: true },
              },
            },
          },
          wishList: {
            where: {
              user_id: userId
            }
          }
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);
    for (const product of products) {

      if (product) {
        if (userId && product?.wishList && product.wishList.length > 0) {
          const wishItem = product.wishList[0];
          product.wishList = {
            id: wishItem.id,
            list_type: wishItem.list_type
          } as any;
        } else {
          product.wishList = null as any;
        }

        if (product?.attributes) {
          let attributes = await Promise.all(product!.attributes.map(async (attr: any, j: any) => {
            let options = await this.prisma.productToProductTerm.findMany({
              where: {
                product_id: product!.id,
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
          product!.attributes = attributes;
        }
      }
    }


    const [filteredProducts] = await Promise.all([
      prisma1.product.findMany({
        where: conditions,
        orderBy: orderBy,
        select: {
          id: true,
          name: true,
          mrp: true,
          sales_price: true,
          average_rating: true,
          attributes: {
            select: {
              id: true,
              name: true,
              slug: true,
              attributeTerms: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              parent_category: true,
              parent_relation: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);
    for (const product of filteredProducts) {
      if (product && product?.attributes) {
        let attributes = await Promise.all(product!.attributes.map(async (attr: any, j: any) => {
          let options = await this.prisma.productToProductTerm.findMany({
            where: {
              product_id: product!.id,
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
        product!.attributes = attributes;

      }
    }
    if (products.length > 0) {
      //////// Price range ////////
      const prices = filteredProducts.map(p => {
        const sale = Number(p.sales_price);
        const mrp = Number(p.mrp);
        return sale > 0 ? sale : mrp;
      });

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      filters.priceRange = { min: minPrice, max: maxPrice };

      //////// Categories ////////
      const allCategories = filteredProducts.flatMap(p => p.categories);
      const categoryMap: Record<string, any> = {};

      allCategories.forEach(cat => {
        const catId = String(cat.id);
        const parentId = cat.parent_category ? String(cat.parent_category) : null;

        if (!parentId) {
          if (!categoryMap[catId]) {
            categoryMap[catId] = { id: cat.id, name: cat.name, sub_categories: [] };
          }
        } else {
          if (!categoryMap[parentId]) {
            categoryMap[parentId] = {
              id: cat.parent_relation?.id,
              name: cat.parent_relation?.name || "",
              sub_categories: []
            };
          }

          const alreadyExists = categoryMap[parentId].sub_categories.some(
            (sub: any) => String(sub.id) === String(cat.id)
          );

          if (!alreadyExists) {
            categoryMap[parentId].sub_categories.push({
              id: cat.id,
              name: cat.name
            });
          }
        }
      });
      filters.categories = Object.values(categoryMap);

      //////// Attributes ////////
      type Attribute = {
        id: bigint;
        name: string;
        slug: string;
        attributeTerms: { id: bigint; name: string; slug: string }[];
        terms: { id: bigint; name: string; slug: string }[];
      };
      const allAttributes = filteredProducts.flatMap(p => p.attributes);
      const attributeMap: Record<string, any> = {};

      allAttributes.forEach((attr: Attribute) => {
        const attrId = String(attr.id);
        if (!attributeMap[attrId]) {
          attributeMap[attrId] = {
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            terms: []
          };
        }

        attr.terms.forEach(term => {
          const alreadyExists = attributeMap[attrId].terms.some(
            (t: any) => String(t.id) === String(term.id)
          );

          if (!alreadyExists) {
            attributeMap[attrId].terms.push({
              id: term.id,
              name: term.name,
              slug: term.slug
            });
          }
        });
      });

      filters.attributes = Object.values(attributeMap);
    }

    const searchQuery = await this.prisma.searchQuery.upsert({
      where: { query: search },
      update: { count: { increment: 1 } },
      create: { query: search, image: products.length > 0 && products[0].images?.length > 0 ? products[0].images[0]?.src || "" : '' },
    });

    const relatedSearches = await this.getRelatedSearches(searchQuery.id, search);

    if (userId) {
      const existingRecent = await this.prisma.recentSearch.findFirst({
        where: {
          user_id: userId,
          searchQuery_id: searchQuery.id,
        },
      });

      if (existingRecent) {
        // Just update the timestamp
        await this.prisma.recentSearch.update({
          where: { id: existingRecent.id },
          data: { searched_at: new Date() },
        });
      } else {
        // Create new entry
        await this.prisma.recentSearch.create({
          data: {
            user_id: userId,
            searchQuery_id: searchQuery.id,
            image: products.length > 0 && products[0].images?.length > 0 ? products[0].images[0]?.src || "" : '',
          },
        });
      }

      const recentForUser = await this.prisma.recentSearch.findMany({
        where: { user_id: userId },
        orderBy: { searched_at: 'desc' },
        skip: 10,
        select: { id: true },
      });

      if (recentForUser.length > 0) {
        await this.prisma.recentSearch.deleteMany({
          where: {
            id: { in: recentForUser.map(r => r.id) },
          },
        });
      }
    }

    return { Total: totalCount, Product: products, Filters: filters, RelatedSearches: relatedSearches };
  }

  async getPopularSearches() {
    return this.prisma.searchQuery.findMany({
      orderBy: { count: 'desc' },
      take: 20,
    });
  };

  async getRelevantSearches(search: string) {
    const searchWord = search?.trim().toLowerCase() || '';
    if (searchWord.length < 3) return [];

    const substrings = new Set<string>();
    for (let i = 0; i <= searchWord.length - 3; i++) {
      substrings.add(searchWord.slice(i, i + 3));
    }

    const orConditions: any[] = Array.from(substrings).map((sub) => ({
      query: {
        contains: sub,
        mode: 'insensitive',
      },
    }));


    const popular = await this.prisma.searchQuery.groupBy({
      by: ['query', 'image'],
      orderBy: {
        _sum: {
          count: 'desc',
        },
      },
      _sum: {
        count: true,
      },
      where: {
        OR: orConditions,
      },
      take: 6,
    });

    return popular.map((item) => ({
      name: item.query,
      image: item.image,
      relevance: item._sum.count,
    }));
  }


  async getRecentSearches(user_id: bigint) {

    const recent = await this.prisma.recentSearch.findMany({
      where: { user_id },
      orderBy: { searched_at: 'desc' },
      take: 10,
      include: {
        searchQuery: true,
      },
    });

    const res = recent.map(r => {
      return { query: r.searchQuery.query, image: r.searchQuery.image }
    });

    if (res.length === 0) {
      return [];
    }
    return res;
  }


  async getAllFilterDetails() {
    const [categories, attributes, priceRange] = await Promise.all([
      // 1. Fetch all active categories with sub-categories
      this.prisma.productCategory.findMany({
        where: { status_id: 1, parent_category: null },
        select: {
          id: true,
          name: true,
          // parent_category: true,
          // parent_relation: {
          //   select: { id: true, name: true },
          // },
          sub_categories: {
            select: {
              id: true,
              name: true,
              // parent_category: true,
              // parent_relation: {
              //   select: { id: true, name: true },
              // },
            },
            where: { status_id: 1 },
          },
        },
      }),

      // 2. Fetch all active attributes with terms
      this.prisma.productAttribute.findMany({
        where: { status_id: 1 },
        select: {
          id: true,
          name: true,
          attributeTerms: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // 3. Get lowest and highest product MRP
      this.prisma.product.aggregate({
        _min: { mrp: true },
        _max: { mrp: true },
        where: { status_id: 1 },
      }),
    ]);

    return {
      categories,
      attributes,
      price: {
        low: Number(priceRange._min.mrp || 0),
        high: Number(priceRange._max.mrp || 0),
      },
    };
  }


  async getAllCategories() {
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
    // const categories = await prisma1.productCategory.findMany({
    //   where: { status_id: 1, parent_category: null },
    //   select: {
    //     id: true,
    //     name: true,
    //     image: true,
    //     sub_categories: {
    //       select: {
    //         id: true,
    //         name: true,
    //         image: true,
    //       },
    //       where: { status_id: 1 },
    //     },
    //   },
    // });

    // const categories = await prisma1.productCategory.findMany({
    //   where: {
    //     status_id: 1,
    //     parent_category: null,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     image: true,
    //     sub_categories: {
    //       where: {
    //         status_id: 1,
    //         products: {
    //           some: {},
    //         },
    //       },
    //       select: {
    //         id: true,
    //         name: true,
    //         image: true,
    //       },
    //     },
    //   },
    // });
    // const filteredCategories = categories.filter(
    //   category => category.sub_categories && category.sub_categories.length > 0
    // );


    const categories = await prisma1.productCategory.findMany({
      where: {
        status_id: 1,
        parent_category: null, // top-level categories only
        sub_categories: {
          some: {
            status_id: 1,
            products: {
              some: {
                status_id: 1,
                approval_status_id: 2
              }, // ensures subcategory has at least one product
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        slug: true,
        sub_categories: {
          where: {
            status_id: 1,
            products: {
              some: {
                status_id: 1,
                approval_status_id: 2
              }, // ensures only subcategories with products
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
    });

    return categories;
  }


  async getProductByCategoryById(id: bigint,) {

    const prisma1 = await this.prisma.$extends({
      result: {
        productImage: {
          src: {
            needs: { id: true, src: true, product_id: true },
            compute(image) {
              return image.src
                ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${image.product_id}/${image.src}`
                : "";
            },
          },
        },
      },
    });


    // 1. Get all subcategories under the given category
    const subcategories = await this.prisma.productCategory.findMany({
      where: {
        parent_category: id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parent_category: true,
        // include more fields if needed
      },
    });

    // 2. For each subcategory, get its products
    const data = await Promise.all(
      subcategories.map(async (subcategory) => {
        const products = await prisma1.product.findMany({
          where: {
            categories: {
              some: {
                id: subcategory.id,
              },
            },
          },
          include: {
            // include other relations if needed
            categories: true,
            images: true,
          },
        });

        return {
          sub_category: subcategory,
          products,
        };
      })
    );

    return data;
  };

  async getMetaByCatgory(slug: string) {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { slug, status_id: 1 }
      });

      const meta = await this.prisma.metaData.findFirst({
        where: {
          table_id: category?.id,
          table_name: "productCategory",
          key: "_category_meta",
        }
      });

      (category as any).meta_data = meta?.value ? JSON.parse(meta?.value) : ""

      if (!category) {
        throw new BadRequestException(`Category '${slug}' not found`);
      }
      return category;
    }
    catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }

  }

  async getProdductBySubCategoryById(id: bigint, dto: GetProductBySubCategoryDto, user_id?: bigint,) {
    const prisma1 = await this.prisma.$extends({
      result: {
        productImage: {
          src: {
            needs: { id: true, src: true, product_id: true },
            compute(image) {
              return image.src
                ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${image.product_id}/${image.src}`
                : "";
            },
          },
        },
      },
    });

    let products;
    if (dto.page && dto.rowsPerPage) {
      products = await prisma1.product.findMany({
        where: {
          categories: {
            some: {
              id: id,
              parent_category: {
                not: null
              }
            },
          },
          status_id: 1,
          approval_status_id: 2
        },
        skip: (dto?.page - 1) * dto?.rowsPerPage,
        take: dto?.rowsPerPage,
        orderBy: {
          id: 'desc'
        },
        include: {
          // include other relations if needed
          // categories: {
          //   select: {
          //     id: true,
          //     name: true,
          //     sub_categories: {
          //       select: {
          //         id: true,
          //         name: true
          //       }
          //     }
          //   }
          // },
          categories: true,
          images: true,
          wishList: {
            where: {
              user_id: user_id
            }
          }
        },
      });
    } else {
      products = await prisma1.product.findMany({
        where: {
          categories: {
            some: {
              id: id,
              parent_category: {
                not: null
              },
            },
          },
          status_id: 1,
          approval_status_id: 2
        },
        orderBy: {
          id: 'desc'
        },
        include: {
          categories: true,
          images: true,
          wishList: {
            where: {
              user_id: user_id
            }
          }
        },
      });
    }

    for (const product of products) {
      if (product) {
        if (user_id && product?.wishList && product.wishList.length > 0) {
          const wishItem = product.wishList[0];
          product.wishList = {
            id: wishItem.id,
            list_type: wishItem.list_type
          } as any;
        } else {
          product.wishList = null as any;
        }
      }
    }

    const totalCount = await prisma1.product.count({
      where: {
        categories: {
          some: {
            id: id,
            parent_category: {
              not: null
            },
          },
        },
        status_id: 1,
        approval_status_id: 2
      },
    });
    return { products, Total: totalCount };
  }

}