import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserService } from 'src/user/user.service';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from '@/mail/mail.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminController],
  providers: [AdminService, JwtStrategy, MailService],
})
export class AdminModule { }
