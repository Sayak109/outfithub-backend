import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SettingsService } from '@/settings/settings.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, SettingsService],
})
export class OrdersModule { }
