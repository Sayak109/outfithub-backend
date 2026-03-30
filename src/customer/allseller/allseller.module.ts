import { Module } from '@nestjs/common';
import { AllsellerService } from './allseller.service';
import { AllsellerController } from './allseller.controller';

@Module({
  controllers: [AllsellerController],
  providers: [AllsellerService],
})
export class AllsellerModule {}
