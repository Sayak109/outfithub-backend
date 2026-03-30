import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { CartService } from '@/customer/cart/cart.service';
import { ProductService } from '@/customer/product/product.service';
import { SettingsService } from '@/settings/settings.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, SettingsService],
})
export class WebhookModule { }
