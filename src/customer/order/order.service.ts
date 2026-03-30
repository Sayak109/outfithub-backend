import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { CartService } from '@/customer/cart/cart.service';
import { Decimal } from '@generated/prisma/runtime/library';
import { Type } from '../cart/dto/cart-holding.dto';
import Razorpay = require("razorpay");
import { PaymentDto } from './dto/payment-dto';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { createNotification, decryptData, encryptData } from '@/common/helper/common.helper';
import { GetOrderDto } from '@/orders/dto/get-order-dto';
import { SettingsService } from '@/settings/settings.service';
import * as path from 'path';
import * as fs from 'fs';
import handlebars from "handlebars";
import puppeteer from "puppeteer";
import * as numberToWords from 'number-to-words'
import { MailService } from '@/mail/mail.service';
import { NotificationService } from '@/notification/notification.service';

@Injectable()
export class OrderService {
  private razorpay: Razorpay;
  constructor(
    private prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly settingService: SettingsService,
    private mailService: MailService,
    private notificationService: NotificationService
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

  async checkout(customer_id: bigint, dto: CheckoutDto) {
    try {
      const checkUser = await this.prisma.user.count({
        where: {
          id: customer_id,
          is_temporary: false
        }
      })
      if (!checkUser) {
        throw new BadRequestException("Unable to checkout. Please signin/signup.")
      }

      const customer_cart = await this.cartService.findAll(customer_id, dto);
      let net_total = new Decimal(0);
      let coupon_discount_amount = new Decimal(0);
      const cart_total = new Decimal(customer_cart.cart_total);

      // if (dto && dto.coupon_id) {
      //   const coupon = await this.getCouponData(dto.coupon_id);
      //   if (coupon) {
      //     const isExpired = !coupon.expire_at || coupon.expire_at < new Date();
      //     const isInactive = coupon.status.title === "inactive";

      //     if (isExpired || isInactive) {
      //       throw new BadRequestException("Coupon is expired or invalid.");
      //     }

      //     const minOrderValue = new Decimal(coupon.min_order_value ?? 0);
      //     const cartTotalDecimal = new Decimal(cart_total);

      //     if (cartTotalDecimal.lt(minOrderValue)) {
      //       throw new BadRequestException(`This coupon requires a minimum order value of ₹${minOrderValue.toFixed(2)}.`);
      //     }
      //     if (coupon.type === 'percentage') {
      //       const discountPercentage = coupon.amount;
      //       coupon_discount_amount = cart_total.mul(discountPercentage / 100).toDecimalPlaces(2);
      //     } else {
      //       coupon_discount_amount = new Decimal(coupon.amount);
      //     }
      //   }
      // }
      // net_total = cart_total.minus(coupon_discount_amount)

      const data = {
        ...customer_cart,
        // coupon_discount: (+coupon_discount_amount.toFixed(2)),
        total: cart_total,
      }

      return data
    } catch (error) {
      throw error;
    }
  }

  async create(customer_id: bigint, dto: CreateOrderDto) {
    try {
      const checkUser = await this.prisma.user.count({
        where: {
          id: customer_id,
          is_temporary: false
        }
      })
      if (!checkUser) {
        throw new BadRequestException("Unable to place order. Please signin/signup.")
      }
      const cartHolding = await this.prisma.cartHoldingItems.findUnique({
        where: {
          user_id: customer_id,
        },
        select: {
          expired_at: true,
          unavailable_product_ids: true
        }
      })
      if (cartHolding === null || (cartHolding && cartHolding.expired_at && cartHolding.expired_at < new Date())) {
        await this.cartService.cartHolding(BigInt(customer_id), { type: Type.ROLLBACK });
        throw new BadRequestException("Order timed out.");
      }
      if (cartHolding && cartHolding?.unavailable_product_ids?.length > 0) {
        throw new BadRequestException("Some products in your cart are currently out of stock.");
      }
      await this.checkAddress(customer_id, BigInt(dto.billing_id), BigInt(dto.shipping_id));

      const cartItems = await this.checkout(BigInt(customer_id), { coupon_id: dto.coupon_id })
      const order = await this.createOrder(customer_id);
      const coupon = await this.getCouponData(dto.coupon_id);
      const couponMeta = {
        code: coupon?.code,
        type: coupon?.type,
        amount: coupon?.amount
      }
      const orderItems = await this.createOrderItems(order.id, cartItems);
      if (orderItems && orderItems.length) {
        const orderDetails = await this.createOrderDetails(order.id, cartItems, dto, couponMeta);
        const options = {
          amount: +(cartItems.total.mul(100)),
          currency: "INR",
          receipt: `order_rcptid_${order.id}`,
          notes: {
            order_id: (order.id).toString(),
            user_id: (customer_id).toString(),
          }
        };

        const razorpayOrder = await this.razorpay.orders.create(options);
        if (razorpayOrder) {
          const updateOrder = await this.updateOrderPaymentInfo(order.id, razorpayOrder);
        } else {
          throw new BadRequestException("Order failed. Try again later.")
        }
        const returnData = {
          rzp_order_id: razorpayOrder.id,
          amount: (+razorpayOrder.amount) / 100,
          currency: razorpayOrder.currency,
          order_id: order.id,
          user_id: customer_id
        }
        const encrypted = encryptData(returnData);
        return encrypted;
      } else {
        throw new BadRequestException("Order failed. Try again later.")
      }
    } catch (error) {
      throw error;
    }
  }

  private async checkAddress(
    customer_id: bigint,
    billing_id: bigint,
    shipping_id: bigint
  ): Promise<void> {
    const billingaddress = await this.prisma.address.findUnique({
      where: {
        user_id: customer_id,
        id: billing_id,
        address_type: "BILLING"
      }
    });
    const shippingaddress = await this.prisma.address.findUnique({
      where: {
        user_id: customer_id,
        id: shipping_id,
        address_type: "SHIPPING"
      }
    });

    if (!billingaddress) {
      throw new BadRequestException("Enter a valid billing address.");
    }
    if (!shippingaddress) {
      throw new BadRequestException("Enter a valid shipping address.");
    }
  }

  private async createOrder(customer_id: bigint) {
    const order = await this.prisma.order.create({
      data: {
        order_id: "",
        customer_id,
        rzp_order_id: "",
        amount: 0,
        currency: ""
      }
    });
    const timestampPart = new Date().getTime().toString().slice(-4);
    const orderId = `YD${timestampPart}N${order.id}`;
    await this.prisma.order.update({
      where: { id: order.id },
      data: { order_id: orderId },
    });
    return order
  }

  async getCouponData(code_id?: number) {
    if (!code_id) return null;
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: code_id },
      select: {
        code: true,
        amount: true,
        type: true,
        min_order_value: true,
        status: { select: { title: true } },
        expire_at: true
      }
    });
    return coupon;
  }

  private async createOrderItems(orderId: bigint, cartItems: any) {
    const orderItemPromises = cartItems.cartItems.map((items: any) => {
      const attributesMap = new Map<string, string[]>();

      items.cartAttributes?.forEach((cartAttr: any) => {
        const attrName = cartAttr.attributeTerm?.attributes?.name;
        const attrValue = cartAttr.attributeTerm?.name;

        if (attrName && attrValue) {
          if (!attributesMap.has(attrName)) {
            attributesMap.set(attrName, []);
          }
          attributesMap.get(attrName)!.push(attrValue);
        }
      });

      const formattedAttributes = Array.from(attributesMap.entries()).map(([name, values]) => ({ name, values }));

      const product = items?.product
      const seller = product?.seller;
      const itemMeta = {
        id: (product?.id).toString(),
        name: product?.name,
        sku: product?.sku,
        mrp: product?.mrp,
        shipping: product?.shipping,
        tax: product?.tax,
        categories: product?.categories?.map((cat: any) => cat.name),
        attributes: formattedAttributes,
        seller_id: (seller?.id).toString(),
      };

      return this.prisma.orderItems.create({
        data: {
          order_id: orderId,
          product_id: items?.product?.id,
          item_metadata: JSON.stringify(itemMeta),
          seller_id: seller?.id,
          total_item_amount: items?.total_price,
          item_quantity: items?.quantity,
          order_status_id: 1
        }
      });
    });

    return Promise.all(orderItemPromises);
  }

  private async createOrderDetails(orderId: bigint, cartItems: any, dto: CreateOrderDto, couponMeta: any) {
    const billing = await this.prisma.address.findUnique({
      where: {
        id: dto.billing_id,
      },
    });

    const shipping = await this.prisma.address.findUnique({
      where: {
        id: dto.shipping_id,
      },
    });

    let billing_address: any = null;
    let shipping_address: any = null;

    if (billing) {
      billing_address = {
        metadata: JSON.parse(billing.metadata),
      };
    }

    if (shipping) {
      shipping_address = {
        metadata: JSON.parse(shipping.metadata),
      };
    }


    return this.prisma.orderDetails.create({
      data: {
        order_id: orderId,
        order_itm_qty: cartItems.order_qty,
        total_amount: cartItems.total_amount,
        discount_amount: cartItems.coupon_discount,
        total_tax: cartItems.total_tax,
        order_amount: cartItems.total,
        total_shipping: cartItems.total_shipping,
        shipping: shipping ? JSON.stringify(shipping_address) : "",
        billing: billing ? JSON.stringify(billing_address) : "",
        coupon_metadata: JSON.stringify(couponMeta),
      },
    });
  }

  private async updateOrderPaymentInfo(orderId: bigint, razorpayOrder: any) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        rzp_order_id: razorpayOrder.id,
        payment_status: razorpayOrder.status,
        amount: razorpayOrder.amount / 100,
        currency: "INR"
      }
    });
  }

  async payment(order_id: bigint, customer_id: bigint, paymentDto: PaymentDto) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: order_id, customer_id }
      });
      if (!order) {
        throw new BadRequestException("No Order found.")
      }
      const paymentBody = decryptData(paymentDto.data)
      const { rzp_order_id, rzp_transaction_id, rzp_signature } = paymentBody.data;

      if (order?.rzp_order_id !== rzp_order_id) {
        return await this.paymentFailed(order_id);
      }

      const isValid = await this.verifyRazorpaySignature(rzp_order_id, rzp_transaction_id, rzp_signature);
      if (!isValid) {
        return await this.paymentFailed(order_id);
      }

      const payment = await this.razorpay.payments.fetch(rzp_transaction_id);
      const paid_amount = +((order.amount).mul(100))

      if (payment.id === rzp_transaction_id && payment.status === "captured" && payment.amount === paid_amount) {
        await this.removeCart(order.customer_id);
        const orderData = await this.orderData(order_id, customer_id);

        const orderId = order.order_id
        const images: string[] = [];
        orderData.order_items.forEach(item => {
          const imagesArray = item.item_metadata?.images || [];
          const mainImage = imagesArray.find(img => img.main_image === true);
          const imageSrc = mainImage?.src || imagesArray[0]?.src || '';
          if (imageSrc) images.push(imageSrc);
        });

        setImmediate(async () => {
          try {
            const haveInappPreferance = await this.havePreferance(customer_id, BigInt(5))
            if (haveInappPreferance) {
              await createNotification(
                customer_id,
                "ORDER_PLACED",
                "Order Placed",
                `Your order #${orderId} worth ₹${orderData.amount} has been placed successfully.`,
                {
                  id: order_id,
                  order_id: orderId,
                  customer_id: customer_id,
                  amount: orderData.amount,
                },
                JSON.stringify(images)
              );
            }
            await createNotification(
              BigInt(1),
              "ORDER_PLACED",
              "Order Placed",
              `Order #${orderId} worth ₹${orderData.amount} has been placed successfully.`,
              {
                id: order_id,
                order_id: orderId,
                customer_id: customer_id,
                amount: orderData.amount,
              },
              JSON.stringify(images)
            );
            const haveMailPreferance = await this.havePreferance(customer_id, BigInt(3))
            if (haveMailPreferance) {
              const send = await this.mailService.sendOrderPlaceEmail(customer_id, orderData)
            }
            const havePushPreferance = await this.havePreferance(customer_id, BigInt(1))
            if (havePushPreferance) {
              const send = await this.notificationService.sendOrderPlaceNotification(order_id, customer_id)
            }
          } catch (error) {
            console.error("Failed to send notifiactions")
          }
        });

        return orderData;
      } else {
        return await this.paymentFailed(order_id);
      }
    } catch (error) {
      throw error;
    }
  }

  private async havePreferance(customer_id: bigint, preference_category_id: bigint) {
    return await this.prisma.notificationPreference.count({
      where: {
        user_id: customer_id,
        preference_category_id
      }
    })
  }

  private async updateAdminWallet(amount: number) {
    const adminWallet = await this.prisma.wallet.findUnique({
      where: {
        user_id: 1
      }
    })
    if (!adminWallet) {
      await this.prisma.wallet.create({
        data: {
          user_id: 1,
          total_amount: 0
        }
      })
    }
    await this.prisma.wallet.update({
      where: {
        user_id: 1
      },
      data: {
        total_amount: {
          increment: amount
        }
      }
    })
  }

  private async verifyRazorpaySignature(rzp_order_id: string, rzp_payment_id: string, rzp_signature: string) {
    const decryptedRes = await this.settingService.paymentSettings();
    const RazorpaySetting = decryptData(decryptedRes)

    const hmac = crypto.createHmac('sha256', RazorpaySetting.RAZORPAY_KEY_SECRET!);
    hmac.update(`${rzp_order_id}|${rzp_payment_id}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === rzp_signature;
  }

  private async paymentFailed(order_id: bigint) {
    await this.prisma.orderItems.updateMany({
      where: {
        order_id
      },
      data: {
        order_status_id: 7
      }
    });
    throw new BadRequestException("Payment failed.");
  }

  async removeCart(customer_id: bigint) {
    const customerCart = await this.prisma.cart.findMany({
      where: {
        customer_id
      }
    })
    for (const cart of customerCart) {
      await this.cartService.remove(cart.id)
    }
    await this.prisma.cartHoldingItems.deleteMany({
      where: {
        user_id: customer_id
      }
    })
  }

  async orderData(order_id: bigint, customer_id: bigint) {
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
          customer_id
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
              order_itm_qty: true,
              order_amount: true,
              total_tax: true,
              discount_amount: true,
              coupon_metadata: true,
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
      if (parsedOrderData?.order_details?.coupon_metadata) {
        parsedOrderData.order_details.coupon_metadata = JSON.parse(parsedOrderData.order_details?.coupon_metadata);
      }
      parsedOrderData.order_items = parsedOrderData.order_items.map(item => {
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
      parsedOrderData.total_ordered_quantity = parsedOrderData.order_items.reduce(
        (sum, item) => sum + Number(item.item_quantity || 0),
        0
      );
      return parsedOrderData || [];
    } catch (error) {
      throw error
    }
  }

  private async updateSellerWallet(orderItems: any[]) {
    try {
      for (const item of orderItems) {
        const transactionExists = await this.prisma.sellerWalletTransaction.findFirst({
          where: {
            order_item_id: item?.id
          }
        })
        if (transactionExists) continue;

        const seller_id = item.seller_id;
        const totalAmount = Number(item.total_item_amount);

        const commission_charges = await this.prisma.adminSettings.findFirst({
          where: {
            title: "app-settings",
          }
        })
        const {
          adminCommissionCharges,
        } = commission_charges?.metadata as Record<string, any> || {};

        const platformFee = (totalAmount * adminCommissionCharges) / 100;
        const sellerEarning = totalAmount - platformFee;

        let wallet = await this.prisma.wallet.findUnique({
          where: {
            user_id: seller_id
          }
        })
        if (!wallet) {
          wallet = await this.prisma.wallet.create({
            data: {
              user_id: seller_id,
              total_amount: 0
            }
          });
        }

        await this.prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            total_amount: {
              increment: sellerEarning
            }
          }
        });

        await this.prisma.sellerWalletTransaction.create({
          data: {
            wallet_id: wallet.id,
            order_item_id: item.id,
            amount_earned: sellerEarning,
            commision_charge: `${adminCommissionCharges}%`,
            commision_charges_amount: platformFee
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to update seller wallet:", error);
      throw new Error("Failed to update seller wallet.");
    }
  }


  async findAll(user_id: bigint, dto: GetOrderDto) {
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
            customer_id: user_id,
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
              where: dto.sort
                ? {
                  order_status_id: dto.sort
                }
                : undefined,
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
            customer_id: user_id,
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
              where: dto.sort
                ? {
                  order_status_id: dto.sort
                }
                : undefined,
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

      const totalCount = await prisma1.order.count({
        where: {
          customer_id: user_id,
          AND: conditions
        }
      })

      return { orders: parsedOrderData, total: totalCount };
    } catch (error) {
      console.log("error", error);

      throw error
    }
  }

  async GetCancelOrder(user_id: bigint, order_item_id: bigint) {
    try {
      const orderItem = await this.prisma.orderItems.findUnique({
        where: { id: order_item_id },
        select: {
          id: true,
          order_id: true,
          item_metadata: true,
          item_quantity: true,
          total_item_amount: true,
          order_status: {
            select: {
              id: true,
              title: true
            }
          },
          order: {
            select: {
              amount: true,
              customer_id: true,
              rzp_order_id: true,
              rzp_transaction_id: true,
              order_details: true,
            }
          }
        },
      });
      return await this.calculateCancelOrder(orderItem)
    } catch (error) {
      throw error
    }
  }

  async CancelOrder(user_id: bigint, order_item_id: bigint, note: string) {
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
          seller_id: true,
          item_metadata: true,
          item_quantity: true,
          total_item_amount: true,
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

      if (!orderItem || orderItem.order.customer_id !== user_id) {
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
          customer_id: user_id,
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

      // const cancellation_charges = await this.prisma.adminSettings.findFirst({
      //   where: { title: "app-settings" }
      // });
      // const { cancelOrderCharges } = (cancellation_charges?.metadata as Record<string, any>) || {}
      // let chargeAmount = new Decimal(0)
      // if (cancelOrderCharges && cancelOrderCharges > 0) {
      //   const percentage = new Decimal(cancelOrderCharges);
      //   chargeAmount = new Decimal(item_amount).mul(percentage).div(100);
      // }
      try {
        const updateTransaction = await this.prisma.sellerWalletTransaction.updateMany({
          where: { order_item_id },
          data: {
            amount_earned: 0,
            commision_charge: "0%",
            commision_charges_amount: 0,
            cancellation_charge: "0%",
            cancellation_charges_amount: 0
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

      const haveInappPreferance = await this.havePreferance(user_id, BigInt(5))
      if (haveInappPreferance) {
        await createNotification(
          user_id,
          "ORDER_STATUS",
          "Order Update",
          `Your order #${orderItem.order.order_id} has been cancelled. ₹${(refundAmount / 100)} will be refunded soon`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: order_item_id,
            customer_id: user_id,
            amount: orderItem.order.amount,
          },
        );
      }
      await createNotification(
        BigInt(1),
        "ORDER_STATUS",
        "Order Update",
        `Order #${orderItem.order.order_id} worth ₹${(refundAmount / 100)} has been cancelled by customer.`,
        {
          id: Number(orderItem.order.id),
          order_id: orderItem.order.order_id,
          order_item_id: order_item_id,
          customer_id: user_id,
          amount: orderItem.order.amount,
        },
      );
      setImmediate(async () => {
        try {
          const haveMailPreferance = await this.havePreferance(user_id, BigInt(3))
          if (haveMailPreferance) {
            const orderData = await this.orderData(orderItem.order.id, user_id);
            await this.mailService.sendOrderUpdationEmail(user_id, BigInt(order_item_id), orderData)
          }
        } catch (error) {
          console.error("Error sending reject email", error);
        }
      });

      const SellerhaveInappPreferance = await this.prisma.notificationPreference.count({
        where: {
          user_id: orderItem.seller_id,
          preference_category_id: 5
        }
      })
      if (SellerhaveInappPreferance) {
        await createNotification(
          orderItem.seller_id,
          "ORDER_STATUS",
          "Order Update",
          `Order #${orderItem.order.order_id} has been cancelled by the customer. You can disregard the item ${orderItem.product?.name}.`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: order_item_id,
            seller_id: orderItem.seller_id,
          },
        );
      }

      return refund
    } catch (error) {
      throw error
    }
  }

  async ReturnOrder(user_id: bigint, order_item_id: bigint, note: string) {
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

      if (!orderItem || orderItem.order.customer_id !== user_id) {
        throw new BadRequestException("Invalid order item.");
      }

      if (orderItem.order_status.id === BigInt(10)) {
        throw new BadRequestException("Order already returned and amount refunded.");
      }

      const allowedStatuses = ["delivered"];
      if (!allowedStatuses.includes(orderItem.order_status.title)) {
        throw new BadRequestException("Item is not eligible for return.");
      }

      const paymentId = orderItem.order.rzp_transaction_id;
      if (!paymentId) {
        throw new BadRequestException("Payment not found.");
      }

      const orderCancel = await this.prisma.orderCancel.create({
        data: {
          customer_id: user_id,
          order_id: orderItem.order_id,
          order_item_id: orderItem.id,
          payment_id: paymentId,
          refund_id: "",
          amount: 0,
          status_id: 13,
          refund_status: "return pending",
          note: note,
        },
      });

      const item_metadata = orderItem?.item_metadata
        ? JSON.parse(orderItem?.item_metadata)
        : null;
      const item_quantity = orderItem?.item_quantity
      const item_amount = Number(item_metadata?.mrp) * (+item_quantity)

      // const cancellation_charges = await this.prisma.adminSettings.findFirst({
      //   where: { title: "app-settings" }
      // });
      // const { cancelOrderCharges } = (cancellation_charges?.metadata as Record<string, any>) || {}
      // let chargeAmount = new Decimal(0)
      // if (cancelOrderCharges && cancelOrderCharges > 0) {
      //   const percentage = new Decimal(cancelOrderCharges);
      //   chargeAmount = new Decimal(item_amount).mul(percentage).div(100);
      // }
      try {
        const updateTransaction = await this.prisma.sellerWalletTransaction.updateMany({
          where: { order_item_id },
          data: {
            amount_earned: 0,
            commision_charge: "0%",
            commision_charges_amount: 0,
            cancellation_charge: "0%",
            cancellation_charges_amount: 0
          },
        });
      } catch (error) {
        console.log(error, "error");
      }

      await this.prisma.orderItems.update({
        where: { id: order_item_id },
        data: {
          order_status_id: 13,
          updated_at: new Date()
        },
      });

      const haveInappPreferance = await this.havePreferance(user_id, BigInt(5))
      if (haveInappPreferance) {
        await createNotification(
          user_id,
          "ORDER_STATUS",
          "Order Update",
          `Your return request for "${orderItem?.product?.name}" (Order #${orderItem.order.order_id}) has been received. We’ll review it and update you shortly.`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: order_item_id,
            customer_id: user_id,
            amount: orderItem.order.amount,
          },
        );
      }
      await createNotification(
        BigInt(1),
        "ORDER_STATUS",
        "Order Update",
        `Return requested for Order #${orderItem.order.order_id}. The customer has requested to return "${orderItem?.product?.name}".`,
        {
          id: Number(orderItem.order.id),
          order_id: orderItem.order.order_id,
          order_item_id: order_item_id,
          customer_id: user_id,
          amount: orderItem.order.amount,
        },
      );

      const SellerhaveInappPreferance = await this.prisma.notificationPreference.count({
        where: {
          user_id: orderItem.seller_id,
          preference_category_id: 5
        }
      })
      if (SellerhaveInappPreferance) {
        await createNotification(
          orderItem.seller_id,
          "ORDER_STATUS",
          "Order Update",
          `Return requested for Order #${orderItem.order.order_id}. The customer has requested to return "${orderItem?.product?.name}".`,
          {
            id: Number(orderItem.order.id),
            order_id: orderItem.order.order_id,
            order_item_id: order_item_id,
            seller_id: orderItem.seller_id,
          },
        );
      }
      return { orderCancel };
    } catch (error) {
      console.log(error, "error");
      throw error
    }
  }


  async ReturnOrderImage(cancel_id: bigint, file) {
    try {
      const imageFileName = file?.filename ?? '';

      let dataToUpdate: any = {}
      if (imageFileName === "null") {
        dataToUpdate.images = null;
      } else if (imageFileName !== '') {
        dataToUpdate.images = `${imageFileName}`;
      }

      const product = await this.prisma.orderCancelImage.create({
        data: {
          name: imageFileName,
          src: imageFileName,
          alt: imageFileName,
          cancel_id: cancel_id,
        }
      });

      return product;
    } catch (error: any) {
      throw error;
    }
  }







  async calculateCancelOrder(orderItem: any) {
    const cancellation_charges = await this.prisma.adminSettings.findFirst({
      where: { title: "app-settings" }
    });
    const { cancelOrderCharges } = (cancellation_charges?.metadata as Record<string, any>) || {}
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

    // if (cancelOrderCharges && cancelOrderCharges > 0) {
    //   const chargeAmount = (refundAmount * cancelOrderCharges) / 100;
    //   refundAmount -= chargeAmount;
    // }
    return {
      // cancelOrderCharges: `${cancelOrderCharges}%`,
      discountPercent,
      refundAmount: +refundAmount.toFixed(2),
    };
  }
  async Test(body: any) {
    try {
      return await encryptData(body);
      // const refund = await this.razorpay.refunds.fetch(body.refund_id);

      // return (refund);
    } catch (error) {
      throw error
    }
  }

  async createPDF(order_item_id: bigint, customer_id: bigint) {
    try {
      const order_id = await this.prisma.orderItems.findUnique({
        where: {
          id: order_item_id
        }
      })
      if (!order_id) {
        throw new BadRequestException("No order found.")
      }
      const orderData = await this.orderData(order_id?.order_id, customer_id)
      const pickupLocation = await this.prisma.shiprocketOrder.findFirst({
        where: {
          orderItemsId: order_item_id
        },
        select: {
          createdAt: true,
          pickup_location: {
            select: {
              address: true,
              pickup_location: true,
              city: true,
              state: true,
              pin_code: true,
              seller: {
                select: {
                  sellerProfile: {
                    select: {
                      business_name: true,
                    }
                  },
                  SellerKYC: {
                    select: {
                      GSTIN: true,
                      PAN: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      const templatePath = path.join(__dirname, "../../mail/templates/order-invoice.hbs");
      const templateHtml = fs.readFileSync(templatePath, "utf8");

      // handlebars.registerHelper("inc", function (value) {
      //   return parseInt(value) + 1;
      // });
      const template = handlebars.compile(templateHtml);
      const billing = orderData?.order_details?.billing?.metadata
      const shipping = orderData?.order_details?.shipping?.metadata

      function formatDate(isoString?: string): string {
        if (!isoString) return "--";
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      const orderItem = orderData.order_items.find(item => item.id == order_item_id);
      const item_qty = Number(orderItem.item_quantity)
      const mrp = Number(orderItem.item_metadata.mrp)
      const taxRate = Number(orderItem.item_metadata.tax)
      const unitPrice = (mrp) / (1 + taxRate / 100);

      const taxAmount = ((Number(mrp) - Number(unitPrice)) * item_qty).toFixed(2)
      const itemTotal = (mrp + Number(orderItem.item_metadata.shipping)) * item_qty

      let taxRateText = '';
      if (shipping?.state === pickupLocation?.pickup_location?.state) {
        taxRateText = `${taxRate / 2}% CGST / ${taxRate / 2}% SGST`;
      } else {
        taxRateText = `${taxRate}% IGST`;
      }

      const inWords = numberToWords.toWords(Math.round(+orderItem.total_item_amount));
      const totalInWords: string = inWords
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const invoice_date = pickupLocation?.createdAt ? (pickupLocation?.createdAt.toISOString()) : new Date().toISOString()
      const data = {
        company: { logo: `${process.env.BASE_PATH!}/${process.env.IMAGE_PATH}/site/logo.png` },
        seller: {
          name: `${pickupLocation?.pickup_location.seller.sellerProfile?.business_name}`,
          address: `${pickupLocation?.pickup_location.address}, 
            ${pickupLocation?.pickup_location.pickup_location}`,
          csp: `${pickupLocation?.pickup_location.city},${pickupLocation?.pickup_location.state},
          ${pickupLocation?.pickup_location.pin_code}`,
          pan: `${pickupLocation?.pickup_location.seller.SellerKYC?.PAN}`,
          gstin: `${pickupLocation?.pickup_location.seller.SellerKYC?.GSTIN}`
        },
        billing: {
          name: `${billing?.first_name} ${billing?.last_name}`,
          mobile_no: `${billing?.mobile_no}`,
          address: `${billing?.address1}`,
          city: `${billing?.city}`,
          state: `${billing?.state}`,
          pincode: `${billing?.pincode}`,
        },
        shipping: {
          name: `${shipping?.first_name} ${shipping?.last_name}`,
          mobile_no: `${shipping?.mobile_no}`,
          address: `${shipping?.address1}`,
          city: `${shipping?.city}`,
          state: `${shipping?.state}`,
          pincode: `${shipping?.pincode}`,
        },
        order: { number: `${orderData.order_id}`, date: `${formatDate(orderData.order_date)}` },
        invoice: { number: `In-${order_item_id}`, date: `${formatDate(invoice_date)}` },
        items: [
          {
            description: `${orderItem.item_metadata.name}`,
            sku: `${orderItem.item_metadata.sku}`,
            unitPrice: `${unitPrice.toFixed(2)}`,
            qty: `${item_qty}`,
            netAmount: (unitPrice * item_qty).toFixed(2),
            taxRate: `${taxRateText}`,
            taxAmount: taxAmount,
            shipping: (Number(orderItem.item_metadata.shipping) * Number(item_qty)).toFixed(2),
            total: `${itemTotal.toFixed(2)}`
          }
        ],
        summary: {
          total: `${orderItem.total_item_amount}`,
          amountInWords: totalInWords
        }
      };

      const finalHtml = template(data);

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(finalHtml, { waitUntil: "networkidle0" });

      await page.pdf({
        path: "invoice.pdf",
        format: "A4",
        printBackground: true
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true
      });

      await browser.close();
      return pdfBuffer
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async sendOrderUpdateEmail(order_item_id: bigint, customer_id: bigint,) {
    try {
      const order = await this.prisma.orderItems.findFirst({
        where: {
          id: order_item_id
        }
      })
      if (!order) {
        throw new BadRequestException("No order found.")
      }
      const orderData = await this.orderData(order?.order_id, customer_id);
      const pdfBuffer = await this.createPDF(BigInt(order_item_id), customer_id);
      await this.mailService.sendOrderUpdationEmail(customer_id, BigInt(order_item_id), orderData, pdfBuffer)
    }
    catch (error) {
      throw error
    }
  }

}
