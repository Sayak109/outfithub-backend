import { Module } from '@nestjs/common';
import { BlockedKeywordsService } from './blocked-keywords.service';
import { BlockedKeywordsController } from './blocked-keywords.controller';

@Module({
  controllers: [BlockedKeywordsController],
  providers: [BlockedKeywordsService],
})
export class BlockedKeywordsModule {}
