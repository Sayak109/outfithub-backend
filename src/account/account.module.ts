import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { OtpService } from '@/otp/otp.service';
import { MailService } from '@/mail/mail.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, OtpService, MailService],
})
export class AccountModule { }
