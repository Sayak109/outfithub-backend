import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { AttributesModule } from './attributes/attributes.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { SellerModule } from './seller/seller.module';
import { BlockedKeywordsModule } from './blocked-keywords/blocked-keywords.module';
import { CouponModule } from './coupon/coupon.module';
import { OtpModule } from './otp/otp.module';
import { SellerProductModule } from './seller-product/seller-product.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { ReelsModule } from './reels/reels.module';
import { CartModule } from './customer/cart/cart.module';
import { SellerAggrementModule } from './seller-aggrement/seller-aggrement.module';
import { LiveModule } from './live/live.module';
import { CustomerProductModule } from './customer/product/product.module';
import { CustomerReelsModule } from './customer/reels/reels.module';
import { CustomerOrderModule } from './customer/order/order.module';
import { CustomerLiveModule } from './customer/live/live.module';
import { WishlistModule } from './customer/wishlist/wishlist.module';
import { CustomerExploreModule } from './customer/explore/buyer-explore.module';
import { AddressModule } from './customer/address/address.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhookModule } from './webhook/webhook.module';
import { TaskModule } from './task/task.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationModule } from './notification/notification.module';
import { SettingsModule } from './settings/settings.module';
import { FaqModule } from './faq/faq.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DynamicPagesModule } from './dynamic-pages/dynamic-pages.module';
import { AccountModule } from './account/account.module';
import { SellerfrontModule } from './customer/sellerfront/sellerfront.module';
import { AllsellerModule } from './customer/allseller/allseller.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    PrismaModule,
    MailModule,
    SettingsModule,
    AdminModule,
    AttributesModule,
    CategoryModule,
    ProductModule,
    SellerModule,
    BlockedKeywordsModule,
    CouponModule,
    OtpModule,
    SellerProductModule,
    AdminSettingsModule,
    ReelsModule,
    SellerAggrementModule,
    LiveModule,
    OrdersModule,
    CustomerProductModule,
    CartModule,
    AddressModule,
    CustomerOrderModule,
    CustomerReelsModule,
    CustomerLiveModule,
    WishlistModule,
    CustomerExploreModule,
    WalletModule,
    WebhookModule,
    TaskModule,
    DeliveryModule,
    NotificationModule,
    FaqModule,
    SupportTicketModule,
    FeedbackModule,
    DashboardModule,
    DynamicPagesModule,
    AccountModule,
    SellerfrontModule,
    AllsellerModule,
    MenuModule,
  ],
  providers: [
    MailService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
