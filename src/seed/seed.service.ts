import { Injectable } from '@nestjs/common';
import { hashPassword } from '../common/utils/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/helper/common.helper';

@Injectable()
export class SeedService {
    constructor(private prisma: PrismaService) { }

    async seed() {
        const adminSettingCount = await this.prisma.adminSettings.count();

        if(adminSettingCount > 0) {
            console.log("Database already seeded.");
            return;
        }
        
        //Approval Status
        await this.prisma.approvalStatus.createMany({
            data: [
                {
                    title: "pending"
                },
                {
                    title: "approved"
                },
                {
                    title: "rejected"
                }
            ]
        })

        //Account Status
        await this.prisma.accountStatus.createMany({
            data: [
                {
                    title: "active"
                },
                {
                    title: "suspended"
                },
                {
                    title: "deactivated"
                },
                {
                    title: "reactivated"
                }
            ]
        })

        //Payout Status
        await this.prisma.payoutStatus.createMany({
            data: [
                {
                    title: "on-hold"
                },
                {
                    title: "paid"
                },
                {
                    title: "scheduled"
                },
            ]
        })


        //Status
        await this.prisma.status.createMany({
            data: [
                {
                    title: "active"
                },
                {
                    title: "inactive"
                }
            ]
        })

        //Role
        await this.prisma.role.createMany({
            data: [
                {
                    title: "admin"
                },
                {
                    title: "operator"
                },
                {
                    title: "seller"
                },
                {
                    title: "buyer"
                },
                {
                    title: "guest"
                }
            ]
        })

        //Order Status
        await this.prisma.orderStatus.createMany({
            data: [
                {
                    title: "pending"
                },
                {
                    title: "processing"
                },
                {
                    title: "confirmed"
                },
                {
                    title: "shipped"
                },
                {
                    title: "delivered"
                },
                {
                    title: "cancelled"
                },
                {
                    title: "failed"
                },
                {
                    title: "refunded"
                },
                {
                    title: "on-hold"
                },
                {
                    title: "returned"
                },
                {
                    title: "return processing"
                },
                {
                    title: "out for delivery"
                },
                {
                    title: "return pending"
                },
                {
                    title: "return rejected"
                },
            ]
        })

        // Notification Praference Category
        await this.prisma.notificationPreferenceCategory.createMany({
            data: [
                {
                    name: "Push",
                    key: "_push",
                    checked: true,
                    parent: null
                },
                {
                    name: "WhatsApp",
                    key: "_whatsapp",
                    checked: true,
                    parent: null
                },
                {
                    name: "Email",
                    key: "_email",
                    checked: true,
                    parent: null
                },
                {
                    name: "SMS",
                    key: "_sms",
                    checked: true,
                    parent: null
                },
                {
                    name: "InApp",
                    key: "_inapp",
                    checked: true,
                    parent: null
                },
            ]
        })

        //Seller Aggrement
        await this.prisma.sellerAggrement.createMany({
            data: [
                {
                    title: "Eligibility",
                    desc: "You must be at least 18 years old and legally authorized to enter into binding contracts in your jurisdiction to register as a seller on the YumDut platform."
                },
                {
                    title: "Account Registration",
                    desc: "You agree to provide accurate, complete, and up-to-date information during registration and to keep your account details current at all times."
                },
                {
                    title: "Product Listings",
                    desc: "All products you list must comply with YumDut’s content policies, applicable laws, and regulations. You are responsible for the accuracy of your product descriptions, images, and pricing."
                },
                {
                    title: "Pricing & Fees",
                    desc: "You agree to YumDut’s seller fees, commission structure, and payment terms as published on the seller dashboard. Fees may be updated by YumDut with 30 days’ notice."
                },
                {
                    title: "Order Fulfillment",
                    desc: "You must ship orders within the timeframes you commit to, provide valid tracking information, and handle returns and refunds in accordance with YumDut’s policies."
                },
                {
                    title: "Intellectual Property",
                    desc: "You represent and warrant that you own or have the necessary rights to all content and materials you upload. You grant YumDut a worldwide, royalty-free license to display that content on the platform."
                },
                {
                    title: "Termination",
                    desc: "YumDut may suspend or terminate your seller account at any time for breach of these terms or for any conduct that YumDut deems harmful to the platform or its users."
                }
            ]
        })

        await this.prisma.user.createMany({
            data: [
                {
                    first_name: "Super",
                    last_name: "Admin",
                    email: "admin@gmail.com",
                    password: await hashPassword("hf74@A7rd#iT&XQ"),
                    provider: "EMAIL",
                    role_id: 1,
                    approval_status_id: 2,
                    account_status_id: 1
                }
            ]
        });

        //Attribute
        await this.prisma.productAttribute.create({
            data: {
                name: "Colour",
                slug: "colour",
            }
        })

        // ["Home","Explore","Search","Privacy Policy","Terms of Service","About Us","Account Data Policy"]
        // Pages
        await this.prisma.dynamicPage.createMany({
            data: [
                {
                    title: "Home",
                    slug: await generateSlug(
                        "Home",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "Explore",
                    slug: await generateSlug(
                        "Explore",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "Search",
                    slug: await generateSlug(
                        "Search",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "Privacy Policy",
                    slug: await generateSlug(
                        "Privacy Policy",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "Terms of Service",
                    slug: await generateSlug(
                        "Terms of Service",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "About Us",
                    slug: await generateSlug(
                        "About Us",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
                {
                    title: "Account Data Policy",
                    slug: await generateSlug(
                        "Account Data Policy",
                        this.prisma.dynamicPage,
                        'slug'
                    ),
                },
            ]
        })

        // //Admin Settings
        await this.prisma.adminSettings.create({
            data: {
                title: "payment-settings",
                metadata: {
                    razorpayid: "rzp_test_4zb9K0qHh06srW",
                    razorpaysecretkey: "B8uxIDjFDuk5MbB9Nq4q9YF8"
                }
            }
        })

        console.log('Seed data inserted');
    }
}
