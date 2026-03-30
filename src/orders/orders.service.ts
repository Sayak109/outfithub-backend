import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetOrderDto } from './dto/get-order-dto';
import { createNotification, decryptData } from '@/common/helper/common.helper';
import Razorpay = require("razorpay");
import { SettingsService } from '@/settings/settings.service';
import { Decimal } from '@generated/prisma/runtime/library';
import { Prisma } from '@prisma/client';
import { GetReturnOrderDto } from './dto/get-return-order.dto';

@Injectable()
export class OrdersService {
  private razorpay: Razorpay;
  constructor(
    private prisma: PrismaService,
    private readonly settingService: SettingsService
  ) { }
  async onModuleInit() {
    await this.initRazorpay();
  }
  private async initRazorpay() {
    const decryptedRes = await this.settingService.paymentSettings();
    const RazorpaySetting = decryptData(decryptedRes);

    this.razorpay = new Razorpay({
      key_id: RazorpaySetting.RAZORPAY_KEY_ID,
      key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET
    });
  }


  private async havePreferance(customer_id: bigint, preference_category_id: bigint) {
    return await this.prisma.notificationPreference.count({
      where: {
        user_id: customer_id,
        preference_category_id
      }
    })
  }

  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }
  async getStatus() {
    try {
      const status = await this.prisma.orderStatus.findMany({
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true,
          title: true,
        }
      })
      return status;
    } catch (error) {
      throw error
    }
  }

  async findAll(dto: GetOrderDto) {
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
        },
      })
      let conditions: any = [];
      let searchWord: string = '';
      if (dto?.search) {
        let str = dto.search.trim();
        searchWord = str;

        const searchAsNumber = Number(searchWord);
        const isNumber = !isNaN(searchAsNumber);
        const isInteger = isNumber && Number.isInteger(searchAsNumber);

        const orConditions: any[] = [];

        if (isInteger) {
          orConditions.push({ id: { equals: searchAsNumber } });
        }

        if (isNumber) {
          orConditions.push({ amount: { equals: searchWord } });
        }

        orConditions.push(
          { customer: { email: { contains: searchWord, mode: "insensitive" } } },
          { order_items: { some: { product: { name: { contains: searchWord, mode: "insensitive" } } } } },
          { customer: { first_name: { contains: searchWord, mode: "insensitive" } } },
          { customer: { last_name: { contains: searchWord, mode: "insensitive" } } },
          {
            AND: [
              {
                customer: {
                  first_name: {
                    contains: searchWord.split(" ")[0],
                    mode: "insensitive",
                  },
                },
              },
              {
                customer: {
                  last_name: {
                    contains: searchWord.split(" ")[1] ?? "",
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        );
        conditions.push({ OR: orConditions });
      }

      // 🔽 Filter by seller
      if (dto?.sellerId) {
        conditions.push({
          order_items: { some: { seller_id: dto.sellerId } },
        });
      }

      // 🔽 Filter by buyer
      if (dto?.buyerId) {
        conditions.push({
          customer: { id: dto.buyerId },
        });
      }
      // 🔽 Filter by status
      // if (dto?.status) {
      //   conditions.push({
      //     order_items: {
      //       some: {
      //         order_status: {
      //           OR: [
      //             { id: dto.status }, // filter by status id
      //             { id: { equals: dto.status } }, // OR by title
      //           ],
      //         },
      //       },
      //     },
      //   });
      // }

      if (dto?.status?.length && !(dto.status.length === 1 && dto.status[0] === 0)) {
        conditions.push({
          order_items: {
            some: {
              order_status: {
                id: { in: dto.status },
              },
            },
          },
        });
      }

      // 🔽 Filter by date range
      if (dto?.startDate || dto?.endDate) {
        const dateCondition: any = {};
        if (dto.startDate) dateCondition.gte = new Date(dto.startDate);
        if (dto.endDate) dateCondition.lte = new Date(dto.endDate);
        conditions.push({ order_date: dateCondition });
      }

      if (dto?.sort) {
        conditions.push({
          OR: [
            {
              order_details: {
                order_status: {
                  id: { equals: dto?.sort }
                }
              }
            }
          ]
        })
      }

      // Pagination
      let orderList: any = [];
      const queryConfig: any = {
        orderBy: { id: "desc" },
        where: { AND: conditions },
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
          // order_items: {
          //   orderBy: { id: "desc" },
          //   select: {
          //     id: true,
          //     item_quantity: true,
          //     item_metadata: true,
          //     total_item_amount: true,
          //     seller_id: true,
          //     seller: {
          //       select: {
          //         first_name: true,
          //         last_name: true,
          //         email: true,
          //         phone_no: true,
          //         sellerProfile: {
          //           select: {
          //             business_name: true,
          //             business_tag: true,
          //           },
          //         },
          //       },
          //     },
          //     product: {
          //       select: {
          //         images: {
          //           select: {
          //             id: true,
          //             name: true,
          //             src: true,
          //             main_image: true,
          //           },
          //         },
          //       },
          //     },
          //     order_status: {
          //       select: {
          //         id: true,
          //         title: true,
          //       },
          //     },
          //     sellerWalletTransaction: {
          //       select: {
          //         amount_earned: true,
          //         commision_charge: true,
          //         commision_charges_amount: true,
          //       },
          //     },
          //   },
          // },

          order_items: {
            where: {
              ...(dto?.sellerId && { seller_id: dto.sellerId }),
              // ...(dto?.status && { order_status: { id: dto.status } }),
              ...(dto?.status?.length && !(dto.status.length === 1 && dto.status[0] === 0) && {
                order_status: { id: { in: dto.status } }
              }),
            },
            orderBy: {
              id: 'desc'
            },
            select: {
              id: true,
              item_quantity: true,
              item_metadata: true,
              total_item_amount: true,
              seller_id: true,
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
                      id: true,
                      name: true,
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
              sellerWalletTransaction: {
                select: {
                  amount_earned: true,
                  commision_charge: true,
                  commision_charges_amount: true,
                },
              },
            },
          },
          order_details: {
            select: {
              order_amount: true,
            },
          },
        },
      };

      if (dto?.page && dto?.rowsPerPage) {
        queryConfig.skip = (dto.page - 1) * dto.rowsPerPage;
        queryConfig.take = dto.rowsPerPage;
      }

      orderList = await prisma1.order.findMany(queryConfig);

      // let orderList: any = []
      // if (dto && dto.page && dto.rowsPerPage) {
      //   orderList = await prisma1.order.findMany({
      //     skip: (dto?.page - 1) * dto?.rowsPerPage,
      //     take: dto?.rowsPerPage,
      //     orderBy: {
      //       id: 'desc'
      //     },
      //     where: {
      //       AND: conditions,
      //     },
      //     select: {
      //       id: true,
      //       payment_status: true,
      //       amount: true,
      //       order_date: true,
      //       customer: {
      //         select: {
      //           first_name: true,
      //           last_name: true,
      //           email: true,
      //           phone_no: true,
      //         }
      //       },
      //       order_items: {
      //         orderBy: {
      //           id: 'desc'
      //         },
      //         select: {
      //           id: true,
      //           item_quantity: true,
      //           item_metadata: true,
      //           total_item_amount: true,
      //           seller_id: true,
      //           seller: {
      //             select: {
      //               first_name: true,
      //               last_name: true,
      //               email: true,
      //               phone_no: true,
      //               sellerProfile: {
      //                 select: {
      //                   business_name: true,
      //                   business_tag: true,
      //                 }
      //               }
      //             }
      //           },
      //           product: {
      //             select: {
      //               images: {
      //                 select: {
      //                   id: true,
      //                   name: true,
      //                   src: true,
      //                   main_image: true,
      //                 }
      //               },
      //             }
      //           },
      //           order_status: {
      //             select: {
      //               id: true,
      //               title: true
      //             }
      //           },
      //           sellerWalletTransaction: {
      //             select: {
      //               amount_earned: true,
      //               commision_charge: true,
      //               commision_charges_amount: true
      //             }
      //           }
      //         }
      //       },
      //       order_details: {
      //         select: {
      //           order_amount: true,
      //         }
      //       }
      //     }
      //   });
      // } else {
      //   orderList = await prisma1.order.findMany({
      //     orderBy: {
      //       id: 'desc'
      //     },
      //     select: {
      //       payment_status: true,
      //       amount: true,
      //       order_date: true,
      //       customer: {
      //         select: {
      //           first_name: true,
      //           last_name: true,
      //           email: true,
      //           phone_no: true,
      //         }
      //       },
      //       order_items: {
      //         select: {
      //           id: true,
      //           item_quantity: true,
      //           item_metadata: true,
      //           total_item_amount: true,
      //           seller_id: true,
      //           seller: {
      //             select: {
      //               first_name: true,
      //               last_name: true,
      //               email: true,
      //               phone_no: true,
      //               sellerProfile: {
      //                 select: {
      //                   business_name: true,
      //                   business_tag: true,
      //                 }
      //               }
      //             }
      //           },
      //           product: {
      //             select: {
      //               images: {
      //                 select: {
      //                   id: true,
      //                   name: true,
      //                   src: true,
      //                   main_image: true,
      //                 }
      //               },
      //             }
      //           },
      //           order_status: {
      //             select: {
      //               id: true,
      //               title: true
      //             }
      //           },
      //         }
      //       },
      //       order_details: {
      //         select: {
      //           order_amount: true,
      //           billing: {
      //             select: {
      //               metadata: true,
      //             }
      //           },
      //           shipping: {
      //             select: {
      //               metadata: true
      //             }
      //           }
      //         }
      //       }
      //     }
      //   });
      // }

      const parsedOrderData = JSON.parse(JSON.stringify(orderList, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value));
      parsedOrderData.forEach(order => {
        order.order_items = order.order_items.map(item => {
          const updatedItem = { ...item };

          if (updatedItem.item_metadata) {
            try {
              updatedItem.item_metadata = JSON.parse(updatedItem.item_metadata);
            } catch (err) {
              updatedItem.item_metadata = {};
            }
          }

          if (updatedItem.product?.images) {
            updatedItem.item_metadata.images = updatedItem.product.images;
            delete updatedItem.product;
          }

          return updatedItem;
        });
      });
      const totalCount = await this.prisma.order.count({
        where: {
          AND: conditions
        }
      })

      return { Total: totalCount, Orders: parsedOrderData };
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async findOne(order_id: bigint) {
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
        },
      })
      const orderData = await prisma1.order.findUnique({
        where: {
          id: order_id,
        },
        select: {
          id: true,
          order_id: true,
          payment_status: true,
          amount: true,
          order_date: true,
          customer: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
            }
          },
          order_items: {
            select: {
              id: true,
              item_quantity: true,
              item_metadata: true,
              total_item_amount: true,
              seller_id: true,
              updated_at: true,
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
                    }
                  }
                }
              },
              product: {
                select: {
                  images: {
                    select: {
                      id: true,
                      name: true,
                      src: true,
                      main_image: true,
                    }
                  },
                }
              },
              order_status: {
                select: {
                  id: true,
                  title: true
                }
              },
            }
          },
          order_details: {
            select: {
              order_amount: true,
              billing: true,
              shipping: true
            }
          }

        }
      });

      if (orderData === null || orderData === undefined) {
        throw new BadRequestException("No order found.")
      }

      const parsedOrderData = JSON.parse(JSON.stringify(orderData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value));

      if (parsedOrderData?.order_details?.billing) {
        parsedOrderData.order_details.billing = JSON.parse(parsedOrderData.order_details.billing);
      }

      if (parsedOrderData?.order_details?.shipping) {
        parsedOrderData.order_details.shipping = JSON.parse(parsedOrderData.order_details.shipping);
      }
      parsedOrderData.order_items = parsedOrderData.order_items.map(item => {
        const updatedItem = { ...item };

        if (updatedItem.item_metadata) {
          try {
            updatedItem.item_metadata = JSON.parse(updatedItem.item_metadata);
          } catch (err) {
            updatedItem.item_metadata = {};
          }
        }
        if (updatedItem.product?.images) {
          updatedItem.item_metadata.images = updatedItem.product.images;
          delete updatedItem.product;
        }
        return updatedItem;
      });

      return parsedOrderData || [];
    } catch (error) {
      throw error
    }
  }

  async update(order_item_id: bigint, dto: UpdateOrderDto, user_email: string) {
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
        },
      })
      const getOrder = await prisma1.order.findFirst({
        where: {
          order_items: {
            some: {
              id: order_item_id
            }
          }
        },
        include: {
          order_items: {
            where: {
              id: order_item_id
            },
            select: {
              product: {
                select: {
                  images: true
                }
              },
              order_status: {
                select: {
                  title: true,
                }
              }
            }
          }
        }
      })
      const order_status = await this.prisma.orderStatus.findUnique({
        where: {
          id: dto.order_status_id
        }
      })

      const update = await this.prisma.orderItems.update({
        where: {
          id: order_item_id
        },
        data: {
          order_status_id: dto.order_status_id,
          updated_at: new Date()
        }
      })

      if (getOrder && order_status) {
        const userId = getOrder.customer_id;
        const orderId = getOrder.order_id;
        const amount = getOrder.amount;
        const status = order_status.title;

        const images: string[] = [];
        getOrder.order_items.forEach(item => {
          const imagesArray = item.product?.images || [];
          const mainImage = imagesArray.find(img => img.main_image === true);
          const imageSrc = mainImage?.src || imagesArray[0]?.src || '';
          if (imageSrc) images.push(imageSrc);
        });

        let bodyMessage = "";
        switch (status) {
          case "pending":
            bodyMessage = `We’ve received your order #${orderId} worth ₹${amount}. It’s waiting to be processed.`;
            break;
          case "processing":
            bodyMessage = `Good news! Your order #${orderId} worth ₹${amount} is now being prepared.`;
            break;
          case "confirmed":
            bodyMessage = `Your order #${orderId} worth ₹${amount} has been confirmed. We’ll ship it soon!`;
            break;
          case "shipped":
            bodyMessage = `Your order #${orderId} worth ₹${amount} has been shipped and is on its way to you!`;
            break;
          case "delivered":
            bodyMessage = `Hurray🎉! Your order #${orderId} worth ₹${amount} has been delivered. Enjoy your purchase!`;
            break;
          case "cancelled":
            bodyMessage = `Your order #${orderId} worth ₹${amount} has been cancelled. If this wasn’t you, contact support.`;
            break;
          case "failed":
            bodyMessage = `Oops😕. Payment for order #${orderId} worth ₹${amount} failed. Please try again.`;
            break;
          case "refunded":
            bodyMessage = `Refund processed. The amount for order #${orderId} worth ₹${amount} has been credited back to you.`;
            break;
          case "on-hold":
            bodyMessage = `Your order #${orderId} worth ₹${amount} is currently on hold. We’ll update you soon.`;
            break;
          default:
            bodyMessage = `Your order #${orderId} worth ₹${amount} has been updated.`;
        }

        const haveInappPreferance = await this.prisma.notificationPreference.count({
          where: {
            user_id: userId,
            preference_category_id: 5
          }
        })
        if (haveInappPreferance) {
          await createNotification(
            userId,
            "ORDER_STATUS",
            "Order Update",
            bodyMessage,
            { id: getOrder.id, order_id: orderId, amount, status },
            JSON.stringify(images)
          );
        }
      }
      const oldStatus = getOrder?.order_items?.[0]?.order_status?.title;
      const newStatus = order_status?.title;

      const oldStatusFormatted = oldStatus
        ? oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)
        : 'Unknown';
      const newStatusFormatted = newStatus
        ? newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
        : 'Unknown';
      const statusText = `"${oldStatusFormatted}" to "${newStatusFormatted}"`;
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Order status of "Order Id: #${getOrder?.id}" updated from 
         ${statusText},
           updated by "${user_email}".`,
        },
      });
      return update;
    } catch (error) {
      throw error
    }
  }


  async getAllReturnOrder(id: bigint, dto: GetReturnOrderDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          orderCancelImage: {
            src: {
              needs: { id: true, src: true },
              compute(src) {
                if (src.src != null && src.src != '' && src.src != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.id}/${src.src}`
                } else {
                  return ""
                }
              },
            },
          },
        },
      });

      const user = await this.prisma.user.findUnique({
        where: {
          id: id
        },
        select: {
          role_id: true,
          id: true
        }
      })

      // const customerDetails = await this.prisma.user.findUnique({
      //   where: {
      //     id: id
      //   }
      // })

      let allreturnedOrder: any;
      let totalCount: any;
      const allowedStatuses = [10, 11, 13, 14];
      const statusFilter = dto.status
        ? { status_id: dto.status }
        : { status_id: { in: allowedStatuses } };

      if (Number(user?.role_id) === 1) {
        allreturnedOrder = await prisma1.orderCancel.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            ...statusFilter,
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            order: {
              select: {
                order_id: true,
              }
            },
            order_id: true,
            id: true,
            orderCancelImage: true,
            payment_id: true,
            refund_id: true,
            customer_id: true,
            customer: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            refund_status: true,
            order_item_id: true,
            note: true,
            order_item: {
              select: {
                id: true,
                product: {
                  select: {
                    name: true,
                    id: true,
                    description: true,
                    mrp: true,
                  },
                },
                seller_id: true,
                seller: {
                  select: {
                    first_name: true,
                    last_name: true,
                    sellerProfile: {
                      select: {
                        business_name: true,
                      }
                    }
                  }
                }
              }
            },
            created_at: true,
          }
        });
        totalCount = await this.prisma.orderCancel.count({
          where: {
            ...statusFilter,
          },
        });
      } else if (Number(user?.role_id) === 3) {
        allreturnedOrder = await prisma1.orderCancel.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            ...statusFilter,
            order_item: {
              seller_id: id
            }
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            order: {
              select: {
                order_id: true,
              }
            },
            order_id: true,
            id: true,
            orderCancelImage: true,
            note: true,
            payment_id: true,
            refund_id: true,
            customer: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            refund_status: true,
            order_item_id: true,
            order_item: {
              select: {
                product: {
                  select: {
                    name: true,
                    id: true,
                    description: true,
                    mrp: true,
                  },
                },
                seller_id: true,
                seller: {
                  select: {
                    first_name: true,
                    last_name: true,
                    sellerProfile: {
                      select: {
                        business_name: true,
                      }
                    }
                  }
                }
              }
            },
            created_at: true,
          }
        });
        totalCount = await this.prisma.orderCancel.count({
          where: {
            ...statusFilter,
            order_item: {
              seller_id: id
            }
          },
        });
      } else {
        return "Your role is not admin or seller"
      }





      return { orders: allreturnedOrder, totalCount: totalCount };
    } catch (error: any) {
      console.log(error);
    }
  }


  async updateReturnOrder(id: bigint, updateStatusId: number, note?: string) {
    try {
      // get status for get status title
      const status = await this.prisma.orderStatus.findUnique({
        where: {
          id: updateStatusId
        },
        select: {
          title: true,
          id: true
        }
      });

      // update the cancel order table
      const order = await this.prisma.orderCancel.update({
        where: {
          id: id
        },
        data: {
          refund_status: status?.title,
          adminNote: note,
          status_id: updateStatusId,
        }
      });

      const user = await this.prisma.orderCancel.findUnique({
        where: {
          id: id
        },
        select: {
          customer_id: true,
          order_item: {
            select: {
              seller_id: true,
              order_id: true,
            }
          },
          order_item_id: true
        }
      })


      const orderItem = await this.prisma.orderItems.findUnique({
        where: { id: user?.order_item_id },
        select: {
          id: true,
          order_id: true,
          item_metadata: true,
          item_quantity: true,
          total_item_amount: true,
          seller_id: true,
          product: {
            select: {
              name: true,
            }
          },
          order_status: {
            select: {
              id: true,
              title: true
            }
          },
          order: {
            select: {
              id: true,
              order_id: true,
              amount: true,
              customer_id: true,
              rzp_order_id: true,
              rzp_transaction_id: true,
              order_details: true,
            }
          }
        },
      });
      const user_id = user !== undefined && user !== null && BigInt(user?.customer_id)
      const seller_id = user?.order_item?.seller_id

      if (!order) {
        throw new BadRequestException("Order not found");
      };

      const updateOrderItems = await this.prisma.orderItems.update({
        where: {
          id: BigInt(order.order_item_id)
        },
        data: {
          order_status_id: updateStatusId
        }
      })

      const haveInappPreferance = await this.havePreferance(BigInt(user_id), BigInt(5));
      if (haveInappPreferance && orderItem !== null) {
        let notificationText = "";
        if (updateStatusId === 11) {
          notificationText = `Your return request for "${orderItem?.product?.name}" (Order #${orderItem.order.order_id}) is now being processed.`;
        } else if (updateStatusId === 10) {
          notificationText = `The return process for "${orderItem?.product?.name}" (Order #${orderItem.order.order_id}) is now complete. The item has been returned.`;
        }
        else if (updateStatusId === 14) {
          notificationText = `Your return request for "${orderItem?.product?.name}" (Order #${orderItem.order.order_id}) has been rejected.`;
        } else {
          // default fallback
          notificationText = `Your return request for "${orderItem?.product?.name}" (Order #${orderItem.order.order_id}) has been received. We’ll review it and update you shortly.`;
        }
        await createNotification(
          BigInt(user_id),
          "ORDER_STATUS",
          "Order Update",
          notificationText,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: user?.order_item_id,
            customer_id: user_id,
            amount: orderItem.order.amount,
          },
        );
        await createNotification(
          BigInt(1),
          "ORDER_STATUS",
          "Order Update",
          `The item "${orderItem?.product?.name}" from Order #${orderItem.order.order_id} has been successfully returned by the customer.`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: user?.order_item_id,
            customer_id: user_id,
            amount: orderItem.order.amount,
          },
        );
      };


      if (orderItem !== null) {
        const SellerhaveInappPreferance = await this.prisma.notificationPreference.count({
          where: {
            user_id: orderItem.seller_id,
            preference_category_id: 5,
          },
        });

        if (SellerhaveInappPreferance) {
          let sellerNotificationText = "";

          if (updateStatusId === 11) {
            sellerNotificationText = `Return request for Order #${orderItem.order.order_id} is now being processed by admin. The customer requested to return "${orderItem?.product?.name}".`;
          } else if (updateStatusId === 14) {
            sellerNotificationText = `Return request for Order #${orderItem.order.order_id} has been rejected by admin. The customer tried to return "${orderItem?.product?.name}".`;
          } else {
            sellerNotificationText = `Return requested for Order #${orderItem.order.order_id}. The customer has requested to return "${orderItem?.product?.name}".`;
          }

          await createNotification(
            orderItem.seller_id,
            "ORDER_STATUS",
            "Order Update",
            sellerNotificationText,
            {
              id: Number(orderItem.order.id),
              order_id: orderItem.order.order_id,
              order_item_id: user?.order_item_id,
              seller_id: orderItem.seller_id,
            },
          );
        }
      }







      return "Return order updated successfully";

    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  async getAllSellerOrderRerturnPercentage(dto: GetOrderDto) {
    try {
      const { page = 1, rowsPerPage = 10, search, sort, sort_by = "orders" } = dto;

      // 1. Extend Prisma to compute full business logo URL
      const prisma1 = this.prisma.$extends({
        result: {
          sellerProfile: {
            business_logo: {
              needs: { user_id: true, business_logo: true },
              compute(profile) {
                if (profile.business_logo) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${profile.user_id}/${profile.business_logo}`;
                } else {
                  return "";
                }
              },
            },
          },
        },
      });

      // 2. Search filter (on business_name or user first/last name)
      const normalizedSearch = search?.trim().replace(/\s+/g, " ");
      const searchWords = normalizedSearch ? normalizedSearch.split(" ") : [];

      const searchFilter: any = searchWords.length
        ? {
          AND: searchWords.map((word) => ({
            OR: [
              { business_name: { contains: word, mode: "insensitive" } },
              { user: { is: { first_name: { contains: word, mode: "insensitive" } } } },
              { user: { is: { last_name: { contains: word, mode: "insensitive" } } } },
            ],
          })),
        }
        : {};

      // 3. Fetch all matching sellers first (no pagination yet, we’ll paginate later)
      const sellerProfiles = await prisma1.sellerProfile.findMany({
        where: searchFilter,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              image: true,
            },
          },
        },
      });

      const totalCount = sellerProfiles.length;

      // 4. Fetch order counts per seller
      const sellersWithOrders = await this.prisma.orderItems.groupBy({
        by: ["seller_id"],
        _count: { id: true },
      });
      const orderCountMap = new Map(
        sellersWithOrders.map(o => [Number(o.seller_id), o._count.id]),
      );

      // 5. Fetch returns (status_id = 10)
      const sellersWithReturns = await this.prisma.orderCancel.groupBy({
        by: ["order_item_id"],
        where: { status_id: 10 },
        _count: { id: true },
      });

      // 6. Map order_item_id -> seller_id
      const orderItemToSeller = await this.prisma.orderItems.findMany({
        select: { id: true, seller_id: true },
      });
      const itemSellerMap = new Map(orderItemToSeller.map(i => [i.id.toString(), i.seller_id]));

      // 7. Build seller return counts
      const sellerReturnCount: Record<number, number> = {};
      for (const r of sellersWithReturns) {
        const sellerId = itemSellerMap.get(r.order_item_id.toString());
        if (sellerId) {
          sellerReturnCount[Number(sellerId)] =
            (sellerReturnCount[Number(sellerId)] || 0) + r._count.id;
        }
      }

      // 8. Combine all seller data
      let data = sellerProfiles.map(profile => {
        const sellerId = Number(profile.user_id);
        const totalOrders = orderCountMap.get(sellerId) || 0;
        const returnedOrders = sellerReturnCount[sellerId] || 0;
        const percentage = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

        return {
          seller_id: sellerId,
          totalOrders,
          returnedOrders,
          returnPercentage: percentage.toFixed(2) + "%",
          seller_name:
            `${profile?.user?.first_name ?? ""} ${profile?.user?.last_name ?? ""}`.trim() ||
            null,
          seller_image: profile?.user?.image || null,
          business_name: profile?.business_name || null,
          business_logo: profile?.business_logo || null,
        };
      });

      // 9. Sorting (highest or lowest order count)
      if (sort_by === "orders") {
        if (sort === 1) {
          // highest first
          data = data.sort((a, b) => b.totalOrders - a.totalOrders);
        } else if (sort === 0) {
          // lowest first
          data = data.sort((a, b) => a.totalOrders - b.totalOrders);
        }
      }

      // 10. Pagination (after sorting)
      const paginatedData = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

      return {
        total: totalCount,
        page,
        rowsPerPage,
        data: paginatedData,
      };
    } catch (error: any) {
      console.log(error, "error");
      throw new BadRequestException(error.message || "Failed to calculate return percentage");
    }
  }




















  ///////////// Seller order management /////////////////
  async findAllSellerOrders(seller_id: bigint, dto: GetOrderDto) {
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
        },
      })
      let conditions: any = [];
      let searchWord: string = '';
      if (dto?.search) {
        let str = dto.search.trim();
        searchWord = str;

        const searchAsNumber = Number(searchWord);
        const isNumber = !isNaN(searchAsNumber);
        const isInteger = isNumber && Number.isInteger(searchAsNumber);

        const orConditions: any[] = [];

        if (isInteger) {
          orConditions.push({ id: { equals: searchAsNumber } });
        }

        if (isNumber) {
          orConditions.push({ amount: { equals: searchWord } });
        }

        orConditions.push(
          { order_items: { some: { product: { name: { contains: searchWord, mode: "insensitive" } } } } },
        );
        conditions.push({ OR: orConditions });
      }
      if (dto?.sort) {
        conditions.push({
          OR: [
            {
              order_items: {
                some: {
                  order_status_id: { equals: dto?.sort }
                }
              }
            }
          ]
        })
      }

      let orderList: any = []
      if (dto && dto.page && dto.rowsPerPage) {
        orderList = await prisma1.order.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          orderBy: {
            id: 'desc'
          },
          where: {
            order_items: {
              some: {
                seller_id
              }
            },
            AND: conditions,
          },
          select: {
            id: true,
            order_id: true,
            rzp_transaction_id: true,
            payment_status: true,
            amount: true,
            order_date: true,
            customer: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
              }
            },
            order_items: {
              where: {
                seller_id,
                ...(dto.sort && { order_status_id: dto.sort })
              },
              select: {
                id: true,
                item_quantity: true,
                item_metadata: true,
                total_item_amount: true,
                seller_id: true,
                updated_at: true,
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
                      }
                    }
                  }
                },
                product: {
                  select: {
                    slug: true,
                    description: true,
                    images: {
                      select: {
                        id: true,
                        name: true,
                        src: true,
                        main_image: true,
                      }
                    },
                  }
                },
                order_status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
              }
            },
            order_details: {
              select: {
                total_amount: true,
                total_shipping: true,
                total_tax: true,
                order_itm_qty: true,
                order_amount: true,
                discount_amount: true,
                coupon_metadata: true,
                billing: true,
                shipping: true
              }
            }
          }
        })
      }
      else {
        orderList = await prisma1.order.findMany({
          where: {
            order_items: {
              some: {
                seller_id
              }
            },
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            order_id: true,
            rzp_transaction_id: true,
            payment_status: true,
            amount: true,
            order_date: true,
            customer: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
              }
            },
            order_items: {
              where: {
                seller_id,
                ...(dto.sort && { order_status_id: dto.sort })
              },
              select: {
                id: true,
                item_quantity: true,
                item_metadata: true,
                total_item_amount: true,
                seller_id: true,
                updated_at: true,
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
                      }
                    }
                  }
                },
                product: {
                  select: {
                    slug: true,
                    description: true,
                    images: {
                      select: {
                        id: true,
                        name: true,
                        src: true,
                        main_image: true,
                      }
                    },
                  }
                },
                order_status: {
                  select: {
                    id: true,
                    title: true
                  }
                },
              }
            },
            order_details: {
              select: {
                total_amount: true,
                total_shipping: true,
                total_tax: true,
                order_itm_qty: true,
                order_amount: true,
                discount_amount: true,
                coupon_metadata: true,
                billing: true,
                shipping: true
              }
            }
          }
        })
      };
      const parsedOrderData = JSON.parse(JSON.stringify(orderList, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value));

      parsedOrderData.forEach(order => {

        if (order?.order_details?.billing) {
          let billingRaw = order?.order_details?.billing;
          if (billingRaw.startsWith('"') && billingRaw.endsWith('"')) {
            billingRaw = billingRaw.slice(1, -1);
            billingRaw = billingRaw.replace(/\\"/g, '"');
          }
          order.order_details.billing = JSON.parse(billingRaw);
        }
        if (order?.order_details?.shipping) {
          let shippingRaw = order?.order_details?.shipping;
          if (shippingRaw.startsWith('"') && shippingRaw.endsWith('"')) {
            shippingRaw = shippingRaw.slice(1, -1);
            shippingRaw = shippingRaw.replace(/\\"/g, '"');
          }
          order.order_details.shipping = JSON.parse(shippingRaw);
        }


        if (order?.order_details?.coupon_metadata) {
          try {
            order.order_details.coupon_metadata = JSON.parse(order.order_details?.coupon_metadata);
          } catch (e) {
            order.order_details.coupon_metadata = {};
          }
        }
        order.order_items = order.order_items.map(item => {
          const updatedItem = { ...item };

          if (updatedItem.item_metadata) {
            try {
              updatedItem.item_metadata = JSON.parse(updatedItem.item_metadata);
            } catch (err) {
              updatedItem.item_metadata = {};
            }
          }

          if (updatedItem.product?.images) {
            updatedItem.item_metadata.images = updatedItem.product.images;
            delete updatedItem.product;
          }

          return updatedItem;
        });
      });

      const totalCount = await prisma1.order.count({
        where: {
          order_items: {
            some: {
              seller_id
            }
          },
          AND: conditions
        }
      })
      return { orders: parsedOrderData, total: totalCount };
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async findAllSellerOrdersById(seller_id: bigint, order_item_id: bigint) {
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
        },
      })

      let orderList = await prisma1.order.findMany({
        where: {
          order_items: {
            some: {
              id: order_item_id,
              seller_id
            }
          }
        },
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          order_id: true,
          rzp_transaction_id: true,
          payment_status: true,
          amount: true,
          order_date: true,
          customer: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
            }
          },
          order_items: {
            where: {
              id: order_item_id,
              seller_id,
            },
            select: {
              id: true,
              item_quantity: true,
              item_metadata: true,
              total_item_amount: true,
              seller_id: true,
              updated_at: true,
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
                    }
                  }
                }
              },
              product: {
                select: {
                  slug: true,
                  description: true,
                  images: {
                    select: {
                      id: true,
                      name: true,
                      src: true,
                      main_image: true,
                    }
                  },
                }
              },
              order_status: {
                select: {
                  id: true,
                  title: true
                }
              },
            }
          },
          order_details: {
            select: {
              total_amount: true,
              total_shipping: true,
              total_tax: true,
              order_itm_qty: true,
              order_amount: true,
              discount_amount: true,
              coupon_metadata: true,
              billing: true,
              shipping: true
            }
          }
        }
      })

      const parsedOrderData = JSON.parse(JSON.stringify(orderList, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value));

      parsedOrderData.forEach(order => {

        if (order?.order_details?.billing) {
          let billingRaw = order?.order_details?.billing;
          if (billingRaw.startsWith('"') && billingRaw.endsWith('"')) {
            billingRaw = billingRaw.slice(1, -1);
            billingRaw = billingRaw.replace(/\\"/g, '"');
          }
          order.order_details.billing = JSON.parse(billingRaw);
        }
        if (order?.order_details?.shipping) {
          let shippingRaw = order?.order_details?.shipping;
          if (shippingRaw.startsWith('"') && shippingRaw.endsWith('"')) {
            shippingRaw = shippingRaw.slice(1, -1);
            shippingRaw = shippingRaw.replace(/\\"/g, '"');
          }
          order.order_details.shipping = JSON.parse(shippingRaw);
        }

        if (order?.order_details?.coupon_metadata) {
          try {
            order.order_details.coupon_metadata = JSON.parse(order.order_details?.coupon_metadata);
          } catch (e) {
            order.order_details.coupon_metadata = {};
          }
        }
        order.order_items = order.order_items.map(item => {
          const updatedItem = { ...item };

          if (updatedItem.item_metadata) {
            try {
              updatedItem.item_metadata = JSON.parse(updatedItem.item_metadata);
              updatedItem.item_metadata.desc = updatedItem.product.description;
              updatedItem.item_metadata.slug = updatedItem.product.slug;
            } catch (err) {
              updatedItem.item_metadata = {};
            }
          }

          if (updatedItem.product?.images) {
            updatedItem.item_metadata.images = updatedItem.product.images;
            delete updatedItem.product;
          }

          return updatedItem;
        });
      });

      return parsedOrderData
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async CancelOrder(seller_id: bigint, order_item_id: bigint, note: string) {
    try {
      const orderCancelled = await this.prisma.orderCancel.count({
        where: {
          order_item_id
        }
      })
      if (orderCancelled) {
        throw new BadRequestException("Order already cancelled and amount refunded.");
      }
      const orderItem = await this.prisma.orderItems.findUnique({
        where: { id: order_item_id },
        select: {
          id: true,
          order_id: true,
          item_metadata: true,
          item_quantity: true,
          total_item_amount: true,
          seller_id: true,
          order_status: {
            select: {
              id: true,
              title: true
            }
          },
          order: {
            select: {
              id: true,
              order_id: true,
              amount: true,
              customer_id: true,
              customer: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
              rzp_order_id: true,
              rzp_transaction_id: true,
              order_details: true,
            }
          }
        },
      });

      if (!orderItem || orderItem.seller_id !== seller_id) {
        throw new BadRequestException("Invalid order item.");
      }

      if (orderItem.order_status.id === BigInt(8)) {
        throw new BadRequestException("Order already cancelled and amount refunded.");
      }

      const allowedStatuses = ["pending", "processing", "on-hold"];
      if (!allowedStatuses.includes(orderItem.order_status.title)) {
        throw new BadRequestException("Item is not eligible for cancellation.");
      }

      const paymentId = orderItem.order.rzp_transaction_id;
      if (!paymentId) {
        throw new BadRequestException("Payment not found.");
      }

      let { refundAmount } = await this.calculateCancelOrder(orderItem)
      if (refundAmount < 0) {
        refundAmount = 0;
      }
      refundAmount = Number((refundAmount * 100).toFixed(2));

      let refund: any;
      try {
        refund = await this.razorpay.payments.refund(paymentId, {
          amount: refundAmount,
          speed: "optimum",
        });
      } catch (err) {
        throw new BadRequestException("Refund failed: " + err.message);
      }

      await this.prisma.orderCancel.create({
        data: {
          customer_id: orderItem?.order?.customer_id,
          order_id: orderItem.order_id,
          order_item_id: orderItem.id,
          payment_id: paymentId,
          refund_id: refund.id,
          amount: (refundAmount / 100),
          status_id: 6,
          refund_status: refund.status,
          note: note
        },
      });

      const item_metadata = orderItem?.item_metadata
        ? JSON.parse(orderItem?.item_metadata)
        : null;
      const item_quantity = orderItem?.item_quantity
      const item_amount = Number(item_metadata?.mrp) * (+item_quantity)
      const totalShipping = Number(item_metadata?.shipping) * (+item_quantity)

      const cancellation_charges = await this.prisma.adminSettings.findFirst({
        where: { title: "app-settings" }
      });
      const { cancelOrderCharges } = (cancellation_charges?.metadata as Record<string, any>) || {}
      let chargeAmount = new Decimal(0)
      if (cancelOrderCharges && cancelOrderCharges > 0) {
        const percentage = new Decimal(cancelOrderCharges);
        chargeAmount = new Decimal(item_amount).mul(percentage).div(100);
      }
      try {
        const obj = {
          cancellation_charge: cancelOrderCharges ? `${cancelOrderCharges}%` : "0%",
          shipping: totalShipping
        }
        const totalCharge = chargeAmount.plus(totalShipping)
        const updateTransaction = await this.prisma.sellerWalletTransaction.updateMany({
          where: { order_item_id },
          data: {
            amount_earned: 0,
            commision_charge: "0%",
            commision_charges_amount: 0,
            cancellation_charge: JSON.stringify(obj),
            cancellation_charges_amount: totalCharge.toDecimalPlaces(2),
          },
        });
      } catch (error) {
        console.log(error, "error");
      }

      await this.prisma.orderItems.update({
        where: { id: order_item_id },
        data: {
          order_status_id: 6,
          updated_at: new Date()
        },
      });

      const haveInappPreferance = await this.prisma.notificationPreference.count({
        where: {
          user_id: orderItem.order.customer_id,
          preference_category_id: 5
        }
      })
      if (haveInappPreferance) {
        await createNotification(
          orderItem.order.customer_id,
          "ORDER_STATUS",
          "Order Update",
          `Your order #${orderItem.order.order_id} has been cancelled. ₹${(refundAmount / 100)} will be refunded soon`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            amount: orderItem.order.amount,
          },
        );
      }
      await createNotification(
        BigInt(1),
        "ORDER_STATUS",
        "Order Update",
        `Order #${orderItem.order.order_id} worth ₹${(refundAmount / 100)} has been cancelled by customer ${orderItem.order.customer.first_name} ${orderItem.order.customer.last_name}`,
        {
          id: Number(orderItem.order.id),
          order_id: orderItem.order.order_id,
          amount: orderItem.order.amount,
        },
      );

      return refund
    } catch (error) {
      throw error
    }
  }


  async returnConfirmation(seller_id: bigint, order_item_id: bigint) {
    try {
      const orderCancelled = await this.prisma.orderCancel.count({
        where: {
          order_item_id: order_item_id,
          refund_id: { not: "" }
        }
      })
      if (orderCancelled) {
        throw new BadRequestException("Order already cancelled and amount refunded.");
      }
      const orderItem = await this.prisma.orderItems.findUnique({
        where: { id: order_item_id },
        select: {
          id: true,
          order_id: true,
          item_metadata: true,
          item_quantity: true,
          total_item_amount: true,
          seller_id: true,
          order_status: {
            select: {
              id: true,
              title: true
            }
          },
          order: {
            select: {
              id: true,
              order_id: true,
              amount: true,
              customer_id: true,
              rzp_order_id: true,
              rzp_transaction_id: true,
              order_details: true,
            }
          }
        },
      });

      if (!orderItem || orderItem.seller_id !== seller_id) {
        throw new BadRequestException("Invalid order item.");
      }

      // if (orderItem.order_status.id === BigInt(8)) {
      //   throw new BadRequestException("Order already cancelled and amount refunded.");
      // }

      // const allowedStatuses = ["pending", "processing", "on-hold"];
      // if (!allowedStatuses.includes(orderItem.order_status.title)) {
      //   throw new BadRequestException("Item is not eligible for cancellation.");
      // }

      const paymentId = orderItem.order.rzp_transaction_id;
      if (!paymentId) {
        throw new BadRequestException("Payment not found.");
      }

      let { refundAmount } = await this.calculateCancelOrder(orderItem)
      if (refundAmount < 0) {
        refundAmount = 0;
      }
      refundAmount = Number((refundAmount * 100).toFixed(2));

      let refund: any;
      try {
        refund = await this.razorpay.payments.refund(paymentId, {
          amount: refundAmount,
          speed: "optimum",
        });
      } catch (err) {
        throw new BadRequestException("Refund failed: " + err.message);
      }


      await this.prisma.orderCancel.update({
        where: {
          order_item_id
        },
        data: {
          order_item_id,
          refund_id: refund.id,
          status_id: 10,
          refund_status: "returned"
        },
      });

      await this.prisma.orderItems.update({
        where: { id: order_item_id },
        data: {
          order_status_id: 10,
          updated_at: new Date()
        },
      })

      return "Order returned successfully.";

    } catch (error: any) {
      console.log(error);
      throw new BadRequestException(error.response);
    }
  }

  async CancelOrderCharges(seller_id: bigint, order_item_id: bigint) {
    const orderItem = await this.prisma.orderItems.findUnique({
      where: { id: order_item_id, seller_id: seller_id },
      select: {
        id: true,
        order_id: true,
        item_metadata: true,
        item_quantity: true,
        total_item_amount: true,
        seller_id: true,
        order_status: {
          select: {
            id: true,
            title: true
          }
        },
        order: {
          select: {
            id: true,
            order_id: true,
            amount: true,
            customer_id: true,
            rzp_order_id: true,
            rzp_transaction_id: true,
            order_details: true,
          }
        }
      },
    });
    if (!orderItem || orderItem.seller_id !== seller_id) {
      throw new BadRequestException("Invalid order item.");
    }
    const item_metadata = orderItem?.item_metadata
      ? JSON.parse(orderItem?.item_metadata)
      : null;
    const item_quantity = orderItem?.item_quantity ?? 1
    const item_amount = Number(item_metadata?.mrp) * (+item_quantity)
    const cancellation_charges = await this.prisma.adminSettings.findFirst({
      where: { title: "app-settings" }
    });
    const { cancelOrderCharges } = (cancellation_charges?.metadata as Record<string, any>) || {}
    let chargeAmount = new Decimal(0)
    let percentage = new Decimal(0)
    if (cancelOrderCharges && cancelOrderCharges > 0) {
      percentage = new Decimal(cancelOrderCharges);
      chargeAmount = new Decimal(item_amount).mul(percentage).div(100);
    }
    return {
      cancelOrderCharges: percentage,
      chargeAmount,
    };
  }


  async calculateCancelOrder(orderItem: any) {
    let discountPercent = 0;
    const total_amount = Number(orderItem.order.order_details?.total_amount) || 1
    const haveDiscount = Number(orderItem.order.order_details?.discount_amount) || 0;
    const discountData = orderItem?.order?.order_details?.coupon_metadata
      ? JSON.parse(orderItem.order.order_details.coupon_metadata)
      : null;
    const item_metadata = orderItem?.item_metadata
      ? JSON.parse(orderItem?.item_metadata)
      : null;
    const item_quantity = orderItem?.item_quantity
    const item_amount = Number(item_metadata?.mrp) * (+item_quantity)
    const totalShipping = Number(item_metadata?.shipping) * (+item_quantity)
    let refundAmount = item_amount;

    if (haveDiscount > 0 && discountData) {

      if (discountData.type === "percentage") {
        discountPercent = Number(discountData.amount);
      } else if (discountData.type === "fixed") {
        if (total_amount > 0) {
          discountPercent = (haveDiscount / total_amount) * 100;
        }
      }

      if (discountPercent > 0) {
        const itemDiscount = (refundAmount * discountPercent) / 100;
        refundAmount -= itemDiscount;
      }
    }

    return {
      discountPercent,
      refundAmount: +((refundAmount) + (totalShipping)).toFixed(2),
    };
  }

}
