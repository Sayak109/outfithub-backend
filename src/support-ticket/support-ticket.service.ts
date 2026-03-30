import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';


@Injectable()
export class SupportTicketService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) { }

  async create(ticket_id: string, createSupportTicketDto: CreateSupportTicketDto,
    files: { type: string; filename: string; path: string }[]) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: createSupportTicketDto.email,
            mode: 'insensitive',
          },
        },
      });
      const filepath = files.map(
        (fp) => `${process.env.BASE_PATH}/${fp.path}`
      );

      const createTicket = await this.prisma.supportTicket.create({
        data: {
          email: createSupportTicketDto.email,
          user_id: user?.id,
          ticket_id: ticket_id,
          title: createSupportTicketDto.title,
          body: createSupportTicketDto.body,
          attechments: filepath,
        }
      })
      setImmediate(async () => {
        try {
          const send = await this.mailService.sendTicketEmailToCustomer(createTicket.ticket_id)
        } catch (error) {
          console.error("Error sending reject email", error);
        }
      });
      return createTicket
    } catch (error) {
      throw error
    }
  }

  findAll() {
    return `This action returns all supportTicket`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supportTicket`;
  }

  update(id: number, updateSupportTicketDto: UpdateSupportTicketDto) {
    return `This action updates a #${id} supportTicket`;
  }

  remove(id: number) {
    return `This action removes a #${id} supportTicket`;
  }
}
