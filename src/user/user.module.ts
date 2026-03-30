import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [UserController],
  providers: [UserService, MailService],
})
export class UserModule { }
