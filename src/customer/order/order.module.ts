import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartService } from '@/customer/cart/cart.service';
import { ProductService } from '../product/product.service';
import { SettingsService } from '@/settings/settings.service';
import { MailService } from '@/mail/mail.service';
import { NotificationService } from '@/notification/notification.service';
import { FirebaseAdminService } from '@/utils/firebase';

@Module({
  controllers: [OrderController],
  providers: [OrderService, CartService, ProductService, SettingsService,
    MailService, NotificationService, FirebaseAdminService],
})
export class CustomerOrderModule { }
