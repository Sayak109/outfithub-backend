import { Module } from '@nestjs/common';
import { DynamicPagesService } from './dynamic-pages.service';
import { DynamicPagesController } from './dynamic-pages.controller';

@Module({
  controllers: [DynamicPagesController],
  providers: [DynamicPagesService],
})
export class DynamicPagesModule { }
