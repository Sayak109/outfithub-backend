import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';

@Module({
  controllers: [AttributesController],
  providers: [JwtStrategy, AttributesService],
})
export class AttributesModule { }
