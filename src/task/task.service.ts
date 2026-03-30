import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import Razorpay = require("razorpay");
import { WebhookService } from '@/webhook/webhook.service';
import { createNotification, decryptData } from '@/common/helper/common.helper';
import { OrderService } from '@/customer/order/order.service';
import { SettingsService } from '@/settings/settings.service';

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly webhookService: WebhookService,
        private settingService: SettingsService
    ) { }

    @Cron(CronExpression.EVERY_10_MINUTES) // Runs everyday every hour
    // @Cron(CronExpression.EVERY_MINUTE) // Runs everyday every minute
    async razorpayPaymentFailedOrderCheck() {
        try {
            console.log(`[Cron] Run everyday every in 10 minutes to check razorpay payment failed order.`);
            const tenMinutesAgo = new Date(Date.now() - 9 * 60 * 1000);
            const orderData = await this.prisma.order.findMany({
                orderBy: {
                    id: "desc"
                },
                take: 20,
                where: {
                    payment_status: "created",
                    order_date: { lt: tenMinutesAgo },
                    rzp_order_id: {
                        not: ''
                    }
                },
                select: {
                    id: true,
                    amount: true,
                    rzp_order_id: true,
                    customer_id: true,
                    order_items: {
                        select: {
                            seller_id: true,
                        }
                    }
                },
            })

            for (const order of orderData) {
                if (!order?.rzp_order_id && order?.rzp_order_id != null && order?.rzp_order_id != '') {
                    continue;
                }
                const decryptedRes = await this.settingService.paymentSettings();
                const RazorpaySetting = decryptData(decryptedRes)
                const razorpay = new Razorpay({
                    key_id: RazorpaySetting.RAZORPAY_KEY_ID!,
                    key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET!
                });
                const payments = await razorpay.orders.fetchPayments(order?.rzp_order_id);
                if (payments?.items.length !== 0) {
                    for (const payment of payments?.items) {
                        if (payment.status === "captured") {
                            let order_id = payment.notes.order_id;
                            const amount = +(payment.amount) / 100;

                            let orderDetails = await this.prisma.order.findUnique({
                                where: {
                                    id: BigInt(order_id)
                                },
                                select: {
                                    id: true,
                                    amount: true,
                                }
                            });

                            if (orderDetails && orderDetails?.id) {
                                let orderAmount = +(orderDetails.amount);
                                let razorpayAmount = +amount;

                                if (orderAmount !== razorpayAmount) {
                                    await this.prisma.orderItems.updateMany({
                                        where: {
                                            order_id: BigInt(order_id)
                                        },
                                        data: {
                                            order_status_id: 7
                                        }
                                    })
                                } else {
                                    const orderStatusRes = await this.prisma.orderItems.updateMany({
                                        where: {
                                            order_id: order.id,
                                        },
                                        data: {
                                            order_status_id: 2
                                        },
                                    });
                                    await this.prisma.order.update({
                                        where: {
                                            id: BigInt(order_id)
                                        },
                                        data: {
                                            rzp_transaction_id: payment.id,
                                            payment_status: "paid"
                                        },
                                    });
                                    const { orderId, amount, images, customerhaveInappPreferance, notificationSend } = await this.InAppNotification(order)
                                    if (!notificationSend && customerhaveInappPreferance) {
                                        await createNotification(
                                            order.customer_id,
                                            "ORDER_PLACED",
                                            "Order Placed",
                                            `Your order #${orderId} worth ₹${amount} has been placed successfully.`,
                                            {
                                                id: Number(order_id),
                                                order_id: orderId,
                                                amount: amount,
                                            },
                                            JSON.stringify(images)
                                        );
                                    }
                                    const orderData = await this.webhookService.orderData(order.id, order.customer_id);
                                    await this.webhookService.updateAdminWallet(+order.amount)
                                    await this.webhookService.updateSellerWallet(orderData.order_items);
                                }
                            }
                        }
                    }
                } else {
                    await this.prisma.orderItems.updateMany({
                        where: {
                            order_id: BigInt(order.id)
                        },
                        data: {
                            order_status_id: 7
                        }
                    })
                    const { orderId, amount, images, customerhaveInappPreferance, notificationSend } = await this.InAppNotification(order)
                    if (!notificationSend && customerhaveInappPreferance) {
                        await createNotification(
                            order.customer_id,
                            "ORDER_STATUS",
                            "Order Update",
                            `Oops😕. Payment for order #${orderId} worth ₹${amount} failed. Please try again.`,
                            {
                                id: Number(order.id),
                                order_id: orderId,
                                amount: amount,
                            },
                            JSON.stringify(images)
                        );
                    }
                }
            }
            return "status updated";
        } catch (error) {
            console.log('payment Failed Cron error: ', error);
        }
    }

    private async InAppNotification(order: any) {
        const orderData = await this.webhookService.orderData(order.id, order.customer_id);
        const orderId = orderData.order_id
        const images: string[] = [];
        orderData.order_items.forEach(item => {
            const imagesArray = item.item_metadata?.images || [];
            const mainImage = imagesArray.find(img => img.main_image === true);
            const imageSrc = mainImage?.src || imagesArray[0]?.src || '';
            if (imageSrc) images.push(imageSrc);
        });

        const customerhaveInappPreferance = await this.prisma.notificationPreference.count({
            where: {
                user_id: order.customer_id,
                preference_category_id: 5
            }
        })
        const notificationSend = await this.prisma.inAppNotifications.findFirst({
            where: {
                user_id: order.customer_id,
                AND: [
                    {
                        metadata: {
                            path: ["order_id"],
                            equals: Number(order.id),
                        },
                    }
                ],
            },
        })
        return {
            id: order.id, orderId: orderId,
            amount: orderData.amount, images: images,
            customerhaveInappPreferance: customerhaveInappPreferance,
            notificationSend: notificationSend
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS) // Runs everyday every minute
    async sendInAppNotificationToSellers() {
        try {
            const tenMinutesAgo = new Date(Date.now() - 9 * 60 * 1000);
            const orderData = await this.prisma.order.findMany({
                orderBy: {
                    id: "desc"
                },
                take: 10,
                where: {
                    payment_status: "paid",
                    order_date: tenMinutesAgo,
                    rzp_transaction_id: {
                        not: ''
                    }
                },
                select: {
                    id: true,
                    amount: true,
                    rzp_order_id: true,
                    customer_id: true,
                    order_items: {
                        select: {
                            id: true,
                            item_quantity: true,
                            item_metadata: true,
                            total_item_amount: true,
                            seller_id: true,
                            product: {
                                select: {
                                    name: true,
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
                        }
                    },
                },
            })
            for (const order of orderData) {
                for (const items of order.order_items) {
                    const sellerhaveInappPreferance = await this.prisma.notificationPreference.count({
                        where: {
                            user_id: items.seller_id,
                            preference_category_id: 5
                        }
                    })
                    const notificationSend = await this.prisma.inAppNotifications.findFirst({
                        where: {
                            user_id: items.seller_id,
                            AND: [
                                {
                                    metadata: {
                                        path: ["seller_id"],
                                        equals: Number(items.seller_id),
                                    },
                                },
                                {
                                    metadata: {
                                        path: ["order_id"],
                                        equals: Number(order.id),
                                    },
                                },
                                {
                                    metadata: {
                                        path: ["order_item_id"],
                                        equals: Number(items?.id),
                                    },
                                },
                            ],
                        },
                    })
                    if (!notificationSend && sellerhaveInappPreferance) {
                        await createNotification(
                            items.seller_id,
                            "ORDER_PLACED",
                            "Order Placed",
                            `New Order Alert! Product: ${items.product?.name} has been ordered. Time to get it ready!`,
                            {
                                seller_id: Number(items.seller_id),
                                order_id: Number(order.id),
                                order_item_id: Number(items.id),

                            },
                        );
                    }
                }
            }
        } catch (error) {
            this.logger.error("Error running cron job: ", error);
        }
    }

    @Cron('0 0 * * *')
    async deleteExpiredTokens() {
        try {
            const result = await this.prisma.userToken.deleteMany({
                where: {
                    expires_at: { lt: new Date() },
                },
            });

            if (result.count > 0) {
                console.log(`[Cron] Deleted ${result.count} expired tokens`);
            }
        } catch (error) {
            this.logger.error("Error running cron job: ", error);
        }
    }

    @Cron('0 0 * * *')
    async deleteOldLogs() {
        await this.prisma.adminActivityLog.deleteMany({
            where: {
                created_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // keep 30 days
            },
        });
    }
}
