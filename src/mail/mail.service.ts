import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { formatDateWithOrdinal } from 'src/common/utils/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addDays } from 'date-fns';
import { OrderService } from '@/customer/order/order.service';
import * as path from 'path';
import * as fs from 'fs';
import handlebars from "handlebars";
import puppeteer from "puppeteer";
import * as numberToWords from 'number-to-words'
import { Attachment } from 'nodemailer/lib/mailer';
@Injectable()

export class MailService {
    constructor(
        private readonly mailer: MailerService,
        private config: ConfigService,
        private prisma: PrismaService,
    ) { }
    async sendResetPasswordEmail(email: string, resetLink: string, token: string = '', isMobile: boolean = false) {
        const mailOptions = {
            to: email,
            subject: 'Reset your password',
            template: './forgot-password',
            context: {
                code: token,
                resetLink: resetLink,
                isMobile: isMobile
            }
        };

        await this.mailer.sendMail(mailOptions);
    }

    async sendOTPEmail(subject: string, email: string, otp: string) {
        try {
            const mailOptions = {
                to: email,
                subject: subject,
                template: './otp-email',
                context: {
                    otp: otp
                }
            };
            await this.mailer.sendMail(mailOptions);
        } catch (error) {
            throw error
        }
    }

    async sendSellerApprovalEmail(email: string, sellerName: string, businessName: string) {
        type SiteMetadata = {
            address1: string;
            platformName: string;
            supportEmail: string;
            supportPhone: string;
        };

        try {
            // const site = await this.prisma.adminSettings.findFirst({
            //     where: {
            //         title: "Site Details"
            //     },
            //     select: {
            //         metadata: true
            //     }
            // })
            // if (site?.metadata && typeof site.metadata === 'object' && !Array.isArray(site.metadata)) {
            //     const details = site.metadata as Record<string, unknown>;
            const platformName = "OutfitHub";
            const supportEmail = "outfithub@gmail.com"
            const currentYear = new Date().getFullYear();
            const subject = `Update on Your Seller Account Application on ${platformName}`

            const mailOptions = {
                to: email,
                subject: subject,
                template: './seller-approval',
                context: {
                    platformName,
                    sellerName: sellerName !== "" ? sellerName : "Seller",
                    businessName,
                    sellerEmail: email,
                    supportEmail,
                    currentYear
                }
            };
            await this.mailer.sendMail(mailOptions);
            // }
        } catch (error) {
            throw error
        }
    }

    async sendSellerRejectEmail(email: string, sellerName: string) {
        type SiteMetadata = {
            address1: string;
            platformName: string;
            supportEmail: string;
            supportPhone: string;
        };

        try {
            // const site = await this.prisma.adminSettings.findFirst({
            //     where: {
            //         title: "Site Details"
            //     },
            //     select: {
            //         metadata: true
            //     }
            // })
            // if (site?.metadata && typeof site.metadata === 'object' && !Array.isArray(site.metadata)) {
            // const details = site.metadata as Record<string, unknown>;
            const platformName = "OutfitHub";
            const supportEmail = "outfithub@gmail.com"
            const currentYear = new Date().getFullYear();
            const today = new Date();
            const formatted = today.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const subject = `Update on Your Seller Account Application on ${platformName}`

            const mailOptions = {
                to: email,
                subject: subject,
                template: './seller-reject',
                context: {
                    platformName,
                    sellerName: sellerName !== "" ? sellerName : "Seller",
                    reviewDate: formatted,
                    sellerEmail: email,
                    supportEmail,
                    currentYear
                }
            };

            await this.mailer.sendMail(mailOptions);

        } catch (error) {
            throw error
        }
    }

    async sendOrderPlaceEmail(customer_id: bigint, orderData: any) {
        try {
            function formatDate(isoString?: string): string {
                if (!isoString) return "--";
                const date = new Date(isoString);
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
            const user = await this.prisma.user.findUnique({
                where: {
                    id: customer_id
                },
                select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_no: true
                }
            })
            const currentYear = new Date().getFullYear();
            const billing = orderData?.order_details?.billing?.metadata
            const shipping = orderData?.order_details?.shipping?.metadata

            const mailOptions = {
                to: user?.email,
                subject: 'Order Placed',
                template: './order-email',
                context: {
                    company: {
                        logo: "",
                        name: "OutfitHub"
                    },
                    customer: {
                        name: `${user?.first_name || user?.last_name
                            ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                            : 'Customer'}`
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
                    payment: {
                        method: "Razorpay",
                        status: orderData.payment_status,
                        txn_id: orderData.rzp_transaction_id,
                        amount: orderData.amount
                    },
                    order: {
                        id: orderData.order_id,
                        date: formatDate(orderData.order_date),
                        items: orderData.order_items.map((item: any) => ({
                            name: item.item_metadata?.name,
                            sku: item.item_metadata?.sku,
                            qty: item.item_quantity,
                            price: item.item_metadata?.mrp,
                            shipping: item.item_metadata?.shipping,
                            tax: item.item_metadata?.tax,
                            categories: item.item_metadata?.categories?.join(", "),
                            seller: item.seller?.sellerProfile?.business_name ||
                                `${item.seller?.first_name} ${item.seller?.last_name}`,
                            status: item.order_status?.title,
                            total: (Number(item.item_metadata?.mrp) * Number(item.item_quantity)).toFixed(2),
                            image: item.item_metadata?.images?.find((img: any) => img.main_image)?.src
                                || item.item_metadata?.images?.[0]?.src
                                || null
                        })),
                    },
                    summary: {
                        subtotal: orderData.order_details?.total_amount,
                        shipping: orderData.order_details?.total_shipping,
                        tax: orderData.order_details?.total_tax,
                        discount: orderData.order_details?.discount_amount,
                        total: orderData.order_details?.order_amount
                    },
                    year: currentYear
                }
            }
            await this.mailer.sendMail(mailOptions);
            return true
        } catch (error) {
            console.log("error", error);
            throw error
        }
    }

    async sendOrderUpdationEmail(customer_id: bigint, order_item_id: bigint, orderData: any, pdfBuffer?: any) {
        try {
            let buffer: any;
            if (pdfBuffer) {
                buffer = Buffer.from(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
            }
            function formatDate(isoString?: string): string {
                if (!isoString) return "--";
                const date = new Date(isoString);
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
            const user = await this.prisma.user.findUnique({
                where: {
                    id: customer_id
                },
                select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_no: true
                }
            })
            const currentYear = new Date().getFullYear();
            const billing = orderData?.order_details?.billing?.metadata
            const shipping = orderData?.order_details?.shipping?.metadata
            const orderItem = orderData.order_items.find(item => item.id == order_item_id);

            const item_qty = Number(orderItem.item_quantity)
            const mrp = Number(orderItem.item_metadata.mrp)
            const taxRate = Number(orderItem.item_metadata.tax)
            const unitPrice = ((mrp) / (1 + taxRate / 100)).toFixed(2);

            const taxAmount = ((Number(mrp) - Number(unitPrice)) * item_qty).toFixed(2)
            const itemTotal = (mrp + Number(orderItem.item_metadata.shipping)) * item_qty
            let bodyMessage = "";
            switch (orderItem.order_status?.title.toLowerCase()) {
                case "confirmed":
                    bodyMessage = `Your order #${orderData.order_id} worth ₹${itemTotal.toFixed(2)} has been confirmed. We’ll ship it soon!`;
                    break;
                case "shipped":
                    bodyMessage = `Your order #${orderData.order_id} worth ₹${itemTotal.toFixed(2)} has been shipped and is on its way to you!`;
                    break;
                case "delivered":
                    bodyMessage = `Hurray🎉! Your order #${orderData.order_id} worth ₹${itemTotal.toFixed(2)} has been delivered. Enjoy your purchase!`;
                    break;
                case "cancelled":
                    bodyMessage = `Your order #${orderData.order_id} worth ₹${itemTotal.toFixed(2)} has been cancelled. If this wasn’t you, contact support.`;
                    break;
                default:
                    bodyMessage = `Your order #${orderData.order_id} worth ₹${itemTotal.toFixed(2)} has been updated.`;
            }

            const mailOptions = {
                to: user?.email,
                subject: 'Order update',
                template: './order-confirm',
                context: {
                    company: {
                        logo: `${process.env.BASE_PATH!}/${process.env.IMAGE_PATH}/site/logo.png`,
                        name: "OutfitHub"
                    },
                    customer: {
                        name: `${user?.first_name || user?.last_name
                            ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                            : 'Customer'}`
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
                    payment: {
                        method: "Razorpay",
                        status: orderData.payment_status,
                        txn_id: orderData.rzp_transaction_id,
                        amount: orderData.amount
                    },
                    order: {
                        id: orderData.order_id,
                        date: formatDate(orderData.order_date),
                        message: "",
                        items: {
                            name: orderItem.item_metadata?.name,
                            sku: orderItem.item_metadata?.sku,
                            qty: orderItem.item_quantity,
                            price: unitPrice,
                            shipping: orderItem.item_metadata?.shipping,
                            tax: orderItem.item_metadata?.tax,
                            categories: orderItem.item_metadata?.categories?.join(", "),
                            seller: orderItem.seller?.sellerProfile?.business_name ||
                                `${orderItem.seller?.first_name} ${orderItem.seller?.last_name}`,
                            status: orderItem.order_status?.title,
                            total: (Number(unitPrice) * Number(item_qty)).toFixed(2),
                            image: orderItem.item_metadata?.images?.find((img: any) => img.main_image)?.src
                                || orderItem.item_metadata?.images?.[0]?.src
                                || null

                        },
                    },
                    summary: {
                        subtotal: (Number(unitPrice) * Number(item_qty)).toFixed(2),
                        shipping: orderItem.item_metadata?.shipping,
                        tax: taxAmount,
                        total: itemTotal.toFixed(2),
                    },
                    year: currentYear,

                },
                ...(buffer && {
                    attachments: [
                        {
                            filename: 'invoice.pdf',
                            content: buffer,
                            contentType: 'application/pdf',
                        }
                    ]
                })
            }
            const send = await this.mailer.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.log("error", error);
            throw error
        }
    }

    // async sendUpdateStatusEmail(subject: string, email: string) {
    //     try {
    //         const mailOptions = {
    //             to: email,
    //             subject: subject,
    //             template: './otp-email',
    //         };
    //         await this.mailer.sendMail(mailOptions);
    //     } catch (error) {
    //         throw error
    //     }
    // }

    async sendTicketEmailToCustomer(ticket_id: string) {
        try {
            const admin = await this.prisma.user.findFirst({
                where: {
                    id: 1
                }
            })
            const supportTicket = await this.prisma.supportTicket.findFirst({
                where: {
                    ticket_id,
                },
                select: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        }
                    },
                    email: true,
                    ticket_id: true,
                    title: true,
                    body: true,
                    attechments: true,
                }
            })
            const currentYear = new Date().getFullYear();
            const recipients = [
                supportTicket?.email,
                admin?.email
            ].filter((email): email is string => Boolean(email));

            const mailOptions = {
                to: recipients,
                subject: 'Support Ticket Submitted',
                template: './support-ticket-submitted',
                context: {
                    customerName: `${supportTicket?.user?.first_name || supportTicket?.user?.last_name
                        ? `${supportTicket?.user?.first_name || ''} ${supportTicket?.user?.last_name || ''}`.trim()
                        : 'Customer'}`,
                    ticketId: ticket_id,
                    issue: supportTicket?.body,
                    attachments: supportTicket?.attechments || [],
                    year: currentYear,
                    company: "OutfitHub"
                },
                attachments: supportTicket?.attechments.map((url, index) => ({
                    filename: `attachment-${index + 1}${url.substring(url.lastIndexOf('.'))}`,
                    path: url,
                }))
            };
            const send = await this.mailer.sendMail(mailOptions);
            return true
        } catch (error) {
            throw error
        }
    }

}
