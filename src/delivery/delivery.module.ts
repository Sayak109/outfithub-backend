import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MailService } from '@/mail/mail.service';
import { OrderService } from '@/customer/order/order.service';
import { CartService } from '@/customer/cart/cart.service';
import { SettingsService } from '@/settings/settings.service';
import { ProductService } from '@/customer/product/product.service';
import { NotificationService } from '@/notification/notification.service';
import { FirebaseAdminService } from '@/utils/firebase';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, MailService, OrderService, CartService,
    SettingsService, ProductService, NotificationService, FirebaseAdminService],
})
export class DeliveryModule { }
