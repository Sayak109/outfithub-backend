import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GraphDto } from './dto/users-graph.dto';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService
  ) { }
  create(createDashboardDto: CreateDashboardDto) {
    return 'This action adds a new dashboard';
  }

  async findTotal() {
    try {
      const totalUsers = await this.prisma.user.count({
        where: {
          role_id: {
            in: [3, 4]
          }
        }
      })
      const totalProducts = await this.prisma.product.count({
        where: {
          status_id: {
            in: [1]
          },
          approval_status_id: {
            in: [2]
          }
        }
      })
      const totalOrders = await this.prisma.orderItems.count({
        where: {
          order_status_id: {
            in: [5]
          }
        }
      })

      const liveSellers = await this.prisma.live.count({
        where: {
          isLive: true,
        }
      })

      return { TotalUsers: totalUsers, TotalProducts: totalProducts, TotalOrders: totalOrders, LiveSellers: liveSellers }
    } catch (error) {
      throw error
    }
  }

  async findTop() {
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
      /////////////TopSeller//////////////
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

      // 2. Extract seller IDs
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
        },
      });

      const topSellerList = topSellers.map((top) => {
        const seller = sellers.find((s) => s.id === top.seller_id);

        return {
          sellerId: seller?.id,
          name: `${seller?.first_name || ''} ${seller?.last_name || ''}`.trim(),
          email: seller?.email,
          business_name: seller?.sellerProfile?.business_name || null,
          business_logo: seller?.sellerProfile?.business_logo || null,
          totalProducts: seller?._count.Product || 0,
          totalItemsSold: top._sum.item_quantity || 0,
        };
      });


      /////////////TopBuyer//////////////

      const deliveredItems = await this.prisma.orderItems.findMany({
        where: {
          order_status_id: {
            in: [5],
          },
        },
        select: {
          item_quantity: true,
          order: {
            select: {
              customer_id: true,
            },
          },
        },
      });

      const buyerMap = new Map<string, number>();

      for (const item of deliveredItems) {
        const customerId = item.order.customer_id.toString();
        const qty = item.item_quantity;

        buyerMap.set(customerId, (buyerMap.get(customerId) || 0) + qty);
      }

      const sortedBuyers = [...buyerMap.entries()].sort((a, b) => b[1] - a[1]);
      const top5BuyerEntries = sortedBuyers.slice(0, 5);
      const topBuyerIds = top5BuyerEntries.map(([id]) => BigInt(id));

      const buyers = await prisma1.user.findMany({
        where: {
          id: {
            in: topBuyerIds,
          },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
        },
      });

      const topBuyers = top5BuyerEntries.map(([id, totalItemsBuyed]) => {
        const buyer = buyers.find(b => b.id.toString() === id);

        return {
          id: buyer?.id,
          name: `${buyer?.first_name || ''} ${buyer?.last_name || ''}`.trim(),
          email: buyer?.email,
          phone_no: buyer?.phone_no,
          image: buyer?.image,
          totalItemsBuyed,
        };
      });

      return { TopSeller: topSellerList, TopBuyer: topBuyers }
    } catch (error) {
      throw error
    }
  }
  async productList() {
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

      /////////////topSellingProducts//////////////
      const topSellingProducts = await this.prisma.orderItems.groupBy({
        by: ['product_id'],
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
        take: 10,
      });

      if (!topSellingProducts.length) {
        return { TopSellingProducts: [] };
      }

      const productIds = topSellingProducts.map(p => BigInt(p.product_id!));

      const items = await this.prisma.orderItems.findMany({
        where: {
          product_id: { in: productIds },
          order_status_id: 5,
        },
        select: {
          product_id: true,
          item_metadata: true,
        },
        distinct: ['product_id'],
      });

      const products = await prisma1.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          slug: true,
          description: true,
          average_rating: true,
          images: {
            select: {
              src: true,
              main_image: true,
            }
          }
        },
      });

      const topSellingList = topSellingProducts.map((entry) => {
        const productId = BigInt(entry.product_id!);

        const metadataItem = items.find(i =>
          i.product_id !== null && BigInt(i.product_id) === productId
        );
        let metadata: any = {};
        try {
          metadata = metadataItem?.item_metadata ? JSON.parse(metadataItem.item_metadata) : {};
        } catch (error) {
          console.error("Invalid JSON in item_metadata", error);
        }

        const product = products.find(p => p.id === productId);

        return {
          name: metadata.name || null,
          slug: product?.slug || null,
          description: product?.description || null,
          image: (() => {
            const images = product?.images || [];
            const main = images.find(img => img.main_image);
            return main?.src || images[0]?.src || null;
          })(),
          mrp: metadata.mrp || null,
          average_rating: product?.average_rating || "0.0",
          totalUnitsSold: entry._sum.item_quantity || 0,
        };
      });
      /////////////most Popular products//////////////
      const mostPopularProducts = await this.prisma.orderItems.groupBy({
        by: ['product_id'],
        _sum: {
          item_quantity: true,
        },
        orderBy: {
          _sum: {
            item_quantity: 'desc',
          },
        },
        take: 10,
      });

      if (!mostPopularProducts.length) {
        return { TopSellingProducts: [] };
      }

      const popularProductIds = mostPopularProducts.map(p => BigInt(p.product_id!));

      // 2. Fetch one orderItem per product to get item_metadata (no status filter)
      const orderItems = await this.prisma.orderItems.findMany({
        where: {
          product_id: { in: popularProductIds },
        },
        select: {
          product_id: true,
          item_metadata: true,
        },
        distinct: ['product_id'], // one per product
      });

      // 3. Fetch product info from products table
      const allproducts = await prisma1.product.findMany({
        where: {
          id: { in: popularProductIds },
        },
        select: {
          id: true,
          slug: true,
          description: true,
          average_rating: true,
          images: {
            select: {
              src: true,
              main_image: true,
            }
          }
        },
      });

      // 4. Combine all info
      const mostPopularList = mostPopularProducts.map((entry) => {
        const productId = BigInt(entry.product_id!);

        const metadataItem = orderItems.find(i =>
          i.product_id !== null && BigInt(i.product_id) === productId
        );
        let metadata: any = {};
        try {
          metadata = metadataItem?.item_metadata ? JSON.parse(metadataItem.item_metadata) : {};
        } catch (error) {
          console.error("Invalid JSON in item_metadata", error);
        }

        const product = allproducts.find(p => p.id === productId);

        return {
          name: metadata.name || null,
          slug: product?.slug || null,
          description: product?.description || null,
          mrp: metadata.mrp || null,
          average_rating: product?.average_rating?.toString() || "0.0",
          image: (() => {
            const images = product?.images || [];
            const main = images.find(img => img.main_image);
            return main?.src || images[0]?.src || null;
          })(),
          totalUnitsOrdered: entry._sum.item_quantity || 0,
        };
      });

      return { TopSellingProducts: topSellingList, MostPopularList: mostPopularList };

    } catch (error) {
      throw error
    }
  }

  // async recentOrders() {
  //   try {
  //     const prisma1 = await this.prisma.$extends({
  //       result: {
  //         productImage: {
  //           src: {
  //             needs: { product_id: true, src: true },
  //             compute(src) {
  //               if (src.src != null && src.src != '' && src.src != undefined) {
  //                 return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.product_id}/${src.src}`
  //               } else {
  //                 return ""
  //               }
  //             },
  //           },
  //         },
  //       },
  //     })

  //     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  //     const orderList = await prisma1.order.findMany({
  //       // where: {
  //       //   order_date: {
  //       //     gte: twentyFourHoursAgo
  //       //   }
  //       // },
  //       take: 6,
  //       orderBy: { order_date: "desc" },
  //       select: {
  //         id: true,
  //         order_id: true,
  //         payment_status: true,
  //         amount: true,
  //         order_date: true,
  //         customer: {
  //           select: {
  //             id: true,
  //             first_name: true,
  //             last_name: true,
  //             email: true,
  //             phone_no: true,
  //           },
  //         },
  //         order_details: {
  //           select: {
  //             order_amount: true,
  //           },
  //         },
  //         order_items: {
  //           orderBy: { id: "desc" },
  //           select: {
  //             id: true,
  //             item_quantity: true,
  //             item_metadata: true,
  //             total_item_amount: true,
  //             seller_id: true,
  //             seller: {
  //               select: {
  //                 first_name: true,
  //                 last_name: true,
  //                 email: true,
  //                 phone_no: true,
  //                 sellerProfile: {
  //                   select: {
  //                     business_name: true,
  //                     business_tag: true,
  //                   },
  //                 },
  //               },
  //             },
  //             product: {
  //               select: {
  //                 images: {
  //                   select: {
  //                     src: true,
  //                     main_image: true,
  //                   },
  //                 },
  //               },
  //             },
  //             order_status: {
  //               select: {
  //                 id: true,
  //                 title: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //     const parsedOrderData = JSON.parse(JSON.stringify(orderList, (key, value) =>
  //       typeof value === 'bigint' ? value.toString() : value));
  //     parsedOrderData.forEach(order => {
  //       order.order_items = order.order_items.map(item => {
  //         const updatedItem = { ...item };

  //         if (updatedItem.item_metadata) {
  //           try {
  //             updatedItem.item_metadata = JSON.parse(updatedItem.item_metadata);
  //           } catch (err) {
  //             updatedItem.item_metadata = {};
  //           }
  //         }

  //         if (updatedItem.product?.images) {
  //           updatedItem.item_metadata.images = updatedItem.product.images;
  //           delete updatedItem.product;
  //         }

  //         return updatedItem;
  //       });
  //     });
  //     return parsedOrderData
  //   } catch (error) {
  //     throw error
  //   }
  // }
  async recentOrders() {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          productImage: {
            src: {
              needs: { product_id: true, src: true },
              compute(src) {
                if (src.src != null && src.src !== '') {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.product_id}/${src.src}`;
                } else {
                  return '';
                }
              },
            },
          },
        },
      });

      const latestOrderItems = await prisma1.orderItems.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 10,
        select: {
          id: true,
          item_quantity: true,
          item_metadata: true,
          total_item_amount: true,
          order: {
            select: {
              id: true,
              order_id: true,
              payment_status: true,
              amount: true,
              order_date: true,
              customer: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone_no: true,
                },
              },
              order_details: {
                select: {
                  order_amount: true,
                },
              },
            },
          },
          seller: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
              sellerProfile: {
                select: {
                  business_name: true,
                  business_tag: true,
                },
              },
            },
          },
          product: {
            select: {
              images: {
                select: {
                  src: true,
                  main_image: true,
                },
              },
            },
          },
          order_status: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const parsedItems = JSON.parse(JSON.stringify(latestOrderItems, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      const formattedItems = parsedItems.map(item => {
        let metadata: any = {};
        try {
          metadata = item.item_metadata ? JSON.parse(item.item_metadata) : {};
        } catch {
          metadata = {};
        }

        const images = item.product?.images || [];
        const mainImage = images.find(img => img.main_image) || images[0];
        metadata.images = mainImage ? [mainImage] : [];

        return {
          id: item.id,
          item_quantity: item.item_quantity,
          total_item_amount: item.total_item_amount,
          item_metadata: metadata,
          order: item.order,
          seller: item.seller,
          order_status: item.order_status,
        };
      });

      return formattedItems;
    } catch (error) {
      throw error
    }
  }

  async usersGraph(usersGraphDto: GraphDto) {
    try {
      const now = new Date();
      const inputDay = usersGraphDto.day;
      const inputMonth = usersGraphDto.month;
      const inputYear = usersGraphDto.year;
      const type = usersGraphDto.type; // "daily" | "weekly" | "monthly" | "yearly"
      const { startDate, endDate } = usersGraphDto;

      const year = inputYear && inputYear > 1900 && inputYear <= now.getFullYear()
        ? inputYear
        : now.getFullYear();
      const month = inputMonth && inputMonth >= 1 && inputMonth <= 12
        ? inputMonth
        : now.getMonth() + 1;
      const day = inputDay && inputDay >= 1 && inputDay <= 31
        ? inputDay
        : now.getDate();

      let graph: any[] = [];
      let totalUsers = 0;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

        let current = new Date(start);
        while (current <= end) {
          const dayStart = new Date(current);
          dayStart.setHours(0, 0, 0, 0);

          const dayEnd = new Date(current);
          dayEnd.setHours(23, 59, 59, 999);

          const count = await this.prisma.user.count({
            where: {
              role_id: { in: [3, 4] },
              created_at: { gte: dayStart, lte: dayEnd },
            },
          });

          graph.push({
            date: dayStart.toLocaleDateString("en-CA"),
            users: count,
          });

          totalUsers += count;

          current.setDate(current.getDate() + 1);
        }
      }
      else if (type === "yearly") {
        const now = new Date();
        const currentYear = now.getFullYear();

        for (let y = currentYear - 5; y <= currentYear + 5; y++) {
          const start = new Date(y, 0, 1, 0, 0, 0);
          const end = new Date(y, 11, 31, 23, 59, 59);

          const count = await this.prisma.user.count({
            where: {
              role_id: { in: [3, 4] },
              created_at: { gte: start, lte: end },
            },
          });

          graph.push({
            date: `${y}`,
            users: count,
          });

          totalUsers += count;
        }
      }
      else if (type === "monthly") {
        const now = new Date();
        const year = now.getFullYear();

        for (let m = 0; m < 12; m++) {
          const start = new Date(year, m, 1, 0, 0, 0);
          const end = new Date(year, m + 1, 0, 23, 59, 59);

          const count = await this.prisma.user.count({
            where: {
              role_id: { in: [3, 4] },
              created_at: { gte: start, lte: end },
            },
          });

          graph.push({
            date: `${year}-${String(m + 1).padStart(2, "0")}`,
            users: count,
          });

          totalUsers += count;
        }
      }
      else if (type === "weekly") {
        const now = new Date();
        const currentDay = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((currentDay + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
          const start = new Date(monday.getTime());
          start.setDate(monday.getDate() + i);
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          end.setHours(23, 59, 59, 999);

          const count = await this.prisma.user.count({
            where: {
              role_id: { in: [3, 4] },
              created_at: { gte: start, lte: end },
            },
          });

          graph.push({
            date: start.toLocaleDateString("en-CA"),
            users: count,
          });

          totalUsers += count;
        }
      }
      else if (type === 'daily') {
        for (let h = 0; h < 24; h++) {
          const hourStart = new Date(year, month - 1, day, h, 0, 0);
          const hourEnd = new Date(year, month - 1, day, h, 59, 59);

          const count = await this.prisma.user.count({
            where: {
              role_id: { in: [3, 4] },
              created_at: { gte: hourStart, lte: hourEnd },
            },
          });

          graph.push({
            date: hourStart.toISOString(),
            users: count,
          });

          totalUsers += count;
        }
      }
      else {
        const start = new Date(year, month - 1, day, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59);

        const count = await this.prisma.user.count({
          where: {
            role_id: { in: [3, 4] },
            created_at: { gte: start, lte: end },
          },
        });

        graph.push({
          date: start.toLocaleDateString("en-CA"),
          users: count,
        });
        totalUsers = count;
      }

      return { graph, totalUsers };
    } catch (error) {
      throw error;
    }
  }

  async ordersGraph(ordersGraphDto: GraphDto) {
    try {
      const now = new Date();
      const inputDay = ordersGraphDto.day;
      const inputMonth = ordersGraphDto.month;
      const inputYear = ordersGraphDto.year;
      const type = ordersGraphDto.type; // "daily" | "weekly" | "monthly" | "yearly"

      const year = inputYear && inputYear > 1900 && inputYear <= now.getFullYear()
        ? inputYear
        : now.getFullYear();
      const month = inputMonth && inputMonth >= 1 && inputMonth <= 12
        ? inputMonth
        : now.getMonth() + 1;
      const day = inputDay && inputDay >= 1 && inputDay <= 31
        ? inputDay
        : now.getDate();

      let graph: any[] = [];
      let totalOrders = 0;

      if (type === "yearly") {
        for (let m = 0; m < 12; m++) {
          const start = new Date(year, m, 1, 0, 0, 0);
          const end = new Date(year, m + 1, 0, 23, 59, 59);

          const count = await this.prisma.orderItems.count({
            where: {
              order_status_id: { in: [5] },
              order: {
                order_date: { gte: start, lte: end },
              }
            },
          });

          graph.push({
            date: `${year}-${String(m + 1).padStart(2, "0")}`,
            orders: count,
          });
          totalOrders += count;
        }
      } else if (type === "monthly") {
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const start = new Date(year, month - 1, d, 0, 0, 0);
          const end = new Date(year, month - 1, d, 23, 59, 59);

          const count = await this.prisma.orderItems.count({
            where: {
              order_status_id: { in: [5] },
              order: {
                order_date: { gte: start, lte: end },
              }
            },
          });

          graph.push({
            date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            orders: count,
          });
          totalOrders += count;
        }
      } else if (type === "weekly") {
        const baseDate = new Date(year, month - 1, day);
        for (let i = 6; i >= 0; i--) {
          const start = new Date(baseDate);
          start.setDate(baseDate.getDate() - i);
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          end.setHours(23, 59, 59, 999);

          const count = await this.prisma.orderItems.count({
            where: {
              order_status_id: { in: [5] },
              order: {
                order_date: { gte: start, lte: end },
              }
            },
          });

          graph.push({
            date: start.toLocaleDateString("en-CA"),
            orders: count,
          });
          totalOrders += count;
        }
      } else {
        const start = new Date(year, month - 1, day, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59);

        const count = await this.prisma.orderItems.count({
          where: {
            order_status_id: { in: [5] },
            order: {
              order_date: { gte: start, lte: end },
            }
          },
        });

        graph.push({
          date: start.toLocaleDateString("en-CA"),
          orders: count,
        });
        totalOrders = count;
      }

      return { graph, totalOrders };
    } catch (error) {
      throw error;
    }
  }


  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
