import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { MailService } from '@/mail/mail.service';

@Module({
  controllers: [SupportTicketController],
  providers: [SupportTicketService, MailService],
})
export class SupportTicketModule { }
