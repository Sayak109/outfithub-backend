import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import Razorpay = require("razorpay");
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { CartService } from '@/customer/cart/cart.service';
import { Decimal } from '@generated/prisma/runtime/library';
import { SettingsService } from '@/settings/settings.service';
import { decryptData } from '@/common/helper/common.helper';

@Injectable()
export class WebhookService {
  constructor(
    private prisma: PrismaService,
    private settingService: SettingsService
  ) { }
  async razorpayWebhook(rawBody: Buffer, razorpaySignature: string) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(rawBody);
      const digest = shasum.digest('hex');
      if (digest !== razorpaySignature) {
        throw new BadRequestException("Invalid signature")
      }

      const event = JSON.parse(rawBody.toString());
      if (event.event !== 'payment.captured') {
        return;
      }

      const paymentEntity = event.payload.payment.entity;
      const rzp_order_id = paymentEntity.order_id;
      const rzp_transaction_id = paymentEntity.id;

      const order = await this.prisma.order.findFirst({
        where: { rzp_order_id },
        select: {
          id: true,
          payment_status: true,
          amount: true,
          customer_id: true,
        }
      });

      if (!order) {
        throw new BadRequestException("Order not found");
      }
      if (order.payment_status === 'paid') {
        return true;
      }
      const decryptedRes = await this.settingService.paymentSettings();
      const RazorpaySetting = decryptData(decryptedRes)
      const razorpay = new Razorpay({
        key_id: RazorpaySetting.RAZORPAY_KEY_ID!,
        key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET!
      });
      const payment = await razorpay.payments.fetch(rzp_transaction_id);

      const paid_amount = +(order.amount.mul(100));
      if (payment.status === "captured" && payment.amount === paid_amount) {
        await this.prisma.orderItems.updateMany({
          where: {
            order_id: order.id
          },
          data: {
            order_status_id: 2
          }
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            rzp_transaction_id,
            payment_status: "paid"
          }
        });

        await this.removeCart(order.customer_id);
        const orderData = await this.orderData(order.id, order.customer_id);

        await this.updateAdminWallet(+order.amount)
        await this.updateSellerWallet(orderData.order_items);

        return true;
      } else {
        await this.paymentFailed(order.id);
      }
      return true;
    } catch (error) {
      throw error
    }
  }


  async removeCart(customer_id: bigint) {
    const customerCart = await this.prisma.cart.findMany({
      where: {
        customer_id
      }
    })
    for (const cart of customerCart) {
      const existingCart = await this.prisma.cart.findUnique({
        where: { id: cart.id },
      });

      if (!existingCart) {
        return;
      }

      await this.prisma.cartAttributeTerm.deleteMany({
        where: { cart_id: cart.id }
      });
      const delCart = await this.prisma.cart.delete({
        where: { id: cart.id }
      });
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
              product_id: true,
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
                    }
                  }
                }
              },
              order_status: {
                select: {
                  id: true,
                  title: true
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
              }
            }
          },
          order_details: {
            select: {
              order_itm_qty: true,
              order_amount: true,
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
      parsedOrderData.total_ordered_quantity = parsedOrderData.order_items.reduce(
        (sum, item) => sum + Number(item.item_quantity || 0),
        0
      );
      return parsedOrderData || [];
    } catch (error) {
      throw error
    }
  }

  async updateAdminWallet(amount: number) {
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

  async updateSellerWallet(orderItems: any[]) {
    try {
      for (const item of orderItems) {
        const transactionExists = await this.prisma.sellerWalletTransaction.findFirst({
          where: {
            order_item_id: item?.id
          }
        })
        if (transactionExists) continue;
        const seller_id = item.seller_id;
        let itemMRP = Number(item.item_metadata.mrp);
        const item_quantity = Number(item.item_quantity)
        const commission_charges = await this.prisma.adminSettings.findFirst({
          where: {
            title: "app-settings",
          }
        })
        const {
          adminCommissionCharges,
        } = commission_charges?.metadata as Record<string, any> || {};

        const totalAmount = itemMRP * item_quantity
        const platformFee = +((totalAmount * adminCommissionCharges) / 100).toFixed(2);
        const sellerEarning = new Decimal(totalAmount - platformFee).toDecimalPlaces(2);

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
            commision_charge: adminCommissionCharges ? `${adminCommissionCharges}%` : "0%",
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

  findAll() {
    return `This action returns all webhook`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webhook`;
  }

  update(id: number, updateWebhookDto: UpdateWebhookDto) {
    return `This action updates a #${id} webhook`;
  }

  remove(id: number) {
    return `This action removes a #${id} webhook`;
  }
}
