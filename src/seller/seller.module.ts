import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { DeliveryService } from '@/delivery/delivery.service';
import { MailService } from '@/mail/mail.service';
import { OrderService } from '@/customer/order/order.service';
import { CartService } from '@/customer/cart/cart.service';
import { SettingsService } from '@/settings/settings.service';
import { ProductService } from '@/customer/product/product.service';
import { NotificationService } from '@/notification/notification.service';
import { FirebaseAdminService } from '@/utils/firebase';
@Module({
  controllers: [SellerController],
  providers: [SellerService, DeliveryService, MailService, OrderService,
    CartService, SettingsService, ProductService, NotificationService, FirebaseAdminService],
})
export class SellerModule { }
